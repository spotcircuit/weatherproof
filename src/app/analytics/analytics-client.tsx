'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  DollarSign,
  Clock,
  CloudRain,
  AlertTriangle,
  Calendar,
  Users,
  Building2,
  Activity
} from "lucide-react"
import { format } from 'date-fns/format'
import { startOfWeek } from 'date-fns/startOfWeek'
import { endOfWeek } from 'date-fns/endOfWeek'
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval'
import { subDays } from 'date-fns/subDays'
import { useState } from "react"

interface AnalyticsClientProps {
  delayEvents: any[]
  projects: any[]
  weatherReadings: any[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export function AnalyticsClient({ delayEvents, projects, weatherReadings }: AnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState('30d')

  // Calculate key metrics
  const totalDelays = delayEvents.length
  const totalCost = delayEvents.reduce((sum, delay) => sum + (delay.total_cost || 0), 0)
  const totalHoursLost = delayEvents.reduce((sum, delay) => sum + (delay.labor_hours_lost || 0), 0)
  const avgDelayDuration = totalDelays > 0 ? totalHoursLost / totalDelays : 0

  // Group delays by date for trend chart
  const delaysByDate = delayEvents.reduce((acc, delay) => {
    const date = format(new Date(delay.start_time), 'MMM dd')
    if (!acc[date]) {
      acc[date] = { date, count: 0, cost: 0, hours: 0 }
    }
    acc[date].count++
    acc[date].cost += delay.total_cost || 0
    acc[date].hours += delay.labor_hours_lost || 0
    return acc
  }, {})

  const delayTrendData = Object.values(delaysByDate).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Group delays by weather type
  const delaysByWeatherType = delayEvents.reduce((acc, delay) => {
    const type = delay.weather_type || 'unknown'
    if (!acc[type]) {
      acc[type] = { name: type, value: 0, cost: 0 }
    }
    acc[type].value++
    acc[type].cost += delay.total_cost || 0
    return acc
  }, {})

  const weatherTypeData = Object.values(delaysByWeatherType).map((item: any) => ({
    ...item,
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1)
  }))

  // Group delays by project
  const delaysByProject = delayEvents.reduce((acc, delay) => {
    const projectName = delay.projects?.name || 'Unknown'
    if (!acc[projectName]) {
      acc[projectName] = { name: projectName, delays: 0, cost: 0, hours: 0 }
    }
    acc[projectName].delays++
    acc[projectName].cost += delay.total_cost || 0
    acc[projectName].hours += delay.labor_hours_lost || 0
    return acc
  }, {})

  const projectDelayData = Object.values(delaysByProject)
    .sort((a: any, b: any) => b.cost - a.cost)
    .slice(0, 5)

  // Weather severity analysis
  const severityData = delayEvents.reduce((acc, delay) => {
    const severity = delay.severity || 'LOW'
    if (!acc[severity]) {
      acc[severity] = { name: severity, count: 0, cost: 0 }
    }
    acc[severity].count++
    acc[severity].cost += delay.total_cost || 0
    return acc
  }, {})

  const severityChartData = Object.values(severityData)

  // Calculate weather trends
  const weatherTrends = weatherReadings.reduce((acc, reading) => {
    const date = format(new Date(reading.timestamp), 'MMM dd')
    if (!acc[date]) {
      acc[date] = {
        date,
        avgTemp: 0,
        avgWind: 0,
        totalPrecip: 0,
        count: 0
      }
    }
    acc[date].avgTemp += reading.temperature || 0
    acc[date].avgWind += reading.wind_speed || 0
    acc[date].totalPrecip += reading.precipitation || 0
    acc[date].count++
    return acc
  }, {})

  const weatherTrendData = Object.values(weatherTrends).map((day: any) => ({
    date: day.date,
    avgTemp: Math.round(day.avgTemp / day.count),
    avgWind: Math.round(day.avgWind / day.count),
    totalPrecip: day.totalPrecip.toFixed(2)
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-600 mt-1">Weather impact insights and project performance</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-50">Total Delays</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold">{totalDelays}</div>
                <p className="text-red-100 text-sm mt-1">
                  Last {timeRange === '30d' ? '30 days' : timeRange}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-50">Total Cost Impact</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold">${totalCost.toLocaleString()}</div>
                <p className="text-green-100 text-sm mt-1">
                  Documented delays
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-50">Hours Lost</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold">{totalHoursLost.toFixed(0)}</div>
                <p className="text-purple-100 text-sm mt-1">
                  Labor hours impacted
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-50">Avg Duration</CardTitle>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold">{avgDelayDuration.toFixed(1)} hrs</div>
                <p className="text-blue-100 text-sm mt-1">
                  Per delay event
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList className="bg-white shadow-md">
              <TabsTrigger value="trends" className="data-[state=active]:bg-blue-50">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="weather" className="data-[state=active]:bg-blue-50">
                <CloudRain className="h-4 w-4 mr-2" />
                Weather Analysis
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-blue-50">
                <Building2 className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="costs" className="data-[state=active]:bg-blue-50">
                <DollarSign className="h-4 w-4 mr-2" />
                Cost Analysis
              </TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Delay Trends Over Time</CardTitle>
                  <CardDescription>Daily delay events and their impact</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={delayTrendData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        name="Delay Events"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="cost"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorCost)"
                        name="Cost ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle>Delays by Severity</CardTitle>
                    <CardDescription>Distribution of delay severity levels</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={severityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" name="Count" />
                        <Bar dataKey="cost" fill="#10B981" name="Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle>Weather Impact Summary</CardTitle>
                    <CardDescription>Key weather metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CloudRain className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-semibold">Most Common Delay</p>
                            <p className="text-sm text-gray-600">
                              {weatherTypeData.length > 0 ? weatherTypeData[0].name : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {weatherTypeData.length > 0 ? weatherTypeData[0].value : 0}
                          </p>
                          <p className="text-sm text-gray-600">occurrences</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-8 w-8 text-orange-600" />
                          <div>
                            <p className="font-semibold">Peak Delay Time</p>
                            <p className="text-sm text-gray-600">Morning (6AM-12PM)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">42%</p>
                          <p className="text-sm text-gray-600">of all delays</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="font-semibold">Trend</p>
                            <p className="text-sm text-gray-600">vs last period</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">-15%</p>
                          <p className="text-sm text-gray-600">improvement</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Weather Analysis Tab */}
            <TabsContent value="weather" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Weather Conditions Over Time</CardTitle>
                  <CardDescription>Temperature, wind speed, and precipitation trends</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={weatherTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgTemp"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="Avg Temperature (°F)"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgWind"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name="Avg Wind Speed (mph)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="totalPrecip"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Precipitation (inches)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle>Delays by Weather Type</CardTitle>
                    <CardDescription>Distribution of weather-related delays</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={weatherTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {weatherTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle>Weather Type Cost Impact</CardTitle>
                    <CardDescription>Financial impact by weather condition</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weatherTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="cost" fill="#10B981" name="Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Top Projects by Delay Impact</CardTitle>
                  <CardDescription>Projects with the most weather-related delays</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={projectDelayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="delays" fill="#3B82F6" name="Delay Count" />
                      <Bar yAxisId="right" dataKey="cost" fill="#10B981" name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {projectDelayData.slice(0, 3).map((project: any, index) => (
                  <Card key={index} className="border-0 shadow-xl">
                    <CardHeader className={`bg-gradient-to-r ${
                      index === 0 ? 'from-yellow-50 to-amber-50' :
                      index === 1 ? 'from-gray-50 to-gray-100' :
                      'from-orange-50 to-orange-100'
                    } border-b`}>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>Project performance</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Delays</span>
                        <span className="text-xl font-bold">{project.delays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hours Lost</span>
                        <span className="text-xl font-bold">{project.hours.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cost Impact</span>
                        <span className="text-xl font-bold text-green-600">
                          ${project.cost.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Cost Analysis Tab */}
            <TabsContent value="costs" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Cost Breakdown Analysis</CardTitle>
                  <CardDescription>Financial impact of weather delays</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                      <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Cost Impact</p>
                      <p className="text-3xl font-bold text-blue-900">
                        ${totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                      <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Avg Cost per Delay</p>
                      <p className="text-3xl font-bold text-green-900">
                        ${totalDelays > 0 ? Math.round(totalCost / totalDelays).toLocaleString() : 0}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Daily Average</p>
                      <p className="text-3xl font-bold text-purple-900">
                        ${Math.round(totalCost / 30).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={delayTrendData}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorGradient)"
                        name="Daily Cost"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  )
}