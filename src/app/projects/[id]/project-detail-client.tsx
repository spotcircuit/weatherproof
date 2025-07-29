'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { GenerateReportDialog } from "@/components/generate-report-dialog"
import { useRouter } from 'next/navigation'

interface ProjectDetailClientProps {
  project: any
  delayEvents: any[]
  recentWeather: any[]
  reports: any[]
}

export function ProjectDetailClient({
  project,
  delayEvents,
  recentWeather,
  reports: initialReports
}: ProjectDetailClientProps) {
  const router = useRouter()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reports, setReports] = useState(initialReports)

  // Calculate stats
  const activeDelay = delayEvents?.find(d => !d.end_time)
  const totalDelays = delayEvents?.length || 0
  const totalCost = delayEvents?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0
  const totalHours = delayEvents?.reduce((sum, d) => sum + (d.labor_hours_lost || 0), 0) || 0

  const handleReportGenerated = (reportId: string) => {
    // Refresh the page to show the new report
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.address}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeDelay && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Active Weather Delay
            </span>
          )}
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Delays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDelays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeDelay ? '1 active' : 'All resolved'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hours Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Labor hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documented delays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Weather */}
      {recentWeather && recentWeather.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Current Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Temperature</p>
                <p className="text-lg font-medium">{recentWeather[0].temperature?.toFixed(0)}°F</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Wind Speed</p>
                <p className="text-lg font-medium">{recentWeather[0].wind_speed?.toFixed(0)} mph</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Precipitation</p>
                <p className="text-lg font-medium">{recentWeather[0].precipitation?.toFixed(2)}"</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conditions</p>
                <p className="text-lg font-medium">{recentWeather[0].conditions || 'Clear'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Last updated: {format(new Date(recentWeather[0].timestamp), 'p')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium capitalize">{project.project_type || 'General'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Crew Size</p>
              <p className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {project.crew_size} workers
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weather Thresholds</CardTitle>
            <CardDescription>Conditions that trigger work stoppage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.weather_thresholds.wind_speed && (
              <div className="flex justify-between">
                <span className="text-sm">Wind Speed</span>
                <span className="text-sm font-medium">&gt; {project.weather_thresholds.wind_speed} mph</span>
              </div>
            )}
            {project.weather_thresholds.precipitation !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm">Precipitation</span>
                <span className="text-sm font-medium">&gt; {project.weather_thresholds.precipitation}"</span>
              </div>
            )}
            {project.weather_thresholds.temperature_min && (
              <div className="flex justify-between">
                <span className="text-sm">Min Temperature</span>
                <span className="text-sm font-medium">&lt; {project.weather_thresholds.temperature_min}°F</span>
              </div>
            )}
            {project.weather_thresholds.temperature_max && (
              <div className="flex justify-between">
                <span className="text-sm">Max Temperature</span>
                <span className="text-sm font-medium">&gt; {project.weather_thresholds.temperature_max}°F</span>
              </div>
            )}
            {project.weather_thresholds.humidity_max && (
              <div className="flex justify-between">
                <span className="text-sm">Max Humidity</span>
                <span className="text-sm font-medium">&gt; {project.weather_thresholds.humidity_max}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delay Events */}
      <Card className="mb-8">
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
                <Link 
                  key={delay.id} 
                  href={`/projects/${project.id}/delays/${delay.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {format(new Date(delay.start_time), 'PPP')}
                          </p>
                          {!delay.end_time && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Active
                            </span>
                          )}
                          {delay.verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
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
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generated insurance and delay reports</CardDescription>
            </div>
            <Button onClick={() => setShowReportDialog(true)}>
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
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
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

      {/* Report Generation Dialog */}
      <GenerateReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        projectId={project.id}
        projectName={project.name}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  )
}