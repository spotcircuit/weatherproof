'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle,
  FileWarning,
  FileText,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Building2,
  Calendar,
  MapPin,
  CloudRain,
  FileCheck
} from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns/format'

interface DashboardClientProps {
  projects: any[]
  delayEvents: any[]
  reports: any[]
}

export default function DashboardClient({ projects, delayEvents, reports }: DashboardClientProps) {
  // Group delays by status
  const activeDelays = delayEvents.filter(d => !d.end_time)
  const documentedDelays = delayEvents.filter(d => d.end_time && d.verified)
  const unverifiedDelays = delayEvents.filter(d => d.end_time && !d.verified)
  
  // Group by project for better organization
  const projectsWithDelays = projects.map(project => {
    const projectDelays = delayEvents.filter(d => d.project_id === project.id)
    const activeDelay = projectDelays.find(d => !d.end_time)
    const readyToClaim = projectDelays.filter(d => d.end_time && d.verified && !d.report_generated)
    const claimedDelays = projectDelays.filter(d => d.report_generated)
    
    return {
      ...project,
      activeDelay,
      readyToClaim,
      claimedDelays,
      totalDelays: projectDelays.length,
      totalCost: projectDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    }
  }).filter(p => p.totalDelays > 0 || p.active) // Only show projects with delays or active projects

  return (
    <div className="space-y-8">
      {/* Insurance Claim Workflow Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <FileWarning className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          Insurance Claim Status
        </h2>

        {/* Active Delays - Need Documentation */}
        {activeDelays.length > 0 && (
          <Card className="mb-6 border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center animate-pulse flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg">Active Weather Delays</span>
                    <p className="text-xs sm:text-sm font-normal text-gray-600 mt-0.5 sm:mt-1">
                      Work is currently stopped - document these delays now
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-base sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1 self-start sm:self-auto">
                  {activeDelays.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeDelays.slice(0, 3).map(delay => {
                  const project = projects.find(p => p.id === delay.project_id)
                  return (
                    <div key={delay.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white rounded-lg border border-red-200">
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base">{project?.name}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started {format(new Date(delay.start_time), 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <CloudRain className="h-3 w-3" />
                            {delay.weather_condition}
                          </span>
                        </div>
                      </div>
                      <Link href={`/projects/${delay.project_id}/delays/${delay.id}`} className="w-full sm:w-auto">
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                          <span className="hidden sm:inline">Complete Documentation</span>
                          <span className="sm:hidden">Document</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center">
                <Link href="/document">
                  <Button className="w-full" variant="outline">
                    Document New Event
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ready to Claim - Generate Insurance Reports */}
        {documentedDelays.length > 0 && (
          <Card className="mb-6 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-lg">Ready for Insurance Claim</span>
                    <p className="text-sm font-normal text-gray-600 mt-1">
                      Verified delays ready to submit to insurance
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                  ${documentedDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0).toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Group by project */}
              {projectsWithDelays
                .filter(p => p.readyToClaim.length > 0)
                .map(project => (
                  <div key={project.id} className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{project.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.address}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Delays</p>
                            <p className="font-semibold">{project.readyToClaim.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Hours</p>
                            <p className="font-semibold">
                              {project.readyToClaim.reduce((sum: number, d: any) => sum + (d.duration_hours || 0), 0).toFixed(0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Cost</p>
                            <p className="font-semibold text-red-600">
                              ${project.readyToClaim.reduce((sum: number, d: any) => sum + (d.total_cost || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Insurance</p>
                            <p className="font-semibold text-green-600">
                              {project.insurance_carrier || 'Not Set'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link href={`/reports?action=insurance-claim&project=${project.id}`}>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Generate Claim
                            <FileWarning className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              
              <div className="mt-4 text-center">
                <Link href="/reports?action=insurance-claim">
                  <Button variant="outline" className="w-full">
                    View All Claimable Delays
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Delays Message */}
        {delayEvents.length === 0 && (
          <Card className="border-2 border-gray-200">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CloudRain className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Weather Delays Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                When weather impacts your work, document it here to create insurance claims
              </p>
              <Link href="/document">
                <Button>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Document First Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Recent Reports
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {reports.slice(0, 5).map(report => (
                  <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{report.report_type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-600">
                          Generated {format(new Date(report.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="outline" size="sm">
                            View
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}