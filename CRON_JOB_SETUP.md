# Next Episode Update Cron Job Setup

## Overview

This cron job updates the "next episode to watch" for all user shows daily. When a new episode is released, it will automatically be reflected as the next episode without requiring user action.

## Endpoint

```
POST /api/admin/update-next-episodes
```

## Authentication

Choose one:
- **Vercel Cron** (recommended if hosted on Vercel): Automatic, no configuration needed
- **External Cron with Secret**: Set `CRON_SECRET` env var, include in Authorization header
- **Admin JWT Token**: For manual testing or non-Vercel hosting

## Request Body (Optional)

```json
{
  "cursor": 0,
  "batch_size": 50
}
```

- `cursor`: Starting ID for pagination (default: 0)
- `batch_size`: Number of user shows to process per request (default: 50, max: 100)

## Response

```json
{
  "message": "Successfully updated next episodes",
  "processedInBatch": 50,
  "updatedInBatch": 49,
  "failuresInBatch": 1,
  "failures": [
    {
      "userId": "user-123",
      "tmdbId": 1234,
      "error": "Episode fetch failed"
    }
  ],
  "nextCursor": 1234,
  "hasMore": true
}
```

## Setup Instructions

### Option 1: Vercel Cron (Recommended - Built-in, No Cost)

Vercel has built-in cron support - the simplest option!

1. **Add to `vercel.json`**:

```json
{
  "crons": [
    {
      "path": "/api/admin/update-next-episodes",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Or in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  crons: [
    {
      path: '/api/admin/update-next-episodes',
      schedule: '0 2 * * *' // Daily at 2 AM UTC
    }
  ]
};

module.exports = nextConfig;
```

2. **Environment Setup** (automatic for Vercel):
   - No env vars needed for Vercel's internal cron
   - Vercel automatically sends `x-vercel-cron: true` header

3. **Deploy**: Just commit and push - Vercel handles the rest!

### Option 2: External Cron with Secret

For non-Vercel hosting or external cron services.

1. **Set environment variable**:
```bash
CRON_SECRET=your-super-secret-random-string-here
```

2. **EasyCron Setup**:
   - Go to [easycron.com](https://www.easycron.com/)
   - Add cron job:
     - **Cron**: `0 2 * * *` (2 AM UTC daily)
     - **URL**: `https://your-domain.com/api/admin/update-next-episodes`
     - **HTTP Method**: POST
     - **Headers**: 
       ```
       Authorization: Bearer your-super-secret-random-string-here
       Content-Type: application/json
       ```
     - **Body**: `{"cursor": 0, "batch_size": 50}`

### Option 3: GitHub Actions

```yaml
name: Update Next Episodes Daily

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  update-episodes:
    runs-on: ubuntu-latest
    steps:
      - name: Update next episodes
        run: |
          CURSOR=0
          HAS_MORE=true
          while [ "$HAS_MORE" = "true" ]; do
            RESPONSE=$(curl -X POST "https://your-domain.com/api/admin/update-next-episodes" \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
              -H "Content-Type: application/json" \
              -d "{\"cursor\": $CURSOR, \"batch_size\": 50}")
            
            HAS_MORE=$(echo $RESPONSE | jq -r '.hasMore')
            CURSOR=$(echo $RESPONSE | jq -r '.nextCursor // empty')
            
            echo "$RESPONSE"
          done
```

Then add `CRON_SECRET` to GitHub Secrets.

### Option 4: AWS Lambda / EventBridge

Use EventBridge to trigger Lambda, which makes an HTTP POST request with your `CRON_SECRET`.

### Option 5: Self-hosted Cron (Linux/Unix)

Add to `/etc/crontab`:

```bash
# Daily at 2 AM UTC
0 2 * * * curl -X POST "https://your-domain.com/api/admin/update-next-episodes" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"cursor\": 0, \"batch_size\": 50}" > /var/log/cron-update-episodes.log 2>&1
```

## How It Works

1. **Pagination**: Processes user shows in batches (default 50 per request)
2. **Progress Update**: Refreshes episode progress for each show
3. **Next Episode Calculation**: Finds the first unwatched episode among released episodes
4. **Filtering**: Only processes shows with status: watching, want_to_watch, on_hold
5. **Batch Resumption**: Use `nextCursor` in response to continue processing if `hasMore: true`

## Monitoring

Check the cron job response:
- **updatedInBatch**: Number of shows successfully updated
- **failuresInBatch**: Number of shows that failed
- **failures**: Array with detailed error info
- **hasMore**: Whether more batches need processing

**Vercel Monitoring**:
- Check logs in Vercel Dashboard → Settings → Cron Jobs
- View execution history and response status

## Cost Considerations

- **Vercel Cron**: Free (included with Vercel)
- **EasyCron**: Free tier available (5 cron jobs)
- **GitHub Actions**: Free for public repos, limited for private
- **AWS Lambda**: Minimal cost, usually within free tier
- Database queries: 1 per user show per day
- No external API calls (uses cached TMDB data)

## Testing Locally

```bash
# Get CRON_SECRET from your env
CRON_SECRET="your-secret"

# Test single batch
curl -X POST "http://localhost:3000/api/admin/update-next-episodes" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"cursor": 0, "batch_size": 10}'

# Process all shows in batches
CURSOR=0
HAS_MORE=true
while [ "$HAS_MORE" = "true" ]; do
  RESPONSE=$(curl -X POST "http://localhost:3000/api/admin/update-next-episodes" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"cursor\": $CURSOR, \"batch_size\": 10}")
  
  HAS_MORE=$(echo $RESPONSE | jq -r '.hasMore')
  CURSOR=$(echo $RESPONSE | jq -r '.nextCursor // empty')
  
  echo "Batch response: $RESPONSE"
done
```

## Notes

- First-time setup may take longer to process all existing user shows
- Subsequent runs process incrementally (batches of 50)
- Consider running at off-peak hours (e.g., 2 AM UTC)
- Episodes are considered "released" based on their air_date in TMDB data
- **Vercel Cron is the recommended approach** - free, built-in, and requires zero configuration

