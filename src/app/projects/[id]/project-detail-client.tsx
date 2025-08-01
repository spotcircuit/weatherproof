'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Clock,
  CloudRain,
  FileText,
  Edit,
  Plus,
  ExternalLink,
  Trash2,
  MoreVertical,
  Wrench,
  Building2,
  Wind,
  Droplets,
  Thermometer,
  HardHat,
  UserPlus,
  WrenchIcon
} from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns/format'
import { GenerateReportDialog } from "@/components/generate-report-dialog"
import ProjectFormModal from "@/components/project-form-modal"
import CrewAssignmentsModal from "@/components/crew-assignments-modal"
import EquipmentAssignmentsModal from "@/components/equipment-assignments-modal"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProjectDetailClientProps {
  project: any
  delayEvents: any[]
  recentWeather: any[]
  reports: any[]
  weatherAlerts?: any[]
}

export function ProjectDetailClient({
  project,
  delayEvents,
  recentWeather,
  reports: initialReports,
  weatherAlerts = []
}: ProjectDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCrewModal, setShowCrewModal] = useState(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [reports, setReports] = useState(initialReports)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [crewAssignments, setCrewAssignments] = useState<any[]>([])
  const [equipmentAssignments, setEquipmentAssignments] = useState<any[]>([])

  // Fetch crew and equipment assignments
  useEffect(() => {
    fetchAssignments()
  }, [project.id])

  const fetchAssignments = async () => {
    // Fetch crew assignments
    const { data: crewData } = await supabase
      .from('project_crew_assignments')
      .select(`
        *,
        crew_members (
          id,
          name,
          role,
          hourly_rate
        )
      `)
      .eq('project_id', project.id)
      .is('unassigned_date', null)

    // Fetch equipment assignments
    const { data: equipmentData } = await supabase
      .from('project_equipment_assignments')
      .select(`
        *,
        equipment (
          id,
          name,
          type,
          daily_rate
        )
      `)
      .eq('project_id', project.id)
      .is('unassigned_date', null)

    setCrewAssignments(crewData || [])
    setEquipmentAssignments(equipmentData || [])
  }

  // Calculate stats
  const activeDelay = delayEvents?.find(d => !d.end_time)
  const totalDelays = delayEvents?.length || 0
  const totalCost = delayEvents?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0
  const totalHours = delayEvents?.reduce((sum, d) => sum + (d.labor_hours_lost || 0), 0) || 0

  const handleReportGenerated = (reportId: string) => {
    router.refresh()
  }

  const handleProjectUpdate = () => {
    router.refresh()
  }

  const handleDeleteProject = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      router.push('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with better spacing */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeDelay && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Active Weather Delay
                </span>
              )}
              <Button 
                onClick={() => setShowEditModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shadow-md">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Overview with visual pop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900">Total Delays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">{totalDelays}</div>
              <p className="text-sm text-blue-600 mt-1">
                {activeDelay ? '1 active' : 'All resolved'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900">Hours Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{totalHours.toFixed(0)}</div>
              <p className="text-sm text-purple-600 mt-1">
                Labor hours
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">${totalCost.toLocaleString()}</div>
              <p className="text-sm text-green-600 mt-1">
                Documented delays
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-900">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800">{reports?.length || 0}</div>
              <p className="text-sm text-orange-600 mt-1">
                Generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Weather with visual improvements */}
        {recentWeather && recentWeather.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-600" />
                Current Weather Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{recentWeather[0].temperature?.toFixed(0)}°F</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-gray-600">Wind Speed</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{recentWeather[0].wind_speed?.toFixed(0)} mph</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-cyan-600" />
                    <p className="text-sm text-gray-600">Precipitation</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{recentWeather[0].precipitation?.toFixed(2)}"</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Conditions</p>
                  <p className="text-xl font-bold text-gray-800">{recentWeather[0].conditions || 'Clear'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Last updated: {format(new Date(recentWeather[0].collected_at), 'p')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Weather Alerts */}
        {weatherAlerts && weatherAlerts.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden border-2 border-red-300">
            <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                Active Weather Alerts
              </CardTitle>
              <CardDescription className="text-red-600">
                NOAA weather warnings for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {weatherAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 hover:bg-red-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-red-700">
                          {alert.highest_alert_severity ? `${alert.highest_alert_severity} Alert` : 'Weather Alert Active'}
                        </p>
                        {alert.short_forecast && (
                          <p className="text-sm text-gray-700 mt-1">
                            {alert.short_forecast}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          Updated: {format(new Date(alert.collected_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details and Crew/Equipment Assignment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Project Information */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{project.project_type || 'General'}</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                onClick={() => setShowCrewModal(true)}
              >
                <p className="text-sm text-gray-500">Crew Size</p>
                <p className="font-medium flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <Users className="h-4 w-4" />
                  {project.crew_size} workers
                  <span className="text-xs text-gray-500">
                    ({crewAssignments.length} assigned)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hourly Rate</p>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {project.hourly_rate}/hour
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Daily Overhead</p>
                <p className="font-medium">${project.daily_overhead}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(project.start_date), 'PPP')}
                </p>
              </div>
              {project.end_date && (
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{format(new Date(project.end_date), 'PPP')}</p>
                </div>
              )}
              {project.deadline_date && (
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(project.deadline_date), 'PPP')}
                  </p>
                  {project.deadline_type && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {project.deadline_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crew Assignments */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-blue-600" />
                  Crew Assignments
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCrewModal(true)}
                  className="bg-white"
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {crewAssignments.length > 0 ? (
                <div className="space-y-3">
                  {crewAssignments.slice(0, 4).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{assignment.crew_members.name}</p>
                        <p className="text-sm text-gray-600">{assignment.crew_members.role}</p>
                      </div>
                      <Badge variant="secondary">${assignment.crew_members.hourly_rate}/hr</Badge>
                    </div>
                  ))}
                  {crewAssignments.length > 4 && (
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setShowCrewModal(true)}
                    >
                      View all {crewAssignments.length} assignments
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">No crew assigned yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowCrewModal(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Crew
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Assignments */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-100 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  Equipment
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowEquipmentModal(true)}
                  className="bg-white"
                >
                  <WrenchIcon className="mr-1 h-3 w-3" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {equipmentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {equipmentAssignments.slice(0, 4).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{assignment.equipment.name}</p>
                        <p className="text-sm text-gray-600">{assignment.equipment.type}</p>
                      </div>
                      <Badge variant="secondary">${assignment.equipment.daily_rate}/day</Badge>
                    </div>
                  ))}
                  {equipmentAssignments.length > 4 && (
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setShowEquipmentModal(true)}
                    >
                      View all {equipmentAssignments.length} equipment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">No equipment assigned yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowEquipmentModal(true)}
                  >
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    Assign Equipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weather Thresholds */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-100 border-b">
            <CardTitle>Weather Thresholds</CardTitle>
            <CardDescription>Conditions that trigger work stoppage</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.weather_thresholds.wind_speed && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Wind className="h-4 w-4" />
                    <span className="text-sm font-medium">Wind Speed</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">&gt; {project.weather_thresholds.wind_speed} mph</p>
                </div>
              )}
              {project.weather_thresholds.precipitation !== undefined && (
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-cyan-600 mb-1">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm font-medium">Precipitation</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">&gt; {project.weather_thresholds.precipitation}"</p>
                </div>
              )}
              {project.weather_thresholds.temperature_min && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-600 mb-1">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm font-medium">Min Temp</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">&lt; {project.weather_thresholds.temperature_min}°F</p>
                </div>
              )}
              {project.weather_thresholds.temperature_max && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm font-medium">Max Temp</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">&gt; {project.weather_thresholds.temperature_max}°F</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delay Events */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weather Delay Events</CardTitle>
                <CardDescription>All weather-related work stoppages</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {delayEvents && delayEvents.length > 0 ? (
              <div className="space-y-3">
                {delayEvents.map((delay) => (
                  <div key={delay.id} className="border rounded-lg p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <Link 
                        href={`/projects/${project.id}/delays/${delay.id}`}
                        className="flex-1"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {format(new Date(delay.start_time), 'PPP')}
                            </p>
                            {!delay.end_time && (
                              <Badge variant="destructive">Active</Badge>
                            )}
                            {delay.verified && (
                              <Badge variant="default" className="bg-green-600">Verified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{delay.weather_condition}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {delay.duration_hours?.toFixed(1) || 'Ongoing'} hours
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {delay.crew_size} workers
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${(delay.total_cost || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No weather delays recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generated insurance and delay reports</CardDescription>
              </div>
              <Button 
                onClick={() => setShowReportDialog(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Link href={`/reports/${report.id}`} key={report.id}>
                    <div className="border rounded-lg p-4 hover:shadow-lg hover:border-green-200 cursor-pointer transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{report.report_type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(report.period_start), 'PP')} - {format(new Date(report.period_end), 'PP')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {format(new Date(report.created_at), 'PPP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${(report.total_cost || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{report.total_delay_hours?.toFixed(0)} hours</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No reports generated yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ProjectFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        projectId={project.id}
        projectData={project}
        onSuccess={handleProjectUpdate}
      />

      <CrewAssignmentsModal
        open={showCrewModal}
        onOpenChange={setShowCrewModal}
        projectId={project.id}
        projectName={project.name}
        onUpdate={fetchAssignments}
      />

      <EquipmentAssignmentsModal
        open={showEquipmentModal}
        onOpenChange={setShowEquipmentModal}
        projectId={project.id}
        projectName={project.name}
        onUpdate={fetchAssignments}
      />

      {/* Report Generation Dialog */}
      <GenerateReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        projectId={project.id}
        projectName={project.name}
        onReportGenerated={handleReportGenerated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All associated data including weather readings, delay events, and reports will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}