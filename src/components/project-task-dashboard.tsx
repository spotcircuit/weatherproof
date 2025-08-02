'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Cloud, Clock, Users, Wrench } from 'lucide-react'
import { TaskStatus } from '@/types/tasks'

interface ProjectTaskSummary {
  id: string
  name: string
  address: string
  status: string
  weather_thresholds: any
  totalTasks: number
  tasksDelayed: number
  tasksAtRisk: number
  tasksWithForecastRisk: number
  completedTasks: number
  progressPercentage: number
  currentWeather?: {
    temperature: number
    wind_speed: number
    precipitation_amount: number
    conditions: string[]
  }
}

interface Props {
  projectId: string
}

export function ProjectTaskDashboard({ projectId }: Props) {
  const [summary, setSummary] = useState<ProjectTaskSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProjectSummary()
  }, [projectId])

  async function loadProjectSummary() {
    try {
      // Get project with task counts
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_tasks (
            id,
            status,
            forecast_delay_risk,
            delayed_today
          ),
          project_weather!left (
            temperature,
            wind_speed,
            precipitation_amount,
            conditions
          )
        `)
        .eq('id', projectId)
        .eq('project_weather.data_source', 'observation')
        .order('project_weather.collected_at', { ascending: false })
        .limit(1, { foreignTable: 'project_weather' })
        .single()

      if (error) throw error

      const tasks = project.project_tasks || []
      const weather = project.project_weather?.[0]

      const summary: ProjectTaskSummary = {
        id: project.id,
        name: project.name,
        address: project.address,
        status: project.status,
        weather_thresholds: project.weather_thresholds,
        totalTasks: tasks.length,
        tasksDelayed: tasks.filter((t: any) => t.status === 'delayed').length,
        tasksAtRisk: tasks.filter((t: any) => t.status === 'at_risk').length,
        tasksWithForecastRisk: tasks.filter((t: any) => t.forecast_delay_risk).length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        progressPercentage: tasks.length > 0 
          ? Math.round((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100)
          : 0,
        currentWeather: weather ? {
          temperature: weather.temperature,
          wind_speed: weather.wind_speed,
          precipitation_amount: weather.precipitation_amount,
          conditions: weather.conditions || []
        } : undefined
      }

      setSummary(summary)
    } catch (error) {
      console.error('Error loading project summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!summary) {
    return <div>Failed to load project summary</div>
  }

  const weatherRisk = summary.currentWeather && summary.weather_thresholds && (
    (summary.weather_thresholds.wind_speed && summary.currentWeather.wind_speed > summary.weather_thresholds.wind_speed) ||
    (summary.weather_thresholds.precipitation && summary.currentWeather.precipitation_amount > summary.weather_thresholds.precipitation)
  )

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{summary.name}</h2>
            <p className="text-gray-600 mt-1">{summary.address}</p>
          </div>
          <Badge variant={summary.status === 'active' ? 'default' : 'secondary'}>
            {summary.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Project Progress</span>
            <span>{summary.progressPercentage}%</span>
          </div>
          <Progress value={summary.progressPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{summary.completedTasks} completed</span>
            <span>{summary.totalTasks} total tasks</span>
          </div>
        </div>

        {/* Weather Alert */}
        {weatherRisk && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <Cloud className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-sm font-medium text-amber-800">
                Current weather exceeds project thresholds
              </span>
            </div>
            {summary.currentWeather && (
              <div className="mt-2 text-xs text-amber-700">
                Wind: {summary.currentWeather.wind_speed}mph | 
                Precip: {summary.currentWeather.precipitation_amount}" | 
                Temp: {summary.currentWeather.temperature}°F
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Delayed</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.tasksDelayed}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTasks > 0 ? Math.round((summary.tasksDelayed / summary.totalTasks) * 100) : 0}% of tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.tasksAtRisk}</div>
            <p className="text-xs text-muted-foreground">
              May face delays soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Risk</CardTitle>
            <Cloud className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.tasksWithForecastRisk}</div>
            <p className="text-xs text-muted-foreground">
              Weather risk in 72hrs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalTasks - summary.tasksDelayed - summary.tasksAtRisk}
            </div>
            <p className="text-xs text-muted-foreground">
              Progressing as planned
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}