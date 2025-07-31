# n8n Integration Guide for WeatherProof

## Overview
WeatherProof uses n8n for AI processing, report generation, and workflow automation. This guide shows how to set up the n8n workflows.

## Environment Variables

Add these to your `.env` file:

```env
# n8n Webhook URLs
N8N_PARSE_DELAY_URL=https://your-n8n.com/webhook/abc123-parse-delay
N8N_GENERATE_REPORT_URL=https://your-n8n.com/webhook/def456-generate-report
N8N_ANALYZE_PHOTOS_URL=https://your-n8n.com/webhook/ghi789-analyze-photos
N8N_WEATHER_CHECK_URL=https://your-n8n.com/webhook/jkl012-weather-check

# Authentication value for Authorization header
N8N_WEBHOOK_AUTH=your-password-here
```

## Workflow 1: Parse Delay Description

### Webhook Input
```json
{
  "description": "Heavy rain at 9am, couldn't pour foundation",
  "date": "2024-03-15T00:00:00Z"
}
```

### n8n Workflow Structure
```
[Webhook] → [Set Variables] → [OpenAI] → [Format Response] → [Response]
                                ↓
                        [Check Confidence]
                                ↓
                        [Generate Questions]
```

### OpenAI Node Configuration
1. Set Model: `gpt-4o-mini` (or your preferred model)
2. Set Temperature: `0.3`
3. Set Response Format: `JSON Object`
4. Messages:
   - System: Use the system prompt from `/docs/n8n-system-prompt.md`
   - User: `{{ $json.description }}`
5. Add context about the date in the user message if provided:
   ```
   Date context: {{ $json.date ? 'The date being documented is ' + $json.date : '' }}
   Description: {{ $json.description }}
   ```

### Expected Output
```json
{
  "success": true,
  "data": {
    "times": { "start": "09:00", "end": null },
    "weather": { "conditions": ["Heavy Rain"], "severity": "severe" },
    "activities": ["Concrete - Foundation"],
    "confidence": 75,
    "questions": ["What time did work resume?", "How many crew members?"]
  }
}
```

## Workflow 2: Generate Report

### Webhook Input
```json
{
  "reportId": "uuid-here",
  "format": "pdf",
  "includePhotos": true,
  "templateType": "insurance_claim"
}
```

### n8n Workflow Structure
```
[Webhook] → [Get Report Data] → [Get Weather Data] → [Generate PDF]
                ↓                      ↓                    ↓
          [Supabase Query]      [NOAA Verify]        [Store in S3]
                                                           ↓
                                                    [Return URL]
```

## Workflow 3: Analyze Photos

### Webhook Input
```json
{
  "photos": ["url1", "url2"],
  "analysisType": "weather-damage",
  "includeOCR": true
}
```

### n8n Workflow Structure
```
[Webhook] → [Download Images] → [Vision API] → [Extract Text]
                                     ↓              ↓
                              [Detect Damage]  [OCR Timestamps]
                                     ↓
                              [Compile Report]
```

## Workflow 4: Weather Check

### Webhook Input
```json
{
  "projectIds": ["project1", "project2"],
  "hoursAhead": 24,
  "severityThreshold": "moderate"
}
```

### n8n Workflow Structure
```
[Webhook] → [Get Projects] → [NOAA API] → [Check Thresholds]
                                              ↓
                                    [Create Alerts if Needed]
                                              ↓
                                    [Send Notifications]
```

## Error Handling

All workflows should include:
1. Try/Catch nodes
2. Logging to database
3. Fallback responses

Example error response:
```json
{
  "success": false,
  "error": "Failed to parse description",
  "fallbackToRegex": true
}
```

## Authentication

The webhooks use header authentication with the `Authorization` header.

### Setup in n8n:
1. Add a Webhook node
2. Set Authentication to "Header Auth"
3. Set Header Name to `Authorization`
4. Compare against the value from your `.env` file

### Setup in .env:
```env
# The exact value you want in the Authorization header
N8N_WEBHOOK_AUTH=your-password-here
# OR if using Bearer token:
N8N_WEBHOOK_AUTH=Bearer your-token-here
```

### How it works:
```javascript
// The code sends:
headers: {
  'Authorization': process.env.N8N_WEBHOOK_AUTH
}

// So if N8N_WEBHOOK_AUTH=mysecret123
// n8n receives: Authorization: mysecret123
```

## Testing Webhooks

Test with curl:
```bash
curl -X POST https://your-n8n.com/webhook/abc123-parse-delay \
  -H "Content-Type: application/json" \
  -H "Authorization: your-password-here" \
  -d '{
    "description": "Rain at 10am",
    "date": "2024-03-15"
  }'
```

## Monitoring

Track in n8n:
- Execution time
- Success rate
- Error patterns
- Token usage

## Benefits

1. **No Code Changes**: Update AI prompts in n8n
2. **Visual Debugging**: See exactly what happened
3. **Error Recovery**: Built-in retry logic
4. **Cost Tracking**: Monitor API usage
5. **A/B Testing**: Test different prompts
6. **Integration**: Connect to other services

## Example n8n Workflow JSON

You can import this directly into n8n:

```json
{
  "name": "WeatherProof - Parse Delay",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "abc123-parse-delay",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    }
  ],
  "connections": {}
}
```