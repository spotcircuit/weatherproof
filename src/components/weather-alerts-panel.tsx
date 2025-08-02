'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertTriangle,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { format, addHours, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  projectId: string
}

interface WeatherForecast {
  collected_at: string
  temperature: number
  wind_speed: number
  precipitation_amount: number
  precipitation_probability: number
  conditions: string[]
  short_forecast: string
}

interface TaskAtRisk {
  id: string
  name: string
  type: string
  weather_thresholds: any
  expected_start?: string
  status: string
}

interface WeatherAlert {
  id: string
  event_type: string
  severity: string
  urgency: string
  headline: string
  description: string
  onset: string
  expires: string
}

export function WeatherAlertsPanel({ projectId }: Props) {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([])
  const [tasksAtRisk, setTasksAtRisk] = useState<TaskAtRisk[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadWeatherData()
    // Refresh every 30 minutes
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [projectId])

  async function loadWeatherData() {
    try {
      // Get forecast data
      const { data: forecastData } = await supabase
        .from('project_weather')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_source', 'forecast')
        .gt('collected_at', new Date().toISOString())
        .order('collected_at')
        .limit(24) // Next 24 hours

      // Get weather-sensitive tasks
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, name, type, weather_thresholds, expected_start, status')
        .eq('project_id', projectId)
        .eq('weather_sensitive', true)
        .not('status', 'in', '(completed,cancelled)')

      // Get active weather alerts
      const { data: alerts } = await supabase
        .from('project_weather_alerts')
        .select('*')
        .eq('project_id', projectId)
        .gt('expires', new Date().toISOString())
        .order('severity', { ascending: false })

      setForecasts(forecastData || [])
      setWeatherAlerts(alerts || [])

      // Check which tasks will be affected by forecast
      if (tasks && forecastData) {
        const riskyTasks = tasks.filter(task => {
          if (!task.weather_thresholds) return false
          
          return forecastData.some(forecast => {
            const thresholds = task.weather_thresholds
            return (
              (thresholds.wind_speed && forecast.wind_speed > thresholds.wind_speed) ||
              (thresholds.precipitation && forecast.precipitation_amount > thresholds.precipitation) ||
              (thresholds.temperature_min && forecast.temperature < thresholds.temperature_min) ||
              (thresholds.temperature_max && forecast.temperature > thresholds.temperature_max)
            )
          })
        })
        setTasksAtRisk(riskyTasks)
      }
    } catch (error) {
      console.error('Error loading weather data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function refreshWeather() {
    setRefreshing(true)
    await loadWeatherData()
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group forecasts by hour
  const hourlyForecasts = forecasts.reduce((acc, forecast) => {
    const hour = new Date(forecast.collected_at).getHours()
    if (!acc[hour] || new Date(forecast.collected_at) < new Date(acc[hour].collected_at)) {
      acc[hour] = forecast
    }
    return acc
  }, {} as Record<number, WeatherForecast>)

  const next12Hours = Array.from({ length: 12 }, (_, i) => {
    const date = addHours(new Date(), i)
    const hour = date.getHours()
    return {
      hour,
      date,
      forecast: hourlyForecasts[hour]
    }
  })

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': return 'bg-red-600 text-white'
      case 'severe': return 'bg-orange-600 text-white'
      case 'moderate': return 'bg-amber-600 text-white'
      case 'minor': return 'bg-yellow-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getWeatherIcon = (conditions: string[]) => {
    const condStr = conditions?.join(' ').toLowerCase() || ''
    if (condStr.includes('rain') || condStr.includes('shower')) return <Droplets className="h-4 w-4" />
    if (condStr.includes('wind')) return <Wind className="h-4 w-4" />
    if (condStr.includes('cloud')) return <Cloud className="h-4 w-4" />
    return <Thermometer className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* NOAA Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900">Active Weather Alerts</AlertTitle>
          <AlertDescription className="mt-3 space-y-3">
            {weatherAlerts.map(alert => (
              <div key={alert.id} className="border-l-4 border-red-600 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-red-900">{alert.event_type}</p>
                    <p className="text-sm text-red-700 mt-1">{alert.headline}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-red-600">
                        Expires: {format(new Date(alert.expires), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Weather Risk Summary */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              Weather Forecast & Task Risks
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWeather}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tasks at Risk */}
          {tasksAtRisk.length > 0 && (
            <Alert className="mb-6 border-amber-500 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-900">
                {tasksAtRisk.length} Task{tasksAtRisk.length > 1 ? 's' : ''} at Weather Risk
              </AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  {tasksAtRisk.map(task => (
                    <div key={task.id} className="text-sm">
                      <span className="font-medium text-amber-900">{task.name}</span>
                      <span className="text-amber-700"> - {task.type.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Hourly Forecast */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">12-Hour Forecast</h4>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {next12Hours.map(({ hour, date, forecast }) => {
                  const isNow = hour === new Date().getHours() && isSameDay(date, new Date())
                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      className={cn(
                        "flex-shrink-0 w-24 p-3 rounded-lg border text-center",
                        isNow ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                        forecast && (
                          forecast.wind_speed > 20 || forecast.precipitation_amount > 0.1
                        ) && "border-amber-500 bg-amber-50"
                      )}
                    >
                      <p className="text-xs font-medium text-gray-600">
                        {isNow ? 'Now' : format(date, 'h a')}
                      </p>
                      {forecast ? (
                        <>
                          <div className="my-2">
                            {getWeatherIcon(forecast.conditions)}
                          </div>
                          <p className="text-lg font-bold">
                            {forecast.temperature.toFixed(0)}°
                          </p>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Wind className="h-3 w-3 text-gray-500" />
                              <span>{forecast.wind_speed.toFixed(0)}mph</span>
                            </div>
                            {forecast.precipitation_amount > 0 && (
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Droplets className="h-3 w-3 text-blue-500" />
                                <span>{forecast.precipitation_amount}"</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-xs text-gray-400">
                          No data
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Weather Outlook</p>
                <p className="text-gray-600 mt-1">
                  {tasksAtRisk.length === 0
                    ? "No weather risks detected for active tasks in the next 12 hours."
                    : `${tasksAtRisk.length} task${tasksAtRisk.length > 1 ? 's' : ''} may be impacted by weather conditions. Consider rescheduling or preparing alternative work.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}