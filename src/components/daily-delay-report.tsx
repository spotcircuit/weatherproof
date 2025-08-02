'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Cloud,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Users,
  Wrench
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DailyDelayEntry {
  task_id: string
  task_name: string
  task_type: string
  status: string
  delay_reason: string
  delay_category: string
  delayed_today: boolean
  forecast_delay_risk: boolean
  delay_days: number
  weather_conditions?: any
  crew_present: string[]
  hours_worked: number
  progress_made: number
  notes?: string
}

interface Props {
  projectId: string
  date?: Date
}

export function DailyDelayReport({ projectId, date = new Date() }: Props) {
  const [delays, setDelays] = useState<DailyDelayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalDelays: 0,
    weatherDelays: 0,
    crewDelays: 0,
    equipmentDelays: 0,
    otherDelays: 0,
    totalDelayDays: 0,
    tasksAtRisk: 0
  })
  const supabase = createClient()

  useEffect(() => {
    loadDailyReport()
  }, [projectId, date])

  async function loadDailyReport() {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Get all tasks with delays or changes today
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select(`
          id,
          name,
          type,
          status,
          delay_reason,
          delayed_today,
          forecast_delay_risk,
          delay_days,
          task_daily_logs!left (
            log_date,
            delayed,
            delay_reason,
            delay_category,
            weather_snapshot,
            crew_present,
            hours_worked,
            progress_made,
            notes
          )
        `)
        .eq('project_id', projectId)
        .or('delayed_today.eq.true,status.in.(delayed,at_risk)')
        .eq('task_daily_logs.log_date', dateStr)

      if (tasksError) throw tasksError

      // Process the data
      const delayEntries: DailyDelayEntry[] = []
      let weatherDelays = 0
      let crewDelays = 0
      let equipmentDelays = 0
      let otherDelays = 0
      let totalDelayDays = 0
      let tasksAtRisk = 0

      tasksData?.forEach(task => {
        const todayLog = task.task_daily_logs?.[0]
        
        if (task.status === 'delayed' || task.status === 'at_risk' || task.delayed_today) {
          const entry: DailyDelayEntry = {
            task_id: task.id,
            task_name: task.name,
            task_type: task.type,
            status: task.status,
            delay_reason: todayLog?.delay_reason || task.delay_reason || '',
            delay_category: todayLog?.delay_category || 'other',
            delayed_today: task.delayed_today,
            forecast_delay_risk: task.forecast_delay_risk,
            delay_days: task.delay_days,
            weather_conditions: todayLog?.weather_snapshot,
            crew_present: todayLog?.crew_present || [],
            hours_worked: todayLog?.hours_worked || 0,
            progress_made: todayLog?.progress_made || 0,
            notes: todayLog?.notes
          }

          delayEntries.push(entry)

          // Count by category
          if (todayLog?.delay_category === 'weather') weatherDelays++
          else if (todayLog?.delay_category === 'crew') crewDelays++
          else if (todayLog?.delay_category === 'equipment') equipmentDelays++
          else otherDelays++

          if (task.status === 'at_risk') tasksAtRisk++
          totalDelayDays += task.delay_days || 0
        }
      })

      setDelays(delayEntries)
      setSummary({
        totalDelays: delayEntries.length,
        weatherDelays,
        crewDelays,
        equipmentDelays,
        otherDelays,
        totalDelayDays,
        tasksAtRisk
      })
    } catch (error) {
      console.error('Error loading daily report:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportReport() {
    // TODO: Implement PDF export
    console.log('Exporting report...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const getDelayCategoryIcon = (category: string) => {
    switch (category) {
      case 'weather': return <Cloud className="h-4 w-4" />
      case 'crew': return <Users className="h-4 w-4" />
      case 'equipment': return <Wrench className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getDelayCategoryColor = (category: string) => {
    switch (category) {
      case 'weather': return 'text-blue-600 bg-blue-50'
      case 'crew': return 'text-purple-600 bg-purple-50'
      case 'equipment': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Delay Report</h2>
            <p className="text-gray-600 mt-1">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Delays</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.totalDelays}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalDelayDays} total delay days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weather Delays</CardTitle>
            <Cloud className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.weatherDelays}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalDelays > 0 ? Math.round((summary.weatherDelays / summary.totalDelays) * 100) : 0}% of delays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks at Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
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
            <CardTitle className="text-sm font-medium">Other Delays</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summary.crewDelays + summary.equipmentDelays + summary.otherDelays}
            </div>
            <p className="text-xs text-muted-foreground">
              Crew, equipment, other
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delay Details */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Delay Details</h3>
        </div>
        <div className="divide-y">
          {delays.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No delays reported for this date
            </div>
          ) : (
            delays.map(delay => (
              <div key={delay.task_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{delay.task_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {delay.task_type.replace(/_/g, ' ')}
                      </Badge>
                      <Badge 
                        variant={delay.status === 'delayed' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {delay.status}
                      </Badge>
                    </div>
                    
                    {delay.delay_reason && (
                      <p className="mt-2 text-sm text-gray-600">{delay.delay_reason}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                        getDelayCategoryColor(delay.delay_category)
                      )}>
                        {getDelayCategoryIcon(delay.delay_category)}
                        <span className="capitalize">{delay.delay_category}</span>
                      </div>

                      {delay.delay_days > 0 && (
                        <span className="text-xs text-red-600">
                          {delay.delay_days} days behind schedule
                        </span>
                      )}

                      {delay.forecast_delay_risk && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Cloud className="h-3 w-3" />
                          Weather risk ahead
                        </span>
                      )}
                    </div>

                    {/* Work details */}
                    {(delay.hours_worked > 0 || delay.crew_present.length > 0) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                        <div className="flex gap-4">
                          {delay.hours_worked > 0 && (
                            <span>Hours worked: {delay.hours_worked}</span>
                          )}
                          {delay.progress_made !== 0 && (
                            <span>Progress: {delay.progress_made > 0 ? '+' : ''}{delay.progress_made}%</span>
                          )}
                          {delay.crew_present.length > 0 && (
                            <span>Crew: {delay.crew_present.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {delay.notes && (
                      <Alert className="mt-3">
                        <FileText className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {delay.notes}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}