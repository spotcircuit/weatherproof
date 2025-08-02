'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CloudRain, 
  MapPin, 
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Cloud,
  Gauge,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Map as MapIcon,
  RefreshCw
} from "lucide-react"
import { format } from 'date-fns/format'
import Link from 'next/link'

interface WeatherDashboardProps {
  projects: any[]
  weatherAlerts: any[]
}

export default function WeatherDashboard({ projects, weatherAlerts }: WeatherDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshWeather = async (projectId: string) => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/weather/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          latitude: projects.find(p => p.id === projectId)?.latitude,
          longitude: projects.find(p => p.id === projectId)?.longitude
        })
      })
      
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error refreshing weather:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getWeatherIcon = (conditions: any) => {
    // Ensure conditions is a string
    const conditionsStr = String(conditions || '').toLowerCase()
    if (!conditionsStr) return '🌤️'
    
    if (conditionsStr.includes('rain') || conditionsStr.includes('shower')) return '🌧️'
    if (conditionsStr.includes('snow')) return '🌨️'
    if (conditionsStr.includes('cloud') || conditionsStr.includes('overcast')) return '☁️'
    if (conditionsStr.includes('sun') || conditionsStr.includes('clear')) return '☀️'
    if (conditionsStr.includes('storm') || conditionsStr.includes('thunder')) return '⛈️'
    if (conditionsStr.includes('fog') || conditionsStr.includes('mist')) return '🌫️'
    return '🌤️'
  }

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Weather Center
          </h1>
          <p className="text-gray-600 mt-1">Monitor weather conditions across all your project sites</p>
        </div>

        {/* Weather Alerts Summary */}
        {weatherAlerts.length > 0 && (
          <Card className="mb-8 border-2 border-red-300 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                Active Weather Alerts ({weatherAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weatherAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-red-900">{alert.projects.name}</p>
                        <p className="text-sm text-red-700 mt-1">{alert.alert_summary}</p>
                      </div>
                      <Link href={`/projects/${alert.projects.id}`}>
                        <Button size="sm" variant="destructive">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
            <TabsTrigger value="map">Weather Map</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const weather = project.latestWeather
                const exceedsThresholds = weather && (
                  (project.weather_thresholds?.wind_speed && weather.wind_speed > project.weather_thresholds.wind_speed) ||
                  (project.weather_thresholds?.precipitation !== undefined && weather.precipitation > project.weather_thresholds.precipitation) ||
                  (project.weather_thresholds?.temperature_min && weather.temperature < project.weather_thresholds.temperature_min) ||
                  (project.weather_thresholds?.temperature_max && weather.temperature > project.weather_thresholds.temperature_max)
                )

                return (
                  <Card key={project.id} className={`shadow-xl hover:shadow-2xl transition-all ${
                    exceedsThresholds ? 'border-2 border-orange-400' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {project.address}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRefreshWeather(project.id)}
                          disabled={refreshing}
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {weather ? (
                        <div className="space-y-4">
                          {/* Current Conditions */}
                          <div className="text-center">
                            <div className="text-4xl mb-2">{getWeatherIcon(weather.conditions)}</div>
                            <p className="text-lg font-medium">{weather.conditions || 'Clear'}</p>
                            <p className="text-3xl font-bold mt-2">{weather.temperature?.toFixed(0)}°F</p>
                            {weather.feels_like && (
                              <p className="text-sm text-gray-600">Feels like {weather.feels_like.toFixed(0)}°F</p>
                            )}
                          </div>

                          {/* Weather Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-blue-500" />
                              <span>{weather.wind_speed?.toFixed(0)} mph {weather.wind_direction ? getWindDirection(weather.wind_direction) : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-cyan-500" />
                              <span>{weather.precipitation?.toFixed(2)}"</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Gauge className="h-4 w-4 text-purple-500" />
                              <span>{weather.pressure?.toFixed(0)} mb</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span>{weather.visibility?.toFixed(0)} mi</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cloud className="h-4 w-4 text-gray-500" />
                              <span>{weather.humidity}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>{format(new Date(weather.collected_at), 'h:mm a')}</span>
                            </div>
                          </div>

                          {/* Threshold Warnings */}
                          {exceedsThresholds && (
                            <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                              <p className="text-sm font-medium text-orange-900 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                Work threshold exceeded
                              </p>
                            </div>
                          )}

                          {/* Forecast Summary */}
                          {weather.forecast_summary && (
                            <div className="pt-3 border-t">
                              <p className="text-sm text-gray-600">{weather.forecast_summary}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CloudRain className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No weather data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* 7-Day Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="shadow-xl">
                  <CardHeader>
                    <CardTitle>{project.name} - 7 Day Forecast</CardTitle>
                    <CardDescription>{project.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.latestWeather?.forecast_days ? (
                      <div className="grid grid-cols-7 gap-2">
                        {project.latestWeather.forecast_days.map((day: any, index: number) => (
                          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">{format(new Date(day.date), 'EEE')}</p>
                            <div className="text-2xl my-2">{getWeatherIcon(day.conditions)}</div>
                            <p className="text-sm font-bold">{day.high}°/{day.low}°</p>
                            {day.precipitation_chance > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                {day.precipitation_chance}% rain
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        Extended forecast not available
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Weather Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Project Weather Map
                </CardTitle>
                <CardDescription>
                  Visual overview of weather conditions at all project sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <MapIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Interactive weather map coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Will show real-time weather overlays for all project locations
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}