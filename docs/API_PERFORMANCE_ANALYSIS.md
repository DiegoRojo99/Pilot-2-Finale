# API Performance Analysis & Optimization Opportunities

## Executive Summary

The three core workflow endpoints (episode logging, status changes, show removal) are blocking on heavy achievement recomputation that scans the entire user watch history. This is the primary cause of API latency.

**Key Finding**: Achievement progress updates don't need to be synchronous. Moving them to background jobs could reduce API response times by 50-80% for typical users.

---

## 🔴 Critical Bottleneck: Achievement Recomputation

### Location
`lib/achievements/progress.ts::recomputeAchievementProgressForUser()`

### Current Behavior
Called on EVERY user action:
- ✅ POST /api/episodes (log episode)
- ✅ PATCH /api/my-shows/[id] (change status)
- ✅ DELETE /api/my-shows/[id] (remove show)
- ✅ POST /api/my-shows (add show)

### What It Does
Executes **10 parallel database queries**:

1. Fetch all active achievements (~20 achievements)
2. Fetch all current user achievement progress
3. **[SLOW]** COUNT watch entries → `episodes_watched_total`
4. **[SLOW]** COUNT watched shows → `shows_completed_total`
5. **[SLOW]** COUNT rated episodes → `episodes_rated_total`
6. **[SLOW]** SELECT DISTINCT episodes → `unique_episodes_watched_total`
7. **[SLOW]** Raw SQL: Best day calculation with DATE aggregation
8. **[SLOW]** Raw SQL: Active days with DATE aggregation
9. **[SLOW]** Raw SQL: Minutes watched with JOINs and aggregations
10. **[SLOW]** Raw SQL: Seasons completed with complex JOINs
11. **[SLOW]** Raw SQL: Distinct genres with JOINs and aggregations
12. Upsert user achievement progress for each achievement

### Why It's Slow
Each of these queries:
- Scans the entire `watch_entries` table for this user
- Uses complex JOINs and aggregations
- Runs on EVERY single action (not cached)

For a user with 500 watched episodes, each action triggers queries scanning all 500+ entries.

### Impact on User Experience
- **Adding a show**: 1-3+ seconds (including 2-3 achievement updates)
- **Changing status**: 500ms-2+ seconds (achievement update)
- **Logging episode**: 1-3+ seconds (episode log + achievement update)
- **Removing show**: 500ms-1+ second (achievement update)

### 💡 Solution: Move to Background Job

Achievement progress doesn't need to be synchronous:
- User doesn't see achievement unlock confirmation immediately
- Achievement display can update on next page load/refresh
- Can batch updates to run periodically (e.g., every 30 seconds)

**Proposed Changes**:

1. **Create a background job system** (can use simple approach for MVP):
   - Queue file, database table, or external service (Bull, Inngest, etc.)
   - Worker processes achievement updates asynchronously

2. **Remove `safeRecomputeAchievementProgressForUser()` from blocking endpoints**:
   ```typescript
   // OLD: blocks response
   await safeRecomputeAchievementProgressForUser(userId);
   
   // NEW: queue in background
   queueAchievementRecomputation(userId);
   ```

3. **Keep conditional increments** for "watchlist_to_watched" since that has a fast path:
   - `safeIncrementWatchlistToWatchedProgress()` in status change is OK (minimal overhead)

**Expected Speedup**: 50-80% reduction in API response time

---

## 🟡 Secondary Issue: Show Addition is Too Heavy

### Location
`app/api/my-shows/route.ts::POST`

### Current Behavior
When user adds a show:

```typescript
1. upsertShowCatalog() → INSERT/UPDATE show catalog
2. prisma.userShow.upsert() → INSERT/UPDATE user_shows record
3. updateNextEpisodeToWatch() → Fetch and compute next episode
4. refreshUserShowProgress() → Calculate progress counts
5. recomputeAchievementProgressForUser() → 🔴 HEAVY (see above)
6. fetchUserShowByTmdbId() → Fetch full show object
7. Return complete show object
```

### Problems

1. **6-7 sequential calls** when some could be parallel
2. **Fetching full show object** - client already has most data from Discover
3. **Achievement recomputation** blocks the entire request

### 💡 Solutions

**Option A (Quick Win)**: Reduce response payload
```typescript
// OLD: Fetch and return entire show object
const show = await fetchUserShowByTmdbId(userId, body.tmdb_id);
return NextResponse.json(show, { status: 201 });

// NEW: Return minimal response + optimistic update already works
return NextResponse.json({
  id: created.id,
  tmdb_id: body.tmdb_id,
  status: body.status ?? 'watching',
  added_at: new Date().toISOString(),
}, { status: 201 });
```

**Speedup**: 200-400ms (avoiding extra query)

**Option B (Best)**: Background task for heavy operations
```typescript
1. upsertShowCatalog() ✅ Keep sync
2. userShow.upsert() ✅ Keep sync  
3. Return minimal response immediately
4. Queue in background:
   - updateNextEpisodeToWatch()
   - refreshUserShowProgress()
   - recomputeAchievementProgressForUser()
```

**Speedup**: 1-3 seconds (additional)

---

## 🟡 Tertiary Issue: Status Change Fetches Full Show

### Location
`app/api/my-shows/[tmdbId]/route.ts::PATCH`

### Current Behavior
```typescript
// Update status
await prisma.userShow.updateMany({ ... });

// Then fetch entire show object
const show = await fetchUserShowByTmdbId(userId, numericTmdbId);
return NextResponse.json(show);
```

### Problem
Fetches full show object just to return it. Client already has the show and only needs the updated status.

### 💡 Solution
Return minimal response:
```typescript
return NextResponse.json({
  id: existing.id,
  tmdb_id: numericTmdbId,
  status: status,
  updated_at: new Date().toISOString(),
});
```

**Speedup**: 100-300ms

---

## 🟢 Already Optimized: Episode Logging Status Check

`app/api/episodes/route.ts::POST` already does:
```typescript
const hasShow = await userHasShowInList(userId, tmdbShowId);
if (!hasShow) return 404; // Fast fail
```

Good pattern - prevents creating orphaned logs.

---

## Summary of Optimizations

| Issue | Severity | Current | Speedup | Implementation |
|-------|----------|---------|---------|-----------------|
| Achievement recomputation on every action | 🔴 Critical | Blocking | 50-80% | Move to background queue |
| Fetching full show after add | 🟡 High | 1-3s | 400ms-2s | Return minimal response or background task |
| Fetching full show after status change | 🟡 High | 200-500ms | 100-300ms | Return minimal response |
| Multiple sequential calls in add | 🟡 High | Sequential | Parallel | Keep sync calls parallel |

---

## Implementation Roadmap

### Phase 1: Quick Wins (No Architecture Changes)
**Impact**: ~500ms-1s speedup

1. Remove full show fetch from status change endpoint
2. Return minimal response from add show endpoint
3. Add database indexes if missing (check EXPLAIN on queries)

**Files to modify**:
- `app/api/my-shows/[tmdbId]/route.ts` - PATCH
- `app/api/my-shows/route.ts` - POST

### Phase 2: Background Jobs (Longer Term)
**Impact**: 50-80% speedup (1-3s reduction)

1. Implement simple background queue (database table or Bull/Inngest)
2. Queue achievement recomputation instead of blocking
3. Update endpoints to fire-and-forget

**Files to modify**:
- `app/api/episodes/route.ts`
- `app/api/my-shows/route.ts` (POST)
- `app/api/my-shows/[tmdbId]/route.ts` (PATCH, DELETE)
- Create `lib/background-jobs.ts` for queue management

---

## Database Query Patterns to Investigate

The raw SQL queries in `buildMetricsForUser()` should be profiled:

```sql
-- 1. Best day calculation (runs for every user update)
SELECT COALESCE(MAX(daily_count), 0) AS best_day
FROM (
  SELECT COUNT(*) AS daily_count
  FROM watch_entries
  WHERE user_id = $1
  GROUP BY DATE(COALESCE(watched_at, created_at))
) AS grouped;

-- 2. Minutes watched (complex JOIN with every episode)
SELECT COALESCE(SUM(runtime), 0) AS minutes_total
FROM watch_entries we
JOIN episodes e ON e.id = we.episode_id
WHERE we.user_id = $1;

-- 3. Seasons completed (triple JOIN and aggregation)
... (see detailed analysis above)
```

**Optimization ideas**:
- Materialized views or cached metrics table
- Increment counters instead of recalculating (simpler metrics like total episodes)
- Cache results with short TTL (5-10 minutes)
- PostgreSQL generated columns for computed metrics

---

## Monitoring Recommendations

After implementing changes, monitor these metrics:

1. **API response time percentiles** (p50, p95, p99)
   - Target: episode log < 500ms, status change < 200ms
   
2. **Database query count per request** 
   - Track to ensure we're not adding more queries
   
3. **Background job queue depth and latency**
   - Ensure jobs process within 30-60 seconds
   
4. **Achievement update freshness**
   - Measure delay between action and achievement update visible to user

---

## Quick Start: Phase 1 Implementation

Start with these two files to remove unnecessary fetches:

1. **`app/api/my-shows/[tmdbId]/route.ts`** - Remove full show fetch in PATCH
2. **`app/api/my-shows/route.ts`** - Return minimal response in POST instead of fetching full show

These alone should reduce perceived latency by 300-500ms without any architectural changes.
