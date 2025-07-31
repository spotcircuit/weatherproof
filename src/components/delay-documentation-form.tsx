'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { noaaWeatherService } from '@/services/noaa-weather'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets,
  AlertTriangle,
  MapPin,
  Loader2,
  Camera,
  CheckCircle,
  Clock,
  DollarSign,
  Users
} from 'lucide-react'
import { format } from 'date-fns'

interface DelayDocumentationFormProps {
  project: any
  onSuccess?: () => void
  onCancel?: () => void
}

interface WeatherCondition {
  id: string
  label: string
  icon: any
  color: string
}

const weatherConditions: WeatherCondition[] = [
  { id: 'rain', label: 'Rain/Snow', icon: CloudRain, color: 'text-blue-600' },
  { id: 'wind', label: 'High Winds', icon: Wind, color: 'text-gray-600' },
  { id: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-orange-600' },
  { id: 'lightning', label: 'Lightning', icon: AlertTriangle, color: 'text-yellow-600' }
]

const activities = [
  'Concrete Pour',
  'Excavation',
  'Roofing',
  'Exterior Work',
  'Crane Operations',
  'Electrical Work',
  'Framing',
  'Foundation Work'
]

export default function DelayDocumentationForm({ 
  project, 
  onSuccess, 
  onCancel 
}: DelayDocumentationFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetchingWeather, setFetchingWeather] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [affectedActivities, setAffectedActivities] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [crewAffected, setCrewAffected] = useState(project.crew_size.toString())
  
  // Weather data
  const [weatherData, setWeatherData] = useState<any>(null)
  const [violations, setViolations] = useState<string[]>([])

  const handleFetchWeather = async () => {
    setFetchingWeather(true)
    setError(null)
    
    try {
      const weather = await noaaWeatherService.getCurrentWeather(
        project.latitude,
        project.longitude
      )
      
      setWeatherData(weather)
      
      // Check threshold violations
      const foundViolations = noaaWeatherService.checkThresholdViolations(
        weather,
        project.weather_thresholds
      )
      setViolations(foundViolations)
      
      // Auto-select conditions based on violations
      const autoSelect: string[] = []
      if (foundViolations.some(v => v.includes('Wind'))) autoSelect.push('wind')
      if (foundViolations.some(v => v.includes('Precipitation'))) autoSelect.push('rain')
      if (foundViolations.some(v => v.includes('Temperature'))) autoSelect.push('temperature')
      
      setSelectedConditions(prev => [...new Set([...prev, ...autoSelect])])
      
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.')
      console.error('Weather fetch error:', err)
    } finally {
      setFetchingWeather(false)
    }
  }

  const calculateCosts = () => {
    const laborHours = parseInt(crewAffected) * 8 // Assume 8-hour day
    const laborCost = laborHours * project.hourly_rate
    const overheadCost = project.daily_overhead
    const totalCost = laborCost + overheadCost
    
    return { laborHours, laborCost, overheadCost, totalCost }
  }

  const handleSubmit = async () => {
    if (!weatherData) {
      setError('Please fetch current weather data first')
      return
    }
    
    if (selectedConditions.length === 0) {
      setError('Please select at least one weather condition')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const costs = calculateCosts()
      
      const delayData = {
        project_id: project.id,
        start_time: new Date().toISOString(),
        weather_condition: selectedConditions.join(', '),
        delay_reason: notes || 'Weather conditions exceeded safe work thresholds',
        crew_size: parseInt(crewAffected),
        hourly_rate: project.hourly_rate,
        labor_hours_lost: costs.laborHours,
        labor_cost: costs.laborCost,
        overhead_cost: costs.overheadCost,
        total_cost: costs.totalCost,
        
        // New insurance fields
        precipitation_inches: weatherData.precipitation,
        wind_speed_mph: weatherData.windSpeed,
        temperature_high: weatherData.temperature,
        temperature_low: weatherData.temperature,
        activities_affected: {
          activities: affectedActivities,
          other: notes
        },
        noaa_report_url: `https://api.weather.gov/stations/${weatherData.station.id}/observations/latest`,
        
        // Metadata
        verified: true,
        delay_type: 'weather',
        crew_affected: parseInt(crewAffected),
        supervisor_notes: notes
      }
      
      // Save weather reading
      const { error: weatherError } = await supabase.from('weather_readings').insert({
        project_id: project.id,
        timestamp: weatherData.timestamp,
        temperature: weatherData.temperature,
        wind_speed: weatherData.windSpeed,
        wind_direction: weatherData.windDirection ? Math.round(weatherData.windDirection) : null, // Round to integer
        precipitation: weatherData.precipitation,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        visibility: weatherData.visibility,
        conditions: weatherData.conditions,
        source: 'NOAA',
        source_station_id: weatherData.station.id,
        raw_data: {
          ...weatherData.raw,
          station_distance_miles: weatherData.station.distance,
          station_name: weatherData.station.name,
          noaa_observation_url: `https://api.weather.gov/stations/${weatherData.station.id}/observations/latest`
        }
      })
      
      if (weatherError) {
        console.error('Weather reading insert error:', weatherError)
        throw new Error(`Failed to save weather reading: ${weatherError.message || JSON.stringify(weatherError)}`)
      }
      
      // Create delay event
      const { error: delayError } = await supabase
        .from('delay_events')
        .insert(delayData)
      
      if (delayError) {
        console.error('Delay event insert error:', delayError)
        throw new Error(`Failed to save delay event: ${delayError.message || JSON.stringify(delayError)}`)
      }
      
      if (onSuccess) onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save delay'
      setError(errorMessage)
      console.error('Save error:', {
        error: err,
        message: errorMessage,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const costs = calculateCosts()

  return (
    <div className="space-y-6">
      {/* Weather Fetch Section */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-600" />
            Current Weather Conditions
          </CardTitle>
          <CardDescription>
            Fetch official NOAA weather data for {project.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {project.address}
            </div>
            
            {!weatherData ? (
              <Button 
                onClick={handleFetchWeather}
                disabled={fetchingWeather}
                className="w-full"
              >
                {fetchingWeather ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching NOAA Data...
                  </>
                ) : (
                  <>
                    <CloudRain className="mr-2 h-4 w-4" />
                    Fetch Current Weather
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Weather Data Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Temperature</span>
                    </div>
                    <p className="text-xl font-bold">{weatherData.temperature.toFixed(0)}°F</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Wind Speed</span>
                    </div>
                    <p className="text-xl font-bold">{weatherData.windSpeed.toFixed(0)} mph</p>
                    {weatherData.windGust && (
                      <p className="text-xs text-gray-500">Gusts: {weatherData.windGust.toFixed(0)} mph</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Precipitation</span>
                    </div>
                    <p className="text-xl font-bold">{weatherData.precipitation.toFixed(2)}"</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CloudRain className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Conditions</span>
                    </div>
                    <p className="text-sm font-medium">{weatherData.conditions}</p>
                  </div>
                </div>
                
                {/* Station Info */}
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-900">Weather Station</p>
                  <p className="text-blue-700">{weatherData.station.name} ({weatherData.station.id})</p>
                  <p className="text-blue-600">{weatherData.station.distance.toFixed(1)} miles from site</p>
                  <p className="text-blue-600">Updated: {format(new Date(weatherData.timestamp), 'p')}</p>
                </div>
                
                {/* Threshold Violations */}
                {violations.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <p className="font-medium text-red-900 mb-1">Threshold Violations:</p>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {violations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleFetchWeather}
                  size="sm"
                  className="w-full"
                >
                  Refresh Weather Data
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delay Details */}
      <Card>
        <CardHeader>
          <CardTitle>Delay Details</CardTitle>
          <CardDescription>Document the impact of weather conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weather Conditions */}
          <div>
            <Label className="mb-3 block">What weather conditions are affecting work?</Label>
            <div className="grid grid-cols-2 gap-3">
              {weatherConditions.map(condition => (
                <button
                  key={condition.id}
                  type="button"
                  onClick={() => {
                    setSelectedConditions(prev =>
                      prev.includes(condition.id)
                        ? prev.filter(c => c !== condition.id)
                        : [...prev, condition.id]
                    )
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedConditions.includes(condition.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <condition.icon className={`h-5 w-5 ${condition.color} mx-auto mb-1`} />
                  <span className="text-sm font-medium">{condition.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Affected Activities */}
          <div>
            <Label className="mb-3 block">Which activities are affected?</Label>
            <div className="space-y-2">
              {activities.map(activity => (
                <label key={activity} className="flex items-center gap-2">
                  <Checkbox
                    checked={affectedActivities.includes(activity)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAffectedActivities(prev => [...prev, activity])
                      } else {
                        setAffectedActivities(prev => prev.filter(a => a !== activity))
                      }
                    }}
                  />
                  <span className="text-sm">{activity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Crew Impact */}
          <div>
            <Label htmlFor="crewAffected">Crew Members Affected</Label>
            <Input
              id="crewAffected"
              type="number"
              value={crewAffected}
              onChange={(e) => setCrewAffected(e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-gray-600 mt-1">
              Default: {project.crew_size} (full crew)
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Safety concerns, site conditions, decisions made..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Cost Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated Cost Impact
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Labor Hours Lost:</span>
                <span className="font-medium ml-2">{costs.laborHours}</span>
              </div>
              <div>
                <span className="text-gray-600">Labor Cost:</span>
                <span className="font-medium ml-2">${costs.laborCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Daily Overhead:</span>
                <span className="font-medium ml-2">${costs.overheadCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-bold text-lg ml-2">${costs.totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !weatherData || selectedConditions.length === 0}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Document Delay
            </>
          )}
        </Button>
      </div>
    </div>
  )
}