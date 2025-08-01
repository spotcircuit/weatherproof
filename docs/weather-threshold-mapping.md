# NOAA Weather Data to Construction Threshold Mapping

## The Challenge

NOAA provides data in different formats that need conversion:

### What NOAA Gives You

```json
{
  "temperature": 72,  // ✅ Direct number
  "windSpeed": "15 mph",  // ❌ String that needs parsing
  "probabilityOfPrecipitation": {
    "unitCode": "wmoUnit:percent",
    "value": 60  // ✅ Number in object
  },
  "shortForecast": "Showers Likely",  // ❌ Text description
  "detailedForecast": "Showers likely with thunderstorms possible. High near 72F. Winds W at 15 to 25 mph."  // ❌ Full text
}
```

## Parsing Strategy

### 1. Wind Speed Parsing
```javascript
function parseWindSpeed(windString) {
  if (!windString) return 0
  
  // Handle different formats
  // "15 mph" -> 15
  // "15 to 25 mph" -> 25 (use max for safety)
  // "W at 15 to 25 mph" -> 25
  // "Calm" -> 0
  
  if (windString.toLowerCase() === 'calm') return 0
  
  // Extract all numbers
  const numbers = windString.match(/\d+/g)
  if (!numbers) return 0
  
  // Return the highest number (gusts/max)
  return Math.max(...numbers.map(n => parseInt(n)))
}

// Examples:
parseWindSpeed("15 mph") // 15
parseWindSpeed("15 to 25 mph") // 25
parseWindSpeed("W at 10 to 20 mph") // 20
parseWindSpeed("Calm") // 0
```

### 2. Precipitation Detection
```javascript
function detectPrecipitation(data) {
  const result = {
    willRain: false,
    amount: 0,
    type: null,
    confidence: 0
  }
  
  // Check probability first
  const probability = data.probabilityOfPrecipitation?.value || 0
  result.confidence = probability
  
  // Check short forecast for keywords
  const forecast = (data.shortForecast || '').toLowerCase()
  const precipKeywords = {
    'rain': 'rain',
    'showers': 'rain',
    'thunderstorm': 'rain',
    'drizzle': 'rain',
    'snow': 'snow',
    'sleet': 'sleet',
    'freezing rain': 'freezing_rain'
  }
  
  for (const [keyword, type] of Object.entries(precipKeywords)) {
    if (forecast.includes(keyword)) {
      result.willRain = true
      result.type = type
      break
    }
  }
  
  // Estimate amount from text
  if (forecast.includes('heavy')) result.amount = 0.5
  else if (forecast.includes('light')) result.amount = 0.1
  else if (result.willRain) result.amount = 0.25 // moderate default
  
  return result
}
```

### 3. Condition Keywords to Thresholds
```javascript
const WEATHER_CONDITIONS = {
  // Precipitation
  'heavy rain': { precipitation: 0.5, windSpeed: null },
  'rain': { precipitation: 0.25, windSpeed: null },
  'light rain': { precipitation: 0.1, windSpeed: null },
  'drizzle': { precipitation: 0.05, windSpeed: null },
  'showers': { precipitation: 0.2, windSpeed: null },
  'thunderstorms': { precipitation: 0.3, windSpeed: 25, lightning: true },
  
  // Wind
  'windy': { precipitation: null, windSpeed: 20 },
  'breezy': { precipitation: null, windSpeed: 15 },
  'gusty': { precipitation: null, windSpeed: 25 },
  
  // Temperature (from detailed forecast)
  'hot': { temperature: { min: 90 } },
  'cold': { temperature: { max: 40 } },
  'freezing': { temperature: { max: 32 } },
  
  // Visibility
  'fog': { visibility: 0.5 },
  'dense fog': { visibility: 0.25 },
  'haze': { visibility: 2 }
}

function parseConditions(shortForecast, detailedForecast) {
  const combined = `${shortForecast} ${detailedForecast}`.toLowerCase()
  const conditions = []
  
  for (const [keyword, thresholds] of Object.entries(WEATHER_CONDITIONS)) {
    if (combined.includes(keyword)) {
      conditions.push({ keyword, ...thresholds })
    }
  }
  
  return conditions
}
```

## Complete Processing Function

```javascript
function processNOAADataForThresholds(noaaData) {
  const processed = {
    // Direct numeric values
    temperature: noaaData.temperature,
    humidity: noaaData.relativeHumidity?.value,
    
    // Parsed values
    windSpeed: parseWindSpeed(noaaData.windSpeed),
    windGust: parseWindSpeed(noaaData.windGust),
    
    // Precipitation analysis
    precipitationProbability: noaaData.probabilityOfPrecipitation?.value || 0,
    precipitationAmount: 0,
    precipitationType: null,
    
    // Threshold checks
    exceedsThresholds: {
      coldWeather: false,      // < 40°F
      hotWeather: false,       // > 90°F
      highWind: false,         // > 25 mph
      moderateWind: false,     // > 15 mph
      precipitation: false,    // > 0.1"
      heavyPrecipitation: false, // > 0.5"
      lightning: false
    },
    
    // Original text for reference
    originalForecast: noaaData.shortForecast,
    rawData: noaaData
  }
  
  // Detect precipitation from text
  const precip = detectPrecipitation(noaaData)
  processed.precipitationAmount = precip.amount
  processed.precipitationType = precip.type
  
  // Check temperature thresholds
  if (processed.temperature < 40) processed.exceedsThresholds.coldWeather = true
  if (processed.temperature > 90) processed.exceedsThresholds.hotWeather = true
  
  // Check wind thresholds
  if (processed.windSpeed > 25 || processed.windGust > 25) {
    processed.exceedsThresholds.highWind = true
  }
  if (processed.windSpeed > 15) {
    processed.exceedsThresholds.moderateWind = true
  }
  
  // Check precipitation thresholds
  if (processed.precipitationAmount > 0.1 || processed.precipitationProbability > 50) {
    processed.exceedsThresholds.precipitation = true
  }
  if (processed.precipitationAmount > 0.5) {
    processed.exceedsThresholds.heavyPrecipitation = true
  }
  
  // Check for lightning
  const forecast = noaaData.shortForecast?.toLowerCase() || ''
  if (forecast.includes('thunder') || forecast.includes('lightning')) {
    processed.exceedsThresholds.lightning = true
  }
  
  return processed
}
```

## Construction Activity Thresholds

```javascript
const ACTIVITY_WEATHER_LIMITS = {
  'Concrete Work': {
    temperature: { min: 40, max: 90 },
    windSpeed: { max: 25 },
    precipitation: { max: 0.1 },
    conditions: ['no_rain', 'no_freezing']
  },
  'Roofing': {
    temperature: { min: 40, max: 95 },
    windSpeed: { max: 20 },
    precipitation: { max: 0 },
    conditions: ['no_rain', 'no_lightning', 'no_ice']
  },
  'Crane Operations': {
    windSpeed: { max: 20 }, // Lower threshold for safety
    windGust: { max: 25 },
    conditions: ['no_lightning', 'visibility_over_1_mile']
  },
  'Excavation': {
    precipitation: { max: 0.5 },
    conditions: ['no_flooding', 'ground_not_frozen']
  },
  'Electrical': {
    precipitation: { max: 0 },
    conditions: ['no_rain', 'no_lightning']
  },
  'Painting': {
    temperature: { min: 50, max: 90 },
    humidity: { max: 85 },
    windSpeed: { max: 15 },
    precipitation: { max: 0 }
  }
}

function checkActivityViability(activity, weatherData) {
  const limits = ACTIVITY_WEATHER_LIMITS[activity]
  if (!limits) return { viable: true, reasons: [] }
  
  const issues = []
  
  // Temperature checks
  if (limits.temperature) {
    if (limits.temperature.min && weatherData.temperature < limits.temperature.min) {
      issues.push(`Too cold (${weatherData.temperature}°F < ${limits.temperature.min}°F)`)
    }
    if (limits.temperature.max && weatherData.temperature > limits.temperature.max) {
      issues.push(`Too hot (${weatherData.temperature}°F > ${limits.temperature.max}°F)`)
    }
  }
  
  // Wind checks
  if (limits.windSpeed?.max && weatherData.windSpeed > limits.windSpeed.max) {
    issues.push(`Wind too high (${weatherData.windSpeed} mph > ${limits.windSpeed.max} mph)`)
  }
  
  // Precipitation checks
  if (limits.precipitation?.max !== undefined) {
    if (weatherData.precipitationAmount > limits.precipitation.max || 
        (limits.precipitation.max === 0 && weatherData.precipitationProbability > 30)) {
      issues.push(`Precipitation risk`)
    }
  }
  
  return {
    viable: issues.length === 0,
    issues: issues
  }
}
```

## Real World Examples

```javascript
// Example 1: Clear numeric data
const forecast1 = {
  temperature: 38,
  windSpeed: "5 mph",
  shortForecast: "Mostly Cloudy"
}
const result1 = processNOAADataForThresholds(forecast1)
// result1.exceedsThresholds.coldWeather = true (38°F < 40°F)
// Concrete work would be flagged

// Example 2: Text-based precipitation
const forecast2 = {
  temperature: 72,
  windSpeed: "10 to 15 mph",
  probabilityOfPrecipitation: { value: 70 },
  shortForecast: "Showers Likely"
}
const result2 = processNOAADataForThresholds(forecast2)
// result2.precipitationAmount = 0.2 (estimated from "Showers")
// result2.exceedsThresholds.precipitation = true
// Roofing would be stopped

// Example 3: Wind gusts in text
const forecast3 = {
  temperature: 65,
  windSpeed: "15 to 25 mph",
  windGust: "35 mph",
  shortForecast: "Windy"
}
const result3 = processNOAADataForThresholds(forecast3)
// result3.windGust = 35
// result3.exceedsThresholds.highWind = true
// Crane operations would be stopped
```

## Key Takeaways

1. **Temperature**: Direct numeric comparison ✅
2. **Wind**: Parse string to number, take maximum value
3. **Precipitation**: Combine probability + text analysis
4. **Special Conditions**: Search for keywords (thunder, fog, etc.)
5. **Always Store Raw Data**: Keep original for legal/dispute resolution