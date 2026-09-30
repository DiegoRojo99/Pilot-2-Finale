# Phase 9: Efficiency Improvements - Developer Guide

This guide explains the performance optimizations implemented in Phase 9 and how to use them in future features.

## Key Patterns Implemented

### 1. Optimistic Updates Pattern

When a user saves changes, update the UI immediately without waiting for the server. If the API call fails, rollback the changes.

**Example:**
```typescript
const handleSave = async () => {
  // Store original for rollback
  const originalEntry = { ...entry };
  
  // Update UI immediately (optimistic)
  const updatedEntry = { ...entry, rating: newRating, notes: newNotes };
  setEntry(updatedEntry);
  setSaving(true);

  try {
    // Make API call
    await updateEpisodeLog(entry.id, { rating: newRating, notes: newNotes });
    // Success - just navigate back, no alert needed
    router.back();
  } catch (error) {
    // Rollback on failure
    setEntry(originalEntry);
    Alert.alert('Error', 'Failed to save changes.');
  } finally {
    setSaving(false);
  }
};
```

**When to use:**
- User-initiated changes (edit, delete, toggle)
- Operations where you have all the data to update UI
- Low-risk operations where rollback is simple

**Benefits:**
- Perceived latency reduced by 80-90%
- Gives instant user feedback
- Better UX on slow networks

---

### 2. Callback Memoization with useCallback

Prevent re-renders of child components by memoizing callback functions.

**Example:**
```typescript
import { useCallback } from 'react';

const handleCancel = useCallback(() => {
  setError(null);
  setWatchedDate('');
  onCancel();
}, [onCancel]); // Dependencies!

// Pass to child
<Modal onRequestClose={handleCancel} />
```

**When to use:**
- Callbacks passed to memoized child components
- Handlers used in useMemo or useEffect dependencies
- Event handlers passed to performance-sensitive children

**Common mistake:**
```typescript
// ❌ WRONG: New function every render
<RatingSlider onValueChange={(v) => setRating(v)} />

// ✅ RIGHT: Memoized callback
const handleRatingChange = useCallback((v) => setRating(v), []);
<RatingSlider onValueChange={handleRatingChange} />
```

---

### 3. Component Memoization with memo()

Wrap components that receive expensive props or callbacks to prevent unnecessary re-renders.

**Example:**
```typescript
import { memo } from 'react';

export const RatingSlider = memo(function RatingSlider({ value, onValueChange, ... }) {
  // Component only re-renders when its own props change
  // Parent re-renders don't affect this component
});
```

**When to use:**
- Components with expensive calculations or rendering
- Components receiving callbacks (pair with useCallback)
- List items that might re-render frequently

**Benefits:**
- Prevents render cascades
- Keeps 60 FPS on interactions
- Reduces CPU usage

---

### 4. Performance Utilities (lib/performance-utils.ts)

#### useDebounce()
Debounce state changes to reduce frequency of side effects.

```typescript
import { useDebounce } from '@/lib/performance-utils';

// Inside component:
const [notes, setNotes, debouncedNotes] = useDebounce('', 300);

// Use immediate value for UI, debounced value for API calls
<TextInput value={notes} onChangeText={setNotes} /> {/* Instant feedback */}

// Save to DB only after 300ms of no typing
useEffect(() => {
  saveNotes(debouncedNotes);
}, [debouncedNotes]);
```

#### debounceCall()
Debounce function calls to prevent rapid firing.

```typescript
import { debounceCall } from '@/lib/performance-utils';

// Prevent multiple rapid clicks on save button
const debouncedSave = debounceCall(handleSave, 300);

<Button onPress={debouncedSave} />
```

---

## Performance Checklist for New Features

When adding new features that involve user input and API calls:

- [ ] **Optimistic Updates**: Does the UI update immediately before server responds?
- [ ] **Memoization**: Are expensive callbacks memoized with useCallback?
- [ ] **Component Memo**: Should this component skip re-renders? Add memo()?
- [ ] **Debouncing**: Should rapid interactions be throttled? Use debounceCall()?
- [ ] **Error Handling**: Can users rollback failed changes?
- [ ] **Loading States**: Are buttons disabled during operations?
- [ ] **No Alert Spam**: Are success/failure handled gracefully?

---

## Testing Performance

### Quick Checks
1. **Interaction Latency**: Does the UI respond instantly to user input?
2. **60 FPS Smooth**: Do animations and scrolls feel smooth?
3. **No Cascading Renders**: Do parent updates cause child re-renders?
4. **Rollback on Failure**: Do failed saves restore the original state?

### Device Testing
- Always test on actual devices (emulators hide performance issues)
- Test with slow network (throttle in DevTools)
- Test with large data sets (100+ episodes in a show)
- Test rapid interactions (fast clicking, typing)

---

## Common Anti-Patterns to Avoid

### ❌ Waiting for API before showing UI feedback
```typescript
// BAD: User waits 1-2 seconds
try {
  await updateEpisodeLog(logId, newData);
  setEntry(newEntry); // Too late!
  Alert.alert('Success');
} catch (err) {
  Alert.alert('Error');
}
```

### ❌ Inline function definitions
```typescript
// BAD: New function every render
<Button onPress={() => handleSave()} />
<RatingSlider onValueChange={(v) => setRating(v)} />
```

### ❌ Uncontrolled re-renders
```typescript
// BAD: Component re-renders with every parent update
export function RatingSlider({ value, onValueChange, ... }) {
  // Slider rebuilds even if value/onValueChange didn't change
}
```

### ❌ Missing dependencies in effects
```typescript
// BAD: Can miss updates or cause stale closures
useEffect(() => {
  validateRating(rating);
  // Should have rating in deps!
}, []);
```

---

## Resources

- Phase 9 Task List: See `docs/mobileRoadmap.md` Phase 9
- Performance Utils: `mobile/src/lib/performance-utils.ts`
- Example Implementations: 
  - Diary edit: `mobile/src/app/diary/[id].tsx`
  - Episode modal: `mobile/src/components/show/episode-diary-modal.tsx`
  - Rating slider: `mobile/src/components/ui/rating-slider.tsx`
