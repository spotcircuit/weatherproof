export interface WeatherThreshold {
  minTemp?: number
  maxTemp?: number
  maxWindSpeed?: number
  maxPrecipitation?: number
  activities: string[]
}

export interface WeatherThresholds {
  concrete?: WeatherThreshold
  roofing?: WeatherThreshold
  painting?: WeatherThreshold
  masonry?: WeatherThreshold
  crane?: WeatherThreshold
  custom?: WeatherThreshold[]
}

export const DEFAULT_THRESHOLDS: WeatherThresholds = {
  concrete: {
    minTemp: 40,
    maxTemp: 90,
    maxPrecipitation: 0.1,
    activities: ['concrete_pour', 'concrete_finishing']
  },
  roofing: {
    maxWindSpeed: 20,
    maxPrecipitation: 0,
    activities: ['roofing', 'shingle_installation']
  },
  painting: {
    minTemp: 50,
    maxTemp: 90,
    maxPrecipitation: 0,
    activities: ['exterior_painting', 'spray_painting']
  },
  masonry: {
    minTemp: 40,
    maxPrecipitation: 0.1,
    activities: ['brick_laying', 'block_work', 'stucco']
  },
  crane: {
    maxWindSpeed: 35,
    activities: ['crane_operation', 'lifting']
  }
}

export interface WeatherData {
  temperature: number
  windSpeed: number
  precipitation: number
  humidity: number
  conditions: string
  timestamp: Date
  source: string
}