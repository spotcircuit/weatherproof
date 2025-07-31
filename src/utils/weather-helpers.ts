// Helper functions for weather data processing

export function sanitizeWeatherData(data: any) {
  return {
    temperature: data.temperature || 0,
    windSpeed: data.windSpeed || 0,
    windGust: data.windGust || undefined,
    windDirection: data.windDirection ? Math.round(data.windDirection) : 0,
    precipitation: data.precipitation || 0,
    humidity: data.humidity ? Math.round(data.humidity) : 0,
    pressure: data.pressure || 0,
    visibility: data.visibility || 0,
    conditions: data.conditions || '',
    timestamp: data.timestamp,
    station: data.station || { id: '', name: '', distance: 0 },
    raw: data.raw
  }
}

export function ensureInteger(value: any): number {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : Math.round(num)
}

export function ensureFloat(value: any, decimals: number = 2): number {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals))
}