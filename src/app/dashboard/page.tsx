import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  CloudRain, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Wind,
  Droplets,
  Thermometer,
  Activity,
  Building2,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MapPin,
  Wrench,
  HardHat,
  FileWarning,
  CalendarCheck,
  Timer
} from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns/format'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all data in parallel for better performance
  const [
    projectsResult,
    alertsResult,
    delayEventsResult,
    reportsResult,
    recentWeatherResult,
    crewMembersResult,
    equipmentResult,
    upcomingDeadlinesResult,
    weatherAlertsResult,
    projectsWithWeatherResult
  ] = await Promise.all([
    // Fetch user's projects
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    
    // Fetch recent unread alerts
    supabase
      .from("alerts")
      .select("*, projects(name)")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5),
    
    // Fetch delay events for cost calculation
    supabase
      .from("delay_events")
      .select("*, projects!inner(user_id)")
      .eq("projects.user_id", user.id)
      .gte("start_time", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 30 days
    
    // Fetch reports
    supabase
      .from("reports")
      .select("*, projects!inner(user_id)")
      .eq("projects.user_id", user.id)
      .order("created_at", { ascending: false }),
    
    // Fetch recent weather readings - get the absolute latest
    supabase
      .from("project_weather")
      .select(`
        *,
        projects!inner(
          name,
          user_id,
          timezone
        )
      `)
      .eq("projects.user_id", user.id)
      .order("collected_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    
    // Fetch crew members with assignment counts
    supabase
      .from("crew_members")
      .select(`
        *,
        project_crew_assignments!left(
          project_id,
          projects!inner(
            name,
            active
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("active", true),
    
    // Fetch equipment with assignment counts
    supabase
      .from("equipment")
      .select(`
        *,
        project_equipment_assignments!left(
          project_id,
          projects!inner(
            name,
            active
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("active", true),
    
    // Fetch projects with upcoming deadlines
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .gte("end_date", new Date().toISOString())
      .lte("end_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("end_date", { ascending: true }),
    
    // Fetch active weather alerts from the alerts table
    supabase
      .from("project_weather_alerts")
      .select(`
        *,
        projects!inner(
          id,
          name,
          user_id,
          latitude,
          longitude,
          weather_thresholds
        ),
        weather:weather_id (
          collected_at
        )
      `)
      .eq("projects.user_id", user.id)
      .order("onset", { ascending: false })
      .limit(10),
    
    // Fetch projects with their latest weather for risk assessment
    supabase
      .from("projects")
      .select(`
        *,
        project_weather!left(
          temperature,
          wind_speed,
          precipitation_amount,
          conditions,
          collected_at,
          has_alerts,
          short_forecast,
          detailed_forecast,
          highest_alert_severity
        )
      `)
      .eq("user_id", user.id)
      .eq("active", true)
      .eq("weather_collection_enabled", true)
  ])

  const projects = projectsResult.data || []
  const alerts = alertsResult.data || []
  const delayEvents = delayEventsResult.data || []
  const reports = reportsResult.data || []
  const recentWeather = recentWeatherResult.data || []
  const crewMembers = crewMembersResult.data || []
  const equipment = equipmentResult.data || []
  const upcomingDeadlines = upcomingDeadlinesResult.data || []
  const weatherAlerts = weatherAlertsResult.data || []
  const projectsWithWeather = projectsWithWeatherResult.data || []

  // Calculate statistics
  const activeProjects = projects.filter(p => p.active).length
  const totalDelaysThisMonth = delayEvents.length
  const totalDelayCost = delayEvents.reduce((sum, d) => sum + (d.total_cost || 0), 0)
  const totalHoursLost = delayEvents.reduce((sum, d) => sum + (d.labor_hours_lost || 0), 0)
  
  // Calculate projects at weather risk
  const projectsAtRisk = projectsWithWeather.filter(project => {
    const latestWeather = project.project_weather?.[0]
    if (!latestWeather || !project.weather_thresholds) return false
    
    const thresholds = project.weather_thresholds
    return (
      (thresholds.wind_speed && latestWeather.wind_speed > thresholds.wind_speed) ||
      (thresholds.precipitation !== undefined && latestWeather.precipitation > thresholds.precipitation) ||
      (thresholds.temperature_min && latestWeather.temperature < thresholds.temperature_min) ||
      (thresholds.temperature_max && latestWeather.temperature > thresholds.temperature_max)
    )
  })
  
  // Group weather alerts by project and show the most recent/severe
  const uniqueWeatherAlerts = weatherAlerts.reduce((acc: typeof weatherAlerts, alert: typeof weatherAlerts[0]) => {
    const existingAlert = acc.find((a: typeof weatherAlerts[0]) => a.projects.id === alert.projects.id)
    if (!existingAlert || new Date(alert.onset || alert.weather?.collected_at) > new Date(existingAlert.onset || existingAlert.weather?.collected_at)) {
      return [...acc.filter((a: typeof weatherAlerts[0]) => a.projects.id !== alert.projects.id), alert]
    }
    return acc
  }, [] as typeof weatherAlerts)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Welcome back!
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your projects today</p>
              </div>
              <Link href="/projects/new">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

        {/* Stats Overview with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
            <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-50">Active Projects</CardTitle>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold">{activeProjects}</div>
              <p className="text-blue-100 text-sm mt-1">
                Currently monitoring
              </p>
              <div className="mt-4 flex items-center text-blue-100">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {projects.length} total projects
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
            <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-50">Weather Delays</CardTitle>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold">{totalDelaysThisMonth}</div>
              <p className="text-orange-100 text-sm mt-1">
                Last 30 days
              </p>
              <div className="mt-4 flex items-center text-orange-100">
                <Activity className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {delayEvents.filter(d => !d.end_time).length} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
            <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-50">Hours Lost</CardTitle>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold">{totalHoursLost.toFixed(0)}</div>
              <p className="text-purple-100 text-sm mt-1">
                Labor hours this month
              </p>
              <div className="mt-4 flex items-center text-purple-100">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  Impact on productivity
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
            <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-50">Cost Impact</CardTitle>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold">${totalDelayCost.toLocaleString()}</div>
              <p className="text-green-100 text-sm mt-1">
                Documented delays
              </p>
              <div className="mt-4 flex items-center text-green-100">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {reports.length} reports ready
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOAA Weather Alerts */}
        {uniqueWeatherAlerts.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden border-2 border-red-300">
            <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    NOAA Weather Alerts
                  </CardTitle>
                  <CardDescription className="text-red-100">
                    Active weather warnings affecting your project sites
                  </CardDescription>
                </div>
                <Badge className="bg-white text-red-600 text-lg px-3 py-1">
                  {uniqueWeatherAlerts.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {uniqueWeatherAlerts.slice(0, 5).map((alert: typeof uniqueWeatherAlerts[0]) => (
                  <div key={alert.id} className="p-4 hover:bg-red-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{alert.projects.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <MapPin className="inline h-3 w-3" /> {alert.projects.latitude?.toFixed(4)}, {alert.projects.longitude?.toFixed(4)}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm text-red-700 font-medium">
                            {alert.event_type || 'Weather Alert Active'}
                          </p>
                          {alert.headline && (
                            <p className="text-xs text-gray-700 mt-1">
                              {alert.headline}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {alert.severity && (
                              <Badge variant={alert.severity === 'Extreme' || alert.severity === 'Severe' ? 'destructive' : 'secondary'} className="text-xs">
                                {alert.severity}
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500">
                              Expires: {format(new Date(alert.expires || alert.weather?.collected_at || new Date()), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link href={`/projects/${alert.projects.id}`}>
                        <Button variant="destructive" size="sm">
                          View Project
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects at Weather Risk - CRITICAL SECTION */}
        {projectsAtRisk.length > 0 && (
          <Card className="mb-8 border-0 shadow-2xl overflow-hidden border-4 border-orange-500 animate-pulse-border">
            <div className="h-3 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-gradient"></div>
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                      <AlertTriangle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <span className="block">WORK STOPPAGE REQUIRED</span>
                      <span className="text-lg font-normal text-orange-100">{projectsAtRisk.length} Project{projectsAtRisk.length > 1 ? 's' : ''} Exceeding Safety Thresholds</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-orange-100 text-base mt-2">
                    ⚠️ Current weather conditions exceed safe work limits - Immediate action required
                  </CardDescription>
                </div>
                <Link href={`/document?project=${projectsAtRisk[0]?.id}`}>
                  <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 shadow-lg font-bold">
                    <FileWarning className="mr-2 h-5 w-5" />
                    Document Delays Now
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {projectsAtRisk.map((project) => {
                  const weather = project.project_weather?.[0]
                  const thresholds = project.weather_thresholds
                  return (
                    <div key={project.id} className="p-6 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">{project.name}</p>
                              <p className="text-sm text-gray-600">{project.address}</p>
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 border-2 border-red-200">
                            <p className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              THRESHOLD VIOLATIONS:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {thresholds.wind_speed && weather.wind_speed > thresholds.wind_speed && (
                                <div className="bg-red-50 p-3 rounded-md border border-red-300">
                                  <p className="text-xs font-medium text-gray-700 mb-1">🌬️ WIND SPEED LIMIT EXCEEDED</p>
                                  <p className="font-bold text-red-700 text-lg">
                                    {weather.wind_speed} mph
                                  </p>
                                  <p className="text-xs text-red-600">
                                    Limit: {thresholds.wind_speed} mph
                                  </p>
                                </div>
                              )}
                              {thresholds.precipitation !== undefined && weather.precipitation > thresholds.precipitation && (
                                <div className="bg-red-50 p-3 rounded-md border border-red-300">
                                  <p className="text-xs font-medium text-gray-700 mb-1">💧 PRECIPITATION LIMIT EXCEEDED</p>
                                  <p className="font-bold text-red-700 text-lg">
                                    {weather.precipitation}"
                                  </p>
                                  <p className="text-xs text-red-600">
                                    Limit: {thresholds.precipitation}"
                                  </p>
                                </div>
                              )}
                              {thresholds.temperature_min && weather.temperature < thresholds.temperature_min && (
                                <div className="bg-blue-50 p-3 rounded-md border border-blue-300">
                                  <p className="text-xs font-medium text-gray-700 mb-1">🥶 BELOW MIN TEMPERATURE</p>
                                  <p className="font-bold text-blue-700 text-lg">
                                    {weather.temperature}°F
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    Minimum: {thresholds.temperature_min}°F
                                  </p>
                                </div>
                              )}
                              {thresholds.temperature_max && weather.temperature > thresholds.temperature_max && (
                                <div className="bg-red-50 p-3 rounded-md border border-red-300">
                                  <p className="text-xs font-medium text-gray-700 mb-1">🔥 ABOVE MAX TEMPERATURE</p>
                                  <p className="font-bold text-red-700 text-lg">
                                    {weather.temperature}°F
                                  </p>
                                  <p className="text-xs text-red-600">
                                    Maximum: {thresholds.temperature_max}°F
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <Building2 className="mr-2 h-4 w-4" />
                              View Project
                            </Button>
                          </Link>
                          <Link href={`/document?project=${project.id}`}>
                            <Button variant="destructive" size="lg" className="w-full shadow-lg">
                              <FileWarning className="mr-2 h-5 w-5" />
                              Document Delay
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Automation Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-600" />
                Weather Collection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600">Last Collection</p>
                  <p className="font-semibold text-gray-900">
                    {(() => {
                      // Find the most recent collection time across all projects
                      const mostRecentTime = projects
                        .filter(p => p.weather_last_collected_at)
                        .map(p => new Date(p.weather_last_collected_at))
                        .sort((a, b) => b.getTime() - a.getTime())[0];
                      
                      if (mostRecentTime) {
                        return format(mostRecentTime, 'MMM d, h:mm a');
                      } else if (recentWeather.length > 0) {
                        return format(new Date(recentWeather[0].collected_at), 'MMM d, h:mm a');
                      } else {
                        return 'No data collected yet';
                      }
                    })()}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Collection Frequency</p>
                  <p className="font-medium text-gray-700">Every 30 minutes</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Projects Monitored</p>
                  <p className="font-medium text-cyan-700">
                    {projects.filter(p => p.active && p.weather_collection_enabled).length} of {activeProjects}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                Cost Impact Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600">Today's Impact</p>
                  <p className="font-bold text-2xl text-red-600">
                    ${delayEvents
                      .filter(d => new Date(d.start_time).toDateString() === new Date().toDateString())
                      .reduce((sum, d) => sum + (d.total_cost || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">This Week</p>
                  <p className="font-medium text-gray-700">
                    ${delayEvents
                      .filter(d => new Date(d.start_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                      .reduce((sum, d) => sum + (d.total_cost || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <Link href="/reports?action=insurance-claim">
                  <Button variant="outline" size="sm" className="w-full mt-3 border-red-200 text-red-700 hover:bg-red-50">
                    Generate Claim Report
                    <FileWarning className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insurance Claim Workflow Dashboard - Only show if there are delays */}
        {delayEvents.length > 0 && (
          <DashboardClient 
            projects={projects}
            delayEvents={delayEvents}
            reports={reports}
          />
        )}

        {/* Recent Alerts with enhanced styling */}
        {alerts && alerts.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Recent Alerts
                  </CardTitle>
                  <CardDescription>Unread weather alerts and notifications</CardDescription>
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                  {alerts.length} New
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 transition-all hover:bg-gray-50 ${
                    alert.severity === 'CRITICAL' ? 'border-l-4 border-red-500' :
                    alert.severity === 'HIGH' ? 'border-l-4 border-orange-500' :
                    alert.severity === 'MEDIUM' ? 'border-l-4 border-yellow-500' :
                    'border-l-4 border-blue-500'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          alert.severity === 'CRITICAL' ? 'bg-red-100' :
                          alert.severity === 'HIGH' ? 'bg-orange-100' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.severity === 'CRITICAL' ? 'text-red-600' :
                            alert.severity === 'HIGH' ? 'text-orange-600' :
                            alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {alert.projects?.name}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-100"
                        onClick={async () => {
                          'use server'
                          const supabase = await createServerClientNext()
                          await supabase
                            .from('alerts')
                            .update({ read: true, read_at: new Date().toISOString() })
                            .eq('id', alert.id)
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <Link href="/alerts">
                  <Button variant="outline" className="w-full">
                    View All Alerts
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Crew Overview */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="h-5 w-5 text-indigo-600" />
                Crew Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Crew</span>
                  <span className="font-semibold text-indigo-700">{crewMembers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned to Projects</span>
                  <span className="font-medium text-gray-700">
                    {crewMembers.filter(c => c.project_crew_assignments && c.project_crew_assignments.length > 0).length}
                  </span>
                </div>
                <Link href="/crew">
                  <Button variant="outline" size="sm" className="w-full mt-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    Manage Crew
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Status */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-600" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Equipment</span>
                  <span className="font-semibold text-amber-700">{equipment.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned to Projects</span>
                  <span className="font-medium text-gray-700">
                    {equipment.filter(e => e.project_equipment_assignments && e.project_equipment_assignments.length > 0).length}
                  </span>
                </div>
                <Link href="/equipment">
                  <Button variant="outline" size="sm" className="w-full mt-3 border-amber-200 text-amber-700 hover:bg-amber-50">
                    View Equipment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-rose-600" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? (
                  <>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{upcomingDeadlines[0].name}</p>
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <Timer className="h-3 w-3" />
                        {format(new Date(upcomingDeadlines[0].end_date), 'MMM d')}
                      </p>
                    </div>
                    <Link href="/projects">
                      <Button variant="outline" size="sm" className="w-full mt-3 border-rose-200 text-rose-700 hover:bg-rose-50">
                        View All
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">No upcoming deadlines</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List with enhanced styling and alternating colors */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  Active Projects
                </CardTitle>
                <CardDescription>Monitor your construction projects and weather impacts</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  View All Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {projects && projects.length > 0 ? (
              <div>
                {projects.slice(0, 5).map((project, index) => {
                  // Find recent delays for this project
                  const projectDelays = delayEvents.filter(d => d.project_id === project.id)
                  const hasActiveDelay = projectDelays.some(d => !d.end_time)
                  
                  // Find latest weather for this project
                  const projectWeather = recentWeather.find(w => w.project_id === project.id)
                  
                  // Alternating row colors for better contrast
                  const bgColor = index % 2 === 0 
                    ? 'bg-white hover:bg-gray-50' 
                    : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50/70 hover:to-indigo-50/70'
                  
                  const projectTypeColors: Record<string, string> = {
                    'residential': 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    'commercial': 'bg-blue-100 text-blue-800 border-blue-300',
                    'infrastructure': 'bg-purple-100 text-purple-800 border-purple-300',
                    'industrial': 'bg-orange-100 text-orange-800 border-orange-300'
                  }
                  const projectTypeColor = projectTypeColors[project.project_type?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 border-gray-300'
                  
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className={`p-6 cursor-pointer transition-all group border-b last:border-b-0 ${bgColor}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                                {project.name}
                              </h3>
                              {hasActiveDelay && (
                                <Badge className="bg-red-500 text-white shadow-sm animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  ACTIVE DELAY
                                </Badge>
                              )}
                              <Badge className={`${projectTypeColor} font-medium capitalize`}>
                                {project.project_type || 'General'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <p className="text-gray-700 font-medium">{project.address}</p>
                            </div>
                            <div className="flex items-center gap-6 mt-3 text-sm">
                              <span className="flex items-center gap-1 text-gray-600 font-medium">
                                <Users className="h-4 w-4 text-blue-500" />
                                {project.crew_size} crew
                              </span>
                              <span className="flex items-center gap-1 text-gray-600 font-medium">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                ${project.hourly_rate}/hr
                              </span>
                              <span className="flex items-center gap-1 text-gray-600 font-medium">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                Started {format(new Date(project.start_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {/* Weather Forecast */}
                            {projectWeather && (
                              <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Thermometer className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">{projectWeather.temperature?.toFixed(0)}°F</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Wind className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">{projectWeather.wind_speed?.toFixed(0)} mph</span>
                                  </div>
                                  {projectWeather.precipitation_amount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Droplets className="h-4 w-4 text-cyan-500" />
                                      <span className="font-medium">{projectWeather.precipitation_amount?.toFixed(2)}"</span>
                                    </div>
                                  )}
                                  <span className="text-gray-600 flex-1">
                                    {projectWeather.conditions || 'Clear'}
                                  </span>
                                </div>
                                {projectWeather.has_alerts && projectWeather.highest_alert_severity && (
                                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-red-700 font-medium">
                                        {projectWeather.highest_alert_severity} Weather Alert Active
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {projectWeather.short_forecast && (
                                  <p className="text-xs text-gray-600 mt-1">{projectWeather.short_forecast}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-3">
                            <div className="flex items-center gap-2 justify-end">
                              {project.active ? (
                                <Badge className="bg-green-500 text-white shadow-sm">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ACTIVE
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-400 text-white">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  INACTIVE
                                </Badge>
                              )}
                            </div>
                            {projectDelays.length > 0 ? (
                              <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-gray-200">
                                <p className="text-lg font-bold text-red-600">
                                  ${projectDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600 font-medium">
                                  {projectDelays.length} delay{projectDelays.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 font-medium">
                                No delays
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <CloudRain className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Get started by creating your first project.
                </p>
                <Link href="/projects/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
  )
}