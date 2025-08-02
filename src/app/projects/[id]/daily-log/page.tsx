'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Cloud,
  FileText,
  Save,
  Users,
  Wrench,
  Camera,
  CheckCircle2,
  XCircle,
  Thermometer,
  Wind,
  Droplets
} from 'lucide-react'
import { format } from 'date-fns'
import { ProjectTask, DelayCategory } from '@/types/tasks'

interface Props {
  params: Promise<{
    id: string
  }>
}

interface TaskLogEntry {
  taskId: string
  delayed: boolean
  delayReason?: string
  delayCategory?: DelayCategory
  hoursWorked: number
  progressMade: number
  crewPresent: string[]
  equipmentUsed: string[]
  notes?: string
  photos: string[]
}

export default function DailyLogPage({ params }: Props) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [currentWeather, setCurrentWeather] = useState<any>(null)
  const [taskLogs, setTaskLogs] = useState<Record<string, TaskLogEntry>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(p => setProjectId(p.id))
  }, [params])

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId, selectedDate])

  async function loadProjectData() {
    try {
      // Load project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      // Load active tasks
      const { data: tasksData } = await supabase
        .from('project_tasks')
        .select(`
          *,
          task_crew_assignments!left (
            id,
            crew_member_id,
            is_outsourced,
            outsource_company_name,
            crew_members!left (
              name
            )
          ),
          task_equipment_assignments!left (
            id,
            equipment_id,
            is_rented,
            rental_equipment_type,
            equipment!left (
              name,
              type
            )
          )
        `)
        .eq('project_id', projectId)
        .not('status', 'in', '(completed,cancelled)')
        .order('sequence_order')

      // Load current weather
      const { data: weatherData } = await supabase
        .from('project_weather')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_source', 'observation')
        .order('collected_at', { ascending: false })
        .limit(1)
        .single()

      // Load existing logs for selected date
      const { data: existingLogs } = await supabase
        .from('task_daily_logs')
        .select('*')
        .in('task_id', tasksData?.map(t => t.id) || [])
        .eq('log_date', selectedDate)

      setProject(projectData)
      setTasks(tasksData || [])
      setCurrentWeather(weatherData)

      // Initialize task logs
      const logs: Record<string, TaskLogEntry> = {}
      tasksData?.forEach(task => {
        const existingLog = existingLogs?.find(l => l.task_id === task.id)
        logs[task.id] = {
          taskId: task.id,
          delayed: existingLog?.delayed || false,
          delayReason: existingLog?.delay_reason || '',
          delayCategory: existingLog?.delay_category || 'other',
          hoursWorked: existingLog?.hours_worked || 0,
          progressMade: existingLog?.progress_made || 0,
          crewPresent: existingLog?.crew_present || [],
          equipmentUsed: existingLog?.equipment_used || [],
          notes: existingLog?.notes || '',
          photos: existingLog?.photos || []
        }
      })
      setTaskLogs(logs)
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function submitDailyLogs() {
    setSubmitting(true)
    try {
      const logsToSubmit = Object.entries(taskLogs)
        .filter(([_, log]) => log.hoursWorked > 0 || log.delayed)
        .map(([taskId, log]) => ({
          task_id: taskId,
          log_date: selectedDate,
          delayed: log.delayed,
          delay_reason: log.delayReason,
          delay_category: log.delayCategory || 'other',
          weather_snapshot: currentWeather ? {
            temperature: currentWeather.temperature,
            wind_speed: currentWeather.wind_speed,
            precipitation_amount: currentWeather.precipitation_amount,
            conditions: currentWeather.conditions,
            humidity: currentWeather.humidity
          } : null,
          crew_present: log.crewPresent,
          equipment_used: log.equipmentUsed,
          hours_worked: log.hoursWorked,
          progress_made: log.progressMade,
          notes: log.notes,
          photos: log.photos
        }))

      // Upsert logs
      const { error: logError } = await supabase
        .from('task_daily_logs')
        .upsert(logsToSubmit, { 
          onConflict: 'task_id,log_date',
          ignoreDuplicates: false 
        })

      if (logError) throw logError

      // Update task progress
      for (const [taskId, log] of Object.entries(taskLogs)) {
        if (log.progressMade > 0) {
          const task = tasks.find(t => t.id === taskId)
          if (task) {
            const newProgress = Math.min(100, (task.progress_percentage || 0) + log.progressMade)
            await supabase
              .from('project_tasks')
              .update({ 
                progress_percentage: newProgress,
                status: newProgress === 100 ? 'completed' : task.status
              })
              .eq('id', taskId)
          }
        }
      }

      // Show success and redirect
      alert('Daily logs submitted successfully!')
      router.push(`/projects/${projectId}/dashboard`)
    } catch (error) {
      console.error('Error submitting logs:', error)
      alert('Failed to submit logs. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateTaskLog = (taskId: string, updates: Partial<TaskLogEntry>) => {
    setTaskLogs(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...updates }
    }))
  }

  const getDelayImpact = (task: ProjectTask) => {
    if (!task.weather_sensitive || !task.weather_thresholds || !currentWeather) {
      return null
    }

    const violations = []
    const thresholds = task.weather_thresholds

    if (thresholds.wind_speed && currentWeather.wind_speed > thresholds.wind_speed) {
      violations.push(`Wind: ${currentWeather.wind_speed}mph > ${thresholds.wind_speed}mph`)
    }
    if (thresholds.precipitation && currentWeather.precipitation_amount > thresholds.precipitation) {
      violations.push(`Rain: ${currentWeather.precipitation_amount}" > ${thresholds.precipitation}"`)
    }
    if (thresholds.temperature_min && currentWeather.temperature < thresholds.temperature_min) {
      violations.push(`Temp: ${currentWeather.temperature}°F < ${thresholds.temperature_min}°F`)
    }
    if (thresholds.temperature_max && currentWeather.temperature > thresholds.temperature_max) {
      violations.push(`Temp: ${currentWeather.temperature}°F > ${thresholds.temperature_max}°F`)
    }

    return violations.length > 0 ? violations : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Work Log</h1>
          <p className="text-gray-600 mt-1">{project?.name}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            {currentWeather && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  {currentWeather.temperature?.toFixed(0)}°F
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="h-4 w-4" />
                  {currentWeather.wind_speed?.toFixed(0)}mph
                </span>
                {currentWeather.precipitation_amount > 0 && (
                  <span className="flex items-center gap-1">
                    <Droplets className="h-4 w-4" />
                    {currentWeather.precipitation_amount}"
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Logs */}
        <div className="space-y-6">
          {tasks.map(task => {
            const log = taskLogs[task.id]
            const weatherViolations = getDelayImpact(task)
            const assignedCrew = (task as any).task_crew_assignments || []
            const assignedEquipment = (task as any).task_equipment_assignments || []

            return (
              <Card key={task.id} className={cn(
                "border-2 transition-all",
                log?.delayed && "border-red-300 bg-red-50/50"
              )}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{task.type.replace(/_/g, ' ')}</Badge>
                        {task.weather_sensitive && (
                          <Badge variant="secondary" className="text-xs">
                            <Cloud className="h-3 w-3 mr-1" />
                            Weather Sensitive
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="text-2xl font-bold">{task.progress_percentage}%</div>
                    </div>
                  </div>

                  {weatherViolations && (
                    <Alert className="mt-4 border-amber-300 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm">
                        <strong>Weather thresholds exceeded:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {weatherViolations.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="work" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="work">Work Details</TabsTrigger>
                      <TabsTrigger value="delays">Delays</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                    </TabsList>

                    <TabsContent value="work" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Hours Worked</Label>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={log?.hoursWorked || 0}
                            onChange={(e) => updateTaskLog(task.id, { 
                              hoursWorked: parseFloat(e.target.value) || 0 
                            })}
                          />
                        </div>
                        <div>
                          <Label>Progress Made (%)</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[log?.progressMade || 0]}
                              onValueChange={([value]) => updateTaskLog(task.id, { 
                                progressMade: value 
                              })}
                              max={100 - task.progress_percentage}
                              step={5}
                              className="w-full"
                            />
                            <div className="text-sm text-gray-600 text-center">
                              +{log?.progressMade || 0}% today
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Work Notes</Label>
                        <Textarea
                          placeholder="Describe work completed, issues encountered..."
                          value={log?.notes || ''}
                          onChange={(e) => updateTaskLog(task.id, { notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="delays" className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`delayed-${task.id}`}
                          checked={log?.delayed || false}
                          onCheckedChange={(checked) => updateTaskLog(task.id, { 
                            delayed: checked as boolean 
                          })}
                        />
                        <Label htmlFor={`delayed-${task.id}`} className="font-medium">
                          Task was delayed today
                        </Label>
                      </div>

                      {log?.delayed && (
                        <>
                          <div>
                            <Label>Delay Category</Label>
                            <Select
                              value={log.delayCategory}
                              onValueChange={(value) => updateTaskLog(task.id, { 
                                delayCategory: value as DelayCategory 
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weather">Weather</SelectItem>
                                <SelectItem value="crew">Crew</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="material">Material</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Delay Reason</Label>
                            <Textarea
                              placeholder="Describe the cause of delay..."
                              value={log.delayReason || ''}
                              onChange={(e) => updateTaskLog(task.id, { 
                                delayReason: e.target.value 
                              })}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4" />
                          Crew Present
                        </Label>
                        <div className="space-y-2">
                          {assignedCrew.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={log?.crewPresent.includes(assignment.id) || false}
                                onCheckedChange={(checked) => {
                                  const current = log?.crewPresent || []
                                  updateTaskLog(task.id, {
                                    crewPresent: checked
                                      ? [...current, assignment.id]
                                      : current.filter(id => id !== assignment.id)
                                  })
                                }}
                              />
                              <Label className="text-sm font-normal">
                                {assignment.is_outsourced
                                  ? assignment.outsource_company_name
                                  : assignment.crew_members?.name || 'Crew Member'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4" />
                          Equipment Used
                        </Label>
                        <div className="space-y-2">
                          {assignedEquipment.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={log?.equipmentUsed.includes(assignment.id) || false}
                                onCheckedChange={(checked) => {
                                  const current = log?.equipmentUsed || []
                                  updateTaskLog(task.id, {
                                    equipmentUsed: checked
                                      ? [...current, assignment.id]
                                      : current.filter(id => id !== assignment.id)
                                  })
                                }}
                              />
                              <Label className="text-sm font-normal">
                                {assignment.is_rented
                                  ? assignment.rental_equipment_type
                                  : assignment.equipment?.name || 'Equipment'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={submitDailyLogs}
            disabled={submitting}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Daily Logs'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/dashboard`)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}