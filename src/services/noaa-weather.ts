// NOAA Weather Service for insurance-grade weather verification
import { format } from 'date-fns'

interface WeatherData {
  temperature: number
  windSpeed: number
  windGust?: number
  windDirection: number
  precipitation: number
  humidity: number
  pressure: number
  visibility: number
  conditions: string
  timestamp: string
  station: {
    id: string
    name: string
    distance: number
  }
  raw?: any
}

interface NOAAStation {
  id: string
  name: string
  latitude: number
  longitude: number
  distance?: number
}

export class NOAAWeatherService {
  private baseUrl = 'https://api.weather.gov'
  private headers = {
    'User-Agent': 'WeatherProof (weatherproof.app, support@weatherproof.app)'
  }

  // Calculate distance between two coordinates in miles
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Get grid point for location
  async getGridPoint(lat: number, lng: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
        { headers: this.headers }
      )
      
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching grid point:', error)
      throw error
    }
  }

  // Get nearest weather stations
  async getNearestStations(lat: number, lng: number): Promise<NOAAStation[]> {
    try {
      const pointData = await this.getGridPoint(lat, lng)
      const stationsUrl = pointData.properties.observationStations
      
      const response = await fetch(stationsUrl, { headers: this.headers })
      const data = await response.json()
      
      // Calculate distances and sort
      const stations = data.features.map((feature: any) => ({
        id: feature.properties.stationIdentifier,
        name: feature.properties.name,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        distance: this.calculateDistance(
          lat, lng,
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0]
        )
      }))
      
      return stations.sort((a: NOAAStation, b: NOAAStation) => 
        (a.distance || 0) - (b.distance || 0)
      )
    } catch (error) {
      console.error('Error fetching stations:', error)
      throw error
    }
  }

  // Get current weather from nearest station
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const stations = await this.getNearestStations(lat, lng)
      if (!stations.length) {
        throw new Error('No weather stations found nearby')
      }

      const nearestStation = stations[0]
      
      // Get latest observation
      const response = await fetch(
        `${this.baseUrl}/stations/${nearestStation.id}/observations/latest`,
        { headers: this.headers }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status}`)
      }

      const data = await response.json()
      const obs = data.properties

      return {
        temperature: this.celsiusToFahrenheit(obs.temperature.value),
        windSpeed: this.metersPerSecondToMph(obs.windSpeed.value),
        windGust: obs.windGust?.value ? this.metersPerSecondToMph(obs.windGust.value) : undefined,
        windDirection: obs.windDirection?.value ? Math.round(obs.windDirection.value) : 0,
        precipitation: this.millimetersToInches(obs.precipitationLastHour?.value || 0),
        humidity: obs.relativeHumidity?.value ? Math.round(obs.relativeHumidity.value) : 0,
        pressure: obs.barometricPressure?.value || 0,
        visibility: this.metersToMiles(obs.visibility?.value || 0),
        conditions: obs.textDescription,
        timestamp: obs.timestamp,
        station: {
          id: nearestStation.id,
          name: nearestStation.name,
          distance: nearestStation.distance || 0
        },
        raw: data
      }
    } catch (error) {
      console.error('Error fetching current weather:', error)
      throw error
    }
  }

  // Get weather for a specific date/time (historical)
  async getHistoricalWeather(lat: number, lng: number, date: Date): Promise<WeatherData[]> {
    try {
      const stations = await this.getNearestStations(lat, lng)
      if (!stations.length) {
        throw new Error('No weather stations found nearby')
      }

      const nearestStation = stations[0]
      const startTime = new Date(date)
      startTime.setHours(0, 0, 0, 0)
      const endTime = new Date(date)
      endTime.setHours(23, 59, 59, 999)

      // NOAA API limits historical data queries
      const response = await fetch(
        `${this.baseUrl}/stations/${nearestStation.id}/observations?` +
        `start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch historical weather: ${response.status}`)
      }

      const data = await response.json()
      
      return data.features.map((feature: any) => {
        const obs = feature.properties
        return {
          temperature: this.celsiusToFahrenheit(obs.temperature.value),
          windSpeed: this.metersPerSecondToMph(obs.windSpeed.value),
          windGust: obs.windGust?.value ? this.metersPerSecondToMph(obs.windGust.value) : undefined,
          windDirection: obs.windDirection.value || 0,
          precipitation: this.millimetersToInches(obs.precipitationLastHour?.value || 0),
          humidity: obs.relativeHumidity.value || 0,
          pressure: obs.barometricPressure.value || 0,
          visibility: this.metersToMiles(obs.visibility.value || 0),
          conditions: obs.textDescription,
          timestamp: obs.timestamp,
          station: {
            id: nearestStation.id,
            name: nearestStation.name,
            distance: nearestStation.distance || 0
          },
          raw: feature
        }
      })
    } catch (error) {
      console.error('Error fetching historical weather:', error)
      throw error
    }
  }

  // Check if weather exceeds thresholds
  checkThresholdViolations(weather: WeatherData, thresholds: any): string[] {
    const violations = []

    if (thresholds.wind_speed && weather.windSpeed > thresholds.wind_speed) {
      violations.push(`Wind speed (${weather.windSpeed.toFixed(1)} mph) exceeds limit of ${thresholds.wind_speed} mph`)
    }

    if (thresholds.precipitation && weather.precipitation > thresholds.precipitation) {
      violations.push(`Precipitation (${weather.precipitation.toFixed(2)}") exceeds limit of ${thresholds.precipitation}"`)
    }

    if (thresholds.temperature_min && weather.temperature < thresholds.temperature_min) {
      violations.push(`Temperature (${weather.temperature.toFixed(0)}°F) below minimum of ${thresholds.temperature_min}°F`)
    }

    if (thresholds.temperature_max && weather.temperature > thresholds.temperature_max) {
      violations.push(`Temperature (${weather.temperature.toFixed(0)}°F) exceeds maximum of ${thresholds.temperature_max}°F`)
    }

    return violations
  }

  // Generate insurance-ready report URL
  generateNOAAReportUrl(stationId: string, date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd')
    return `https://www.ncdc.noaa.gov/cdo-web/datasets/GHCND/stations/${stationId}/detail`
  }

  // Unit conversions
  private celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32
  }

  private metersPerSecondToMph(mps: number): number {
    return mps * 2.237
  }

  private millimetersToInches(mm: number): number {
    return mm * 0.0393701
  }

  private metersToMiles(meters: number): number {
    return meters * 0.000621371
  }
}

// Singleton instance
export const noaaWeatherService = new NOAAWeatherService()