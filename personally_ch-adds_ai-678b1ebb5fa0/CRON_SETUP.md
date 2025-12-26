# Cron Job Setup Guide

This guide explains how to set up cron jobs for Freestar data processing using the updated API endpoints.

## Available Cron Job Endpoints

### 1. Daily Report Processing (`/api/cron/daily-report`)
- **Schedule**: Daily at 3 AM UTC
- **Purpose**: Fetches and processes daily Freestar data
- **Data Source**: Freestar Search API
- **Target Table**: `imp_freestar_ysm_daily`

### 2. Hourly Report Processing (`/api/cron/hourly-report`)
- **Schedule**: Hourly (recommended)
- **Purpose**: Fetches and processes hourly Freestar data
- **Data Source**: Freestar Search API
- **Target Table**: `imp_freestar_ysm_hourly`

## What the Cron Jobs Do

### Daily Report Processing
1. **Fetches Data**: Calls Freestar Search API for daily reports
2. **Data Processing**: Parses CSV response and maps to database fields
3. **Database Operations**: Deletes existing data and inserts fresh data
4. **Logging**: Provides detailed logs for monitoring

### Hourly Report Processing
1. **Fetches Data**: Calls Freestar Search API for hourly reports
2. **Data Processing**: Parses CSV response and maps to database fields
3. **Database Operations**: Deletes existing data and inserts fresh data
4. **Logging**: Provides detailed logs for monitoring

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

If you're deploying on Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/hourly-report",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option 2: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

```yaml
name: Freestar Data Processing

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily - Daily Report
    - cron: '0 * * * *'  # Every hour - Hourly Report
  workflow_dispatch:  # Allow manual trigger

jobs:
  daily-cron:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 3 * * *'
    steps:
      - name: Trigger Daily Report
        run: |
          curl -X GET "https://yourdomain.com/api/cron/daily-report" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"

  hourly-cron:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Trigger Hourly Report
        run: |
          curl -X GET "https://yourdomain.com/api/cron/hourly-report" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"
```

### Option 3: External Cron Job Services

#### Cron-job.org (Free)
1. Go to [cron-job.org](https://cron-job.org)
2. Create account and add two cron jobs:

**Daily Report Job:**
- Schedule: `0 3 * * *` (3 AM daily)
- URL: `https://yourdomain.com/api/cron/daily-report`
- Header: `Authorization: Bearer YOUR_CRON_SECRET_TOKEN`

**Hourly Report Job:**
- Schedule: `0 * * * *` (Every hour)
- URL: `https://yourdomain.com/api/cron/hourly-report`
- Header: `Authorization: Bearer YOUR_CRON_SECRET_TOKEN`

#### EasyCron (Free tier available)
1. Go to [easycron.com](https://easycron.com)
2. Create account and add two cron jobs with the same configuration as above

## Environment Variables

Add these to your `.env.local`:

```bash
CRON_SECRET_TOKEN=your-secret-token-here
```

## Security

The cron job endpoints are protected by:
- **Authentication**: Requires valid `Authorization` header
- **Secret Token**: Uses environment variable for security
- **Rate Limiting**: Can be added via middleware

## Testing

### Manual Trigger - Daily Report
```bash
curl -X POST "https://yourdomain.com/api/cron/daily-report" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### Manual Trigger - Hourly Report
```bash
curl -X POST "https://yourdomain.com/api/cron/hourly-report" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### Local Testing
```bash
# Daily Report
curl -X POST "http://localhost:3000/api/cron/daily-report" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"

# Hourly Report
curl -X POST "http://localhost:3000/api/cron/hourly-report" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

## Monitoring

### Logs
Check your application logs for:

**Daily Report:**
- `Starting daily Freestar data processing at: [timestamp]`
- `[X] records deleted for date [date]`
- `Successfully processed [X] records`
- `Freestar Data refreshness: Daily data up to [date]`

**Hourly Report:**
- `Starting hourly Freestar data processing at: [timestamp]`
- `[X] records deleted for date [date]`
- `Successfully processed [X] records`
- `Freestar Data refreshness: Daily data up to [date]`

### Health Check
Both endpoints return JSON with:
- `success`: boolean indicating success/failure
- `message`: description of the operation
- `processedDate`: date that was processed
- `timestamp`: when the job completed

## Data Processing Details

### CSV Parsing
- **Header Handling**: Automatically skips the first line (header)
- **Column Mapping**: Maps 15 columns to database fields
- **Error Handling**: Continues processing if individual records fail
- **Data Validation**: Converts strings to appropriate data types

### Database Operations
- **Upsert Logic**: Deletes existing data before inserting new data
- **Transaction Safety**: Uses Prisma for safe database operations
- **Error Recovery**: Continues processing on individual record failures

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your `CRON_SECRET_TOKEN`
2. **Timeout**: Increase timeout in cron service settings (recommended: 5 minutes)
3. **Database Errors**: Check Prisma connection and table existence
4. **API Errors**: Verify Freestar API credentials and rate limits
5. **CSV Parsing Errors**: Check data format from Freestar API

### Debug Mode
Add `DEBUG=true` to your environment variables for verbose logging.

### Rate Limiting
Freestar API may have rate limits. Consider:
- Adding delays between requests
- Implementing exponential backoff
- Monitoring API response headers

## Schedule Recommendations

### Production Environment
- **Daily Report**: `0 3 * * *` (3 AM UTC) - Process yesterday's data
- **Hourly Report**: `0 * * * *` (Every hour) - Real-time data updates

### Development Environment
- **Daily Report**: `0 9 * * *` (9 AM UTC) - During business hours
- **Hourly Report**: `0 */2 * * *` (Every 2 hours) - Reduced frequency

## Timezone Considerations

The cron jobs run at UTC time. Adjust schedules for your local timezone:
- **EST (UTC-5)**: Daily at 8 AM EST = 3 AM UTC
- **PST (UTC-8)**: Daily at 11 AM PST = 3 AM UTC
- **CET (UTC+1)**: Daily at 2 AM CET = 3 AM UTC

## Performance Optimization

### Database Indexes
Ensure your database has proper indexes on:
- `date` field for efficient date-based queries
- Composite indexes for the primary key fields
- `type_tag` and `site_domain` for filtering

### Memory Management
- Process data in batches for large datasets
- Implement connection pooling
- Monitor memory usage during processing

## Backup and Recovery

### Data Backup
- Backup your database before major data processing
- Consider implementing point-in-time recovery
- Test restore procedures regularly

### Error Recovery
- Failed jobs can be manually retriggered
- Implement dead letter queues for failed records
- Monitor job success rates and alert on failures
