# n8n Weather Collection Automation Setup

This guide explains how to set up automated weather collection in n8n that responds to project changes.

## Overview

The system uses PostgreSQL notifications to automatically:
- Start weather collection when a project is created/enabled
- Stop weather collection when a project is deactivated/disabled
- Batch projects by location for efficient API usage

## Prerequisites

1. Run the database migration: `017_add_weather_automation_triggers.sql`
2. Have your n8n instance connected to your Supabase PostgreSQL database

## n8n Workflow Setup

### 1. Main Weather Scheduler Workflow

Create a workflow with these nodes:

#### Node 1: Schedule Trigger
- **Type**: Schedule Trigger
- **Interval**: Every 30 minutes
- **Cron Expression**: `*/30 * * * *`

#### Node 2: PostgreSQL Query
- **Type**: PostgreSQL
- **Operation**: Execute Query
- **Query**:
```sql
SELECT * FROM get_projects_by_grid();
```
- **Output**: Returns projects grouped by weather grid

#### Node 3: Loop Over Grids
- **Type**: Split In Batches
- **Batch Size**: 1
- **Options**: Reset

#### Node 4: HTTP Request (Weather Lookup)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `{{ $env.N8N_PROJECT_WEATHER_URL }}`
- **Authentication**: Header Auth
  - **Name**: Authorization
  - **Value**: `{{ $env.N8N_WEBHOOK_AUTH }}`
- **Body**:
```json
{
  "projectIds": "{{ $json.project_ids }}",
  "latitude": "{{ $json.latitude }}",
  "longitude": "{{ $json.longitude }}",
  "gridId": "{{ $json.grid_id }}",
  "gridX": "{{ $json.grid_x }}",
  "gridY": "{{ $json.grid_y }}",
  "requestType": "scheduled",
  "includeAlerts": true,
  "storeResult": true,
  "batchMode": true
}
```

#### Node 5: Update Collection Timestamps
- **Type**: PostgreSQL
- **Operation**: Execute Query
- **Query**:
```sql
UPDATE projects 
SET weather_last_collected_at = NOW()
WHERE id = ANY($1::uuid[])
RETURNING id, name;
```
- **Query Parameters**: 
  - `$1`: `{{ $json.project_ids }}`

### 2. Project Change Listener Workflow

Create a separate workflow for real-time project changes:

#### Node 1: PostgreSQL Trigger
- **Type**: PostgreSQL Trigger
- **Listen Channels**: 
  - `project_weather_enabled`
  - `project_weather_disabled`

#### Node 2: Router
- **Type**: Switch
- **Mode**: Rules
- **Rules**:
  - **Rule 1**: `{{ $json.channel === 'project_weather_enabled' }}`
  - **Rule 2**: `{{ $json.channel === 'project_weather_disabled' }}`

#### Node 3A: Handle Enable (connects to Rule 1)
- **Type**: Code
- **Language**: JavaScript
- **Code**:
```javascript
const notification = JSON.parse($input.first().json.payload);

// Log the new project
console.log(`Weather collection enabled for project: ${notification.name}`);

// Optionally trigger immediate weather collection
return {
  projectId: notification.project_id,
  latitude: notification.latitude,
  longitude: notification.longitude,
  action: 'collect_now'
};
```

#### Node 3B: Handle Disable (connects to Rule 2)
- **Type**: Code
- **Language**: JavaScript
- **Code**:
```javascript
const notification = JSON.parse($input.first().json.payload);

// Log the disabled project
console.log(`Weather collection disabled for project: ${notification.name}`);
console.log(`Reason: ${notification.reason}`);

return {
  projectId: notification.project_id,
  action: 'disabled',
  reason: notification.reason
};
```

#### Node 4: Immediate Weather Collection (optional)
- **Type**: HTTP Request
- **Description**: Collect weather immediately for newly enabled projects
- **URL**: Your weather webhook URL
- **Only runs when**: action === 'collect_now'

## Testing

### Test Project Enable:
```sql
-- Enable weather collection on a project
UPDATE projects 
SET weather_collection_enabled = true 
WHERE id = 'your-project-id';
```

### Test Project Disable:
```sql
-- Disable a project
UPDATE projects 
SET active = false 
WHERE id = 'your-project-id';
```

### Check Active Projects:
```sql
-- See all projects with weather collection
SELECT * FROM get_active_weather_projects();
```

## Monitoring

### Check Recent Collections:
```sql
SELECT 
  p.name,
  p.weather_last_collected_at,
  COUNT(pw.id) as total_readings
FROM projects p
LEFT JOIN project_weather pw ON p.id = pw.project_id
WHERE p.weather_collection_enabled = true
GROUP BY p.id, p.name, p.weather_last_collected_at
ORDER BY p.weather_last_collected_at DESC;
```

### Check Notification Log:
```sql
-- PostgreSQL doesn't persist notifications, but you can create a log table
CREATE TABLE IF NOT EXISTS weather_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  action VARCHAR(50),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Benefits

1. **Automatic Management**: No manual scheduling needed
2. **Efficient API Usage**: Batches projects in same location
3. **Real-time Updates**: Responds immediately to project changes
4. **Scalable**: Handles any number of projects
5. **Monitored**: Easy to track what's happening

## Troubleshooting

### Projects not getting weather data:
1. Check if project has latitude/longitude
2. Verify weather_collection_enabled = true
3. Check weather_last_collected_at timestamp
4. Look at n8n execution history

### Notifications not working:
1. Ensure PostgreSQL trigger is listening
2. Check n8n PostgreSQL connection
3. Verify trigger function is installed
4. Test with manual UPDATE query