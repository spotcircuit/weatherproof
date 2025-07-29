// NOAA National Weather Service API Integration
// Free, government-provided, legally accepted for insurance claims

interface NOAAPoint {
  properties: {
    forecast: string
    forecastHourly: string
    forecastGridData: string
    observationStations: string
    gridId: string
    gridX: number
    gridY: number
  }
}

interface NOAAStation {
  properties: {
    stationIdentifier: string
    name: string
    elevation: {
      value: number
      unitCode: string
    }
    distance?: number // We'll calculate this
  }
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
}

interface NOAAObservation {
  properties: {
    timestamp: string
    temperature: {
      value: number | null
      unitCode: string
    }
    dewpoint: {
      value: number | null
      unitCode: string
    }
    windDirection: {
      value: number | null
      unitCode: string
    }
    windSpeed: {
      value: number | null
      unitCode: string
    }
    windGust: {
      value: number | null
      unitCode: string
    }
    barometricPressure: {
      value: number | null
      unitCode: string
    }
    visibility: {
      value: number | null
      unitCode: string
    }
    precipitationLastHour: {
      value: number | null
      unitCode: string
    }
    relativeHumidity: {
      value: number | null
      unitCode: string
    }
    windChill: {
      value: number | null
      unitCode: string
    }
    heatIndex: {
      value: number | null
      unitCode: string
    }
    textDescription: string
  }
}

export class NOAAWeatherService {
  private baseUrl = 'https://api.weather.gov'
  private userAgent: string

  constructor() {
    // NOAA requires a User-Agent header
    this.userAgent = 'WeatherProof/1.0 (contact@weatherproof.app)'
  }

  private async fetchNOAA(url: string) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/geo+json'
      }
    })

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Convert Celsius to Fahrenheit
  private celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32
  }

  // Convert meters to miles
  private metersToMiles(meters: number): number {
    return meters * 0.000621371
  }

  // Convert m/s to mph
  private msToMph(ms: number): number {
    return ms * 2.237
  }

  // Convert mm to inches
  private mmToInches(mm: number): number {
    return mm * 0.0393701
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Get metadata for a location (finds grid point and stations)
  async getLocationMetadata(lat: number, lng: number) {
    try {
      const pointData: NOAAPoint = await this.fetchNOAA(
        `${this.baseUrl}/points/${lat},${lng}`
      )
      
      return pointData.properties
    } catch (error) {
      console.error('Failed to get NOAA location metadata:', error)
      throw error
    }
  }

  // Find nearest weather station
  async findNearestStation(lat: number, lng: number): Promise<{
    stationId: string
    name: string
    distance: number
    coordinates: [number, number]
  } | null> {
    try {
      // Get the point metadata first
      const metadata = await this.getLocationMetadata(lat, lng)
      
      // Get list of observation stations
      const stationsData = await this.fetchNOAA(metadata.observationStations)
      const stations: NOAAStation[] = stationsData.features
      
      // Calculate distances and find nearest
      let nearestStation: NOAAStation | null = null
      let minDistance = Infinity
      
      for (const station of stations) {
        const [stationLng, stationLat] = station.geometry.coordinates
        const distance = this.calculateDistance(lat, lng, stationLat, stationLng)
        
        if (distance < minDistance) {
          minDistance = distance
          nearestStation = station
          nearestStation.properties.distance = distance
        }
      }
      
      if (!nearestStation) return null
      
      return {
        stationId: nearestStation.properties.stationIdentifier,
        name: nearestStation.properties.name,
        distance: minDistance,
        coordinates: nearestStation.geometry.coordinates
      }
    } catch (error) {
      console.error('Failed to find nearest NOAA station:', error)
      return null
    }
  }

  // Get current weather observation
  async getCurrentWeather(lat: number, lng: number) {
    try {
      // Find nearest station
      const station = await this.findNearestStation(lat, lng)
      if (!station) {
        throw new Error('No NOAA weather station found within reasonable distance')
      }

      // Get latest observation from the station
      const observationData = await this.fetchNOAA(
        `${this.baseUrl}/stations/${station.stationId}/observations/latest`
      )
      
      const obs: NOAAObservation = observationData
      const props = obs.properties

      // Convert units and format response
      return {
        source: 'noaa',
        station: {
          id: station.stationId,
          name: station.name,
          distance: station.distance
        },
        timestamp: props.timestamp,
        temperature: props.temperature.value !== null 
          ? this.celsiusToFahrenheit(props.temperature.value) 
          : null,
        feels_like: props.heatIndex.value !== null 
          ? this.celsiusToFahrenheit(props.heatIndex.value)
          : props.windChill.value !== null
          ? this.celsiusToFahrenheit(props.windChill.value)
          : null,
        humidity: props.relativeHumidity.value,
        wind_speed: props.windSpeed.value !== null 
          ? this.msToMph(props.windSpeed.value) 
          : null,
        wind_gust: props.windGust.value !== null 
          ? this.msToMph(props.windGust.value) 
          : null,
        wind_direction: props.windDirection.value,
        precipitation: props.precipitationLastHour.value !== null 
          ? this.mmToInches(props.precipitationLastHour.value) 
          : 0,
        visibility: props.visibility.value !== null 
          ? this.metersToMiles(props.visibility.value) 
          : null,
        pressure: props.barometricPressure.value !== null 
          ? props.barometricPressure.value * 0.00029530 // Pa to inHg
          : null,
        conditions: props.textDescription,
        raw_data: obs
      }
    } catch (error) {
      console.error('Failed to get current NOAA weather:', error)
      throw error
    }
  }

  // Get historical observations (limited to last 7 days for most stations)
  async getHistoricalWeather(lat: number, lng: number, startTime: Date, endTime: Date) {
    try {
      const station = await this.findNearestStation(lat, lng)
      if (!station) {
        throw new Error('No NOAA weather station found')
      }

      // NOAA API requires ISO format with timezone
      const start = startTime.toISOString()
      const end = endTime.toISOString()

      const observationsData = await this.fetchNOAA(
        `${this.baseUrl}/stations/${station.stationId}/observations?start=${start}&end=${end}`
      )

      const observations = observationsData.features.map((obs: NOAAObservation) => {
        const props = obs.properties
        return {
          timestamp: props.timestamp,
          temperature: props.temperature.value !== null 
            ? this.celsiusToFahrenheit(props.temperature.value) 
            : null,
          humidity: props.relativeHumidity.value,
          wind_speed: props.windSpeed.value !== null 
            ? this.msToMph(props.windSpeed.value) 
            : null,
          wind_gust: props.windGust.value !== null 
            ? this.msToMph(props.windGust.value) 
            : null,
          precipitation: props.precipitationLastHour.value !== null 
            ? this.mmToInches(props.precipitationLastHour.value) 
            : 0,
          conditions: props.textDescription
        }
      })

      return {
        station,
        observations,
        period: { start, end }
      }
    } catch (error) {
      console.error('Failed to get historical NOAA weather:', error)
      throw error
    }
  }

  // Get weather forecast
  async getForecast(lat: number, lng: number) {
    try {
      const metadata = await this.getLocationMetadata(lat, lng)
      
      // Get hourly forecast
      const forecastData = await this.fetchNOAA(metadata.forecastHourly)
      
      const forecasts = forecastData.properties.periods.slice(0, 24).map((period: any) => ({
        time: period.startTime,
        temperature: period.temperature,
        wind_speed: parseInt(period.windSpeed),
        wind_direction: period.windDirection,
        precipitation_probability: period.probabilityOfPrecipitation?.value || 0,
        conditions: period.shortForecast,
        detailed: period.detailedForecast
      }))

      return {
        source: 'noaa',
        location: { lat, lng },
        forecasts
      }
    } catch (error) {
      console.error('Failed to get NOAA forecast:', error)
      throw error
    }
  }

  // Check if weather violates thresholds
  checkThresholds(weather: any, thresholds: any) {
    const violations = []

    if (weather.temperature !== null) {
      if (thresholds.temperature_min && weather.temperature < thresholds.temperature_min) {
        violations.push({
          type: 'temperature_low',
          value: weather.temperature,
          threshold: thresholds.temperature_min,
          unit: '°F'
        })
      }
      if (thresholds.temperature_max && weather.temperature > thresholds.temperature_max) {
        violations.push({
          type: 'temperature_high',
          value: weather.temperature,
          threshold: thresholds.temperature_max,
          unit: '°F'
        })
      }
    }

    if (weather.wind_speed !== null && thresholds.wind_speed && weather.wind_speed > thresholds.wind_speed) {
      violations.push({
        type: 'wind_speed',
        value: weather.wind_speed,
        threshold: thresholds.wind_speed,
        unit: 'mph'
      })
    }

    if (weather.precipitation !== null && thresholds.precipitation && weather.precipitation > thresholds.precipitation) {
      violations.push({
        type: 'precipitation',
        value: weather.precipitation,
        threshold: thresholds.precipitation,
        unit: 'inches'
      })
    }

    if (weather.visibility !== null && thresholds.visibility_min && weather.visibility < thresholds.visibility_min) {
      violations.push({
        type: 'visibility',
        value: weather.visibility,
        threshold: thresholds.visibility_min,
        unit: 'miles'
      })
    }

    return violations
  }
}

// Export singleton instance
export const noaaWeatherService = new NOAAWeatherService()