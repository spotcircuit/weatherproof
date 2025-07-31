# WeatherProof API & Integrations Guide

## Overview
This guide covers all external integrations and API endpoints in the WeatherProof application.

## External Integrations

### NOAA Weather API Integration

#### Configuration
Add to `.env.local`:
```env
NOAA_API_TOKEN=your_noaa_token_here
```

#### Service Location
`/src/services/noaa-weather.ts`

#### Key Functions

1. **Fetch Current Weather**
```typescript
fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherData>
```

2. **Fetch Weather History**
```typescript
fetchHistoricalWeather(
  latitude: number, 
  longitude: number, 
  startDate: Date, 
  endDate: Date
): Promise<WeatherData[]>
```

3. **Verify Delay Conditions**
```typescript
verifyDelayWithNOAA(
  location: { lat: number, lng: number },
  startTime: Date,
  endTime: Date
): Promise<NOAAVerification>
```

#### NOAA Endpoints Used
- **Current Conditions**: `https://api.weather.gov/points/{lat},{lon}`
- **Forecast**: `https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast`
- **Observations**: `https://api.weather.gov/stations/{stationId}/observations`

#### Rate Limits
- 1000 requests per hour
- Implement caching to reduce API calls

### Google Sheets Integration (Webhook)

#### Webhook Endpoint
`/api/survey/submit`

#### Expected Payload
```json
{
  "timestamp": "2024-01-30T10:00:00Z",
  "projectName": "Downtown Office Complex",
  "address": "123 Main St",
  "weatherCondition": "Heavy Rain",
  "delayDuration": 4.5,
  "crewSize": 8,
  "notes": "Site flooded, work suspended"
}
```

#### Google Apps Script
See `/docs/google-sheets-integration.md` for setup instructions.

## Internal API Endpoints

### Authentication

#### Login
- **POST** `/api/auth/callback`
- Handles Supabase auth callback

#### Logout
- **POST** `/api/auth/signout`
- Clears session and redirects

#### Complete Signup
- **POST** `/api/auth/complete-signup`
- Finalizes user registration with company details

### Weather Operations

#### Check Weather
- **POST** `/api/weather/check`
- **Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2024-01-30T10:00:00Z"
}
```
- **Response**:
```json
{
  "temperature": 45.2,
  "windSpeed": 25.5,
  "precipitation": 0.5,
  "conditions": "Rain",
  "verified": true
}
```

### Report Generation

#### Generate Report
- **POST** `/api/reports/generate`
- **Body**:
```json
{
  "reportType": "insurance_claim",
  "projectId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "delayIds": ["uuid1", "uuid2"],
  "options": {
    "includePhotos": true,
    "includeWeatherData": true,
    "format": "detailed"
  }
}
```

#### Generate ACORD Form
- **POST** `/api/reports/acord`
- **Body**:
```json
{
  "projectId": "uuid",
  "reportId": "uuid",
  "formType": "property_loss"
}
```

## Service Layer Architecture

### Core Services

#### Report Generator (`/src/services/report-generator.ts`)
Handles PDF generation for various report types:
- Daily Weather Logs
- Delay Notifications
- Insurance Claims
- Executive Summaries

#### CSV Import/Export (`/src/services/csv-import-export.ts`)
Bulk data operations for:
- Projects
- Crew Members
- Equipment
- Delay Events

#### Weather Monitor (`/src/services/weather-monitor.ts`)
Background weather monitoring:
- Threshold checking
- Alert generation
- Automatic data collection

### Report Templates

Location: `/src/services/report-templates/`

Available generators:
1. **DailyWeatherLogGenerator**
2. **DelayNotificationGenerator**
3. **InsuranceClaimGenerator**
4. **ExecutiveSummaryGenerator**

## Database Queries

### Common Supabase Queries

#### Get User's Projects
```typescript
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

#### Get Delays with Weather Data
```typescript
const { data: delays } = await supabase
  .from('delay_events')
  .select(`
    *,
    projects!inner(name, address),
    weather_readings(
      temperature,
      wind_speed,
      precipitation,
      conditions
    )
  `)
  .eq('projects.user_id', userId)
  .gte('start_time', startDate)
  .lte('end_time', endDate)
```

#### Create Report with Delays
```typescript
const { data: report } = await supabase
  .from('reports')
  .insert({
    project_id: projectId,
    report_type: 'insurance_claim',
    period_start: startDate,
    period_end: endDate,
    report_data: {
      delays: delayIds,
      total_cost: totalCost,
      weather_verified: true
    }
  })
  .select()
  .single()
```

## Integration Patterns

### Webhook Security
All incoming webhooks should:
1. Verify source IP/domain
2. Check authentication token
3. Validate payload structure
4. Rate limit requests

### API Error Handling
```typescript
try {
  const data = await apiCall()
  return { success: true, data }
} catch (error) {
  console.error('API Error:', error)
  return { 
    success: false, 
    error: error.message,
    code: error.code || 'UNKNOWN_ERROR'
  }
}
```

### Caching Strategy
1. Weather data: Cache for 1 hour
2. User data: Cache for session duration
3. Report data: No caching (always fresh)

## Testing Integrations

### Mock Data
Use `/src/utils/sample-data.ts` for testing

### API Testing Commands
```bash
# Test weather endpoint
curl -X POST http://localhost:3000/api/weather/check \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7128, "longitude": -74.0060}'

# Test report generation
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"reportType": "daily_log", "projectId": "uuid"}'
```

## Rate Limiting

### Implementation
```typescript
const rateLimiter = {
  noaa: { max: 1000, window: '1h' },
  reports: { max: 100, window: '1h' },
  webhooks: { max: 60, window: '1m' }
}
```

### Headers
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

## Security Considerations

1. **API Keys**: Never expose in client-side code
2. **CORS**: Configure allowed origins
3. **Input Validation**: Sanitize all inputs
4. **Authentication**: Verify user session
5. **Rate Limiting**: Prevent abuse

## Monitoring

### Logging
- API calls logged with timestamp
- Error tracking with stack traces
- Performance metrics collected

### Health Checks
- `/api/health` - Basic health check
- `/api/health/db` - Database connectivity
- `/api/health/services` - External services status

## Future Integrations

### Planned
1. **QuickBooks Integration**
   - Sync invoices
   - Import project data
   - Export delay costs

2. **Procore Integration**
   - Project synchronization
   - Daily log imports
   - Document management

3. **SMS Notifications**
   - Twilio integration
   - Alert notifications
   - Report ready alerts

4. **Email Service**
   - SendGrid/Postmark
   - Report delivery
   - Alert notifications

## Troubleshooting

### Common Issues

1. **NOAA API Errors**
   - Check API token validity
   - Verify coordinates are in USA
   - Check rate limits

2. **Report Generation Failures**
   - Verify data exists for period
   - Check PDF generation logs
   - Ensure sufficient memory

3. **Webhook Failures**
   - Check payload format
   - Verify endpoint URL
   - Review server logs

### Debug Mode
Enable debug logging:
```env
DEBUG=weatherproof:*
```

## Support
For API issues or integration requests, contact the development team.