import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, CloudRain, FileText, DollarSign, AlertTriangle, Clock, TrendingUp, Wind } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

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
    recentWeatherResult
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
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    
    // Fetch recent weather readings
    supabase
      .from("weather_readings")
      .select("*, projects!inner(name, user_id)")
      .eq("projects.user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(10)
  ])

  const projects = projectsResult.data || []
  const alerts = alertsResult.data || []
  const delayEvents = delayEventsResult.data || []
  const reports = reportsResult.data || []
  const recentWeather = recentWeatherResult.data || []

  // Calculate statistics
  const activeProjects = projects.filter(p => p.active).length
  const totalDelaysThisMonth = delayEvents.length
  const totalDelayCost = delayEvents.reduce((sum, d) => sum + (d.total_cost || 0), 0)
  const totalHoursLost = delayEvents.reduce((sum, d) => sum + (d.labor_hours_lost || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <CloudRain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Currently monitoring
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weather Delays</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDelaysThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Lost</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHoursLost.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                Labor hours this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDelayCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Documented delays
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        {alerts && alerts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Unread weather alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.severity === 'CRITICAL' ? 'bg-red-50' :
                    alert.severity === 'HIGH' ? 'bg-orange-50' :
                    alert.severity === 'MEDIUM' ? 'bg-yellow-50' :
                    'bg-blue-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'CRITICAL' ? 'text-red-600' :
                        alert.severity === 'HIGH' ? 'text-orange-600' :
                        alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {alert.projects?.name} • {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Weather Conditions */}
        {recentWeather.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Weather Conditions</CardTitle>
              <CardDescription>Latest readings from your project sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWeather.slice(0, 5).map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <Wind className="h-5 w-5 text-gray-600 mb-1" />
                        <span className="text-xs font-medium">{reading.wind_speed?.toFixed(0) || 0} mph</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{reading.projects?.name}</p>
                        <p className="text-xs text-gray-500">
                          {reading.temperature?.toFixed(0)}°F • {reading.conditions || 'Clear'} • {format(new Date(reading.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {reading.precipitation > 0 && (
                      <div className="text-sm text-blue-600 font-medium">
                        {reading.precipitation}" rain
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Manage and monitor your construction projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 10).map((project) => {
                  // Find recent delays for this project
                  const projectDelays = delayEvents.filter(d => d.project_id === project.id)
                  const hasActiveDelay = projectDelays.some(d => !d.end_time)
                  
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{project.name}</h3>
                            {hasActiveDelay && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Active Delay
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{project.address}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {project.project_type || 'General'} • {project.crew_size} crew • ${project.hourly_rate}/hr
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {project.active ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-gray-400">Inactive</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Started {format(new Date(project.start_date), 'MMM d, yyyy')}
                          </p>
                          {projectDelays.length > 0 && (
                            <p className="text-xs text-orange-600 font-medium mt-1">
                              {projectDelays.length} delays • ${projectDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CloudRain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first project.
                </p>
                <div className="mt-6">
                  <Link href="/projects/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}