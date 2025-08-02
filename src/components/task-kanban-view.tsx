'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Cloud,
  AlertTriangle,
  Calendar,
  Users,
  Wrench,
  ChevronRight,
  Link2,
  ExternalLink
} from 'lucide-react'
import { ProjectTask, TaskStatus } from '@/types/tasks'
import { cn } from '@/lib/utils'

interface Props {
  projectId: string
  view?: 'kanban' | 'timeline'
}

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: 'bg-gray-100' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { status: 'on_track', label: 'On Track', color: 'bg-green-50' },
  { status: 'at_risk', label: 'At Risk', color: 'bg-amber-50' },
  { status: 'delayed', label: 'Delayed', color: 'bg-red-50' },
  { status: 'completed', label: 'Completed', color: 'bg-gray-50' },
]

export function TaskKanbanView({ projectId, view = 'kanban' }: Props) {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [projectId])

  async function loadTasks() {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          task_crew_assignments (
            id,
            is_outsourced,
            outsource_company_name,
            crew_member_id
          ),
          task_equipment_assignments (
            id,
            is_rented,
            rental_company_name,
            equipment_id
          )
        `)
        .eq('project_id', projectId)
        .order('sequence_order')

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const TaskCard = ({ task }: { task: ProjectTask }) => {
    const crewCount = (task as any).task_crew_assignments?.length || 0
    const equipmentCount = (task as any).task_equipment_assignments?.length || 0
    const hasOutsourcedCrew = (task as any).task_crew_assignments?.some((a: any) => a.is_outsourced)
    const hasRentedEquipment = (task as any).task_equipment_assignments?.some((a: any) => a.is_rented)

    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          selectedTask === task.id && "ring-2 ring-primary"
        )}
        onClick={() => setSelectedTask(task.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {task.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {task.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            {task.forecast_delay_risk && (
              <Cloud className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{task.progress_percentage}%</span>
            </div>
            <Progress value={task.progress_percentage} className="h-2" />
          </div>

          {/* Dates */}
          {task.expected_start && (
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {new Date(task.expected_start).toLocaleDateString()} - 
                {task.expected_end ? new Date(task.expected_end).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          )}

          {/* Delay Info */}
          {task.delay_days > 0 && (
            <div className="flex items-center text-xs text-red-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>{task.delay_days} days delayed</span>
            </div>
          )}

          {/* Resources */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-600">
              <Users className="h-3 w-3 mr-1" />
              <span>{crewCount}</span>
              {hasOutsourcedCrew && (
                <ExternalLink className="h-3 w-3 ml-1 text-blue-500" />
              )}
            </div>
            <div className="flex items-center text-gray-600">
              <Wrench className="h-3 w-3 mr-1" />
              <span>{equipmentCount}</span>
              {hasRentedEquipment && (
                <ExternalLink className="h-3 w-3 ml-1 text-blue-500" />
              )}
            </div>
          </div>

          {/* Dependencies */}
          {task.blocking_task_id && (
            <div className="flex items-center text-xs text-amber-600">
              <Link2 className="h-3 w-3 mr-1" />
              <span>Blocked by another task</span>
            </div>
          )}

          {/* Weather Sensitivity */}
          {task.weather_sensitive && (
            <Badge variant="secondary" className="text-xs w-full justify-center">
              Weather Sensitive
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  if (view === 'timeline') {
    // Timeline view implementation
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Task Timeline</h3>
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center">
                <div className="flex-shrink-0 w-32 text-right pr-4">
                  <div className="text-sm font-medium">{task.type.replace(/_/g, ' ')}</div>
                  {task.expected_start && (
                    <div className="text-xs text-gray-500">
                      {new Date(task.expected_start).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    task.status === 'completed' ? "bg-green-500 border-green-500" :
                    task.status === 'delayed' ? "bg-red-500 border-red-500" :
                    task.status === 'at_risk' ? "bg-amber-500 border-amber-500" :
                    task.status === 'on_track' ? "bg-blue-500 border-blue-500" :
                    "bg-gray-300 border-gray-300"
                  )} />
                  {index < tasks.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-300 ml-1.5 mt-1" />
                  )}
                </div>
                <div className="flex-1 ml-4">
                  <TaskCard task={task} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Kanban view
  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.status)
          
          return (
            <div
              key={column.status}
              className={cn(
                "flex-shrink-0 w-80 rounded-lg p-4",
                column.color
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id)
                      e.dataTransfer.setData('currentStatus', task.status)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const taskId = e.dataTransfer.getData('taskId')
                      const currentStatus = e.dataTransfer.getData('currentStatus')
                      if (currentStatus !== column.status) {
                        updateTaskStatus(taskId, column.status)
                      }
                    }}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}