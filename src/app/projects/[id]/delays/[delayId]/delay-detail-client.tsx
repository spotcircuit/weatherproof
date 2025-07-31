'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  CloudRain,
  DollarSign,
  FileText,
  Users,
  Droplets,
  Wind,
  Thermometer,
  Activity,
  CheckCircle2,
  XCircle,
  Download,
  Edit,
  Camera,
  MapPin,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns/format'
import NavigationHeader from "@/components/navigation-header"

interface DelayDetailClientProps {
  delay: any
  project: any
  weatherData: any[]
  photos: any[]
}

export function DelayDetailClient({ delay, project, weatherData, photos }: DelayDetailClientProps) {
  const isActive = !delay.end_time
  const duration = delay.end_time 
    ? (new Date(delay.end_time).getTime() - new Date(delay.start_time).getTime()) / (1000 * 60 * 60)
    : (new Date().getTime() - new Date(delay.start_time).getTime()) / (1000 * 60 * 60)

  // Calculate weather stats
  const avgTemp = weatherData.length > 0 
    ? weatherData.reduce((sum, w) => sum + (w.temperature || 0), 0) / weatherData.length
    : 0
  const maxWind = weatherData.length > 0
    ? Math.max(...weatherData.map(w => w.wind_speed || 0))
    : 0
  const totalPrecip = weatherData.reduce((sum, w) => sum + (w.precipitation || 0), 0)

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Weather Delay Details
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <MapPin className="h-4 w-4" />
                    <p>{project.name} - {project.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="shadow-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Delay
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Status Alert */}
          {isActive && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Active Delay</h3>
                <p className="text-amber-700 text-sm mt-1">
                  This delay is currently ongoing. Weather conditions are still being monitored.
                </p>
              </div>
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-50">Status</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  {isActive ? <Activity className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{isActive ? 'Active' : 'Completed'}</div>
                <p className="text-red-100 text-sm mt-1">
                  {format(new Date(delay.start_time), 'MMM d, h:mm a')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-50">Duration</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{duration.toFixed(1)} hrs</div>
                <p className="text-purple-100 text-sm mt-1">
                  {delay.labor_hours_lost} labor hours lost
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-50">Weather Impact</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CloudRain className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold capitalize">{delay.weather_type}</div>
                <p className="text-blue-100 text-sm mt-1">
                  Severity: {delay.severity}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-50">Cost Impact</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">${delay.total_cost?.toLocaleString() || 0}</div>
                <p className="text-green-100 text-sm mt-1">
                  Labor + Equipment costs
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delay Details */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Delay Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Time</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {format(new Date(delay.start_time), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Time</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {delay.end_time ? format(new Date(delay.end_time), 'MMM d, yyyy h:mm a') : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-700 mt-2 leading-relaxed">
                      {delay.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Weather Type</label>
                      <div className="flex items-center gap-2 mt-2">
                        <CloudRain className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900 capitalize">{delay.weather_type}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Severity</label>
                      <Badge 
                        className={`mt-2 ${
                          delay.severity === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                          delay.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {delay.severity}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weather Data */}
              {weatherData.length > 0 && (
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Weather Conditions During Delay
                    </CardTitle>
                    <CardDescription>Recorded weather data from site sensors</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                          <Thermometer className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600">Avg Temperature</p>
                        <p className="text-2xl font-bold text-gray-900">{avgTemp.toFixed(1)}°F</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                          <Wind className="h-6 w-6 text-orange-600" />
                        </div>
                        <p className="text-sm text-gray-600">Max Wind Speed</p>
                        <p className="text-2xl font-bold text-gray-900">{maxWind.toFixed(0)} mph</p>
                      </div>
                      <div className="text-center p-4 bg-cyan-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                          <Droplets className="h-6 w-6 text-cyan-600" />
                        </div>
                        <p className="text-sm text-gray-600">Total Precipitation</p>
                        <p className="text-2xl font-bold text-gray-900">{totalPrecip.toFixed(2)}"</p>
                      </div>
                    </div>

                    {/* Readings List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Hourly Readings</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {weatherData.map((reading, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              {format(new Date(reading.timestamp), 'h:mm a')}
                            </span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Thermometer className="h-4 w-4 text-orange-500" />
                                {reading.temperature?.toFixed(0)}°F
                              </span>
                              <span className="flex items-center gap-1">
                                <Wind className="h-4 w-4 text-blue-500" />
                                {reading.wind_speed?.toFixed(0)} mph
                              </span>
                              {reading.precipitation > 0 && (
                                <span className="flex items-center gap-1">
                                  <Droplets className="h-4 w-4 text-cyan-500" />
                                  {reading.precipitation}"
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Camera className="h-5 w-5 text-gray-600" />
                      Documentation Photos
                    </CardTitle>
                    <CardDescription>{photos.length} photos uploaded</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img 
                            src={photo.url} 
                            alt={photo.description || 'Delay documentation'}
                            className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button size="sm" variant="secondary">
                              View Full Size
                            </Button>
                          </div>
                          {photo.description && (
                            <p className="text-sm text-gray-600 mt-2">{photo.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Labor Cost</span>
                    <span className="font-semibold text-gray-900">
                      ${delay.labor_cost?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Equipment Cost</span>
                    <span className="font-semibold text-gray-900">
                      ${delay.equipment_cost?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Other Costs</span>
                    <span className="font-semibold text-gray-900">
                      ${delay.other_cost?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Cost</span>
                      <span className="text-xl font-bold text-green-600">
                        ${delay.total_cost?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Description
                  </Button>
                  {isActive && (
                    <Button className="w-full justify-start bg-red-600 hover:bg-red-700 text-white">
                      <XCircle className="h-4 w-4 mr-2" />
                      End Delay
                    </Button>
                  )}
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </CardContent>
              </Card>

              {/* Related Info */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-lg">Related Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">NOAA Report ID</label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">
                      {delay.noaa_report_id || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {delay.created_by || 'System'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(new Date(delay.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}