'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Building2,
  Home,
  Briefcase,
  FileCheck,
  TrendingUp,
  CloudRain,
  Camera,
  Download,
  Send,
  ChevronRight,
  ArrowLeft
} from "lucide-react"
import { format } from 'date-fns/format'
import { GenerateReportDialog } from "@/components/generate-report-dialog"
import DelayDocumentationForm from "@/components/delay-documentation-form"

interface ReportWizardProps {
  projects: any[]
  recentDelays: any[]
  activeDelays: any[]
}

type ReportType = 'current-delay' | 'insurance-claim' | 'client-update' | 'monthly-summary' | null

export default function ReportsWizardClient({ projects, recentDelays, activeDelays }: ReportWizardProps) {
  const searchParams = useSearchParams()
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // Check for action parameter from quick actions
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'document-delay') {
      setSelectedReportType('current-delay')
    } else if (action === 'insurance-claim') {
      setSelectedReportType('insurance-claim')
    }
  }, [searchParams])

  // Group delays by project for easier selection
  const delaysByProject = recentDelays.reduce((acc, delay) => {
    if (!acc[delay.project_id]) {
      acc[delay.project_id] = {
        project: projects.find(p => p.id === delay.project_id),
        delays: []
      }
    }
    acc[delay.project_id].delays.push(delay)
    return acc
  }, {} as Record<string, { project: any, delays: any[] }>)

  const reportTypes = [
    {
      id: 'current-delay' as const,
      icon: AlertTriangle,
      title: 'Document Current Delay',
      description: 'Work stopped due to weather',
      color: 'from-red-500 to-orange-500',
      urgent: true,
      features: ['Real-time weather data', 'Photo documentation', 'Instant tracking']
    },
    {
      id: 'insurance-claim' as const,
      icon: FileCheck,
      title: 'Generate Insurance Claim',
      description: 'Create formal claim document',
      color: 'from-blue-500 to-indigo-500',
      features: ['NOAA verification', 'Cost breakdown', 'Legal format']
    },
    {
      id: 'client-update' as const,
      icon: Building2,
      title: 'Client Progress Report',
      description: 'Update on weather impacts',
      color: 'from-green-500 to-emerald-500',
      features: ['Schedule impact', 'Visual summary', 'Professional format']
    },
    {
      id: 'monthly-summary' as const,
      icon: Calendar,
      title: 'Monthly Summary',
      description: 'All delays for a period',
      color: 'from-purple-500 to-pink-500',
      features: ['Aggregate data', 'Trend analysis', 'Export ready']
    }
  ]

  const quickStats = {
    activeDelays: activeDelays.length,
    recentDelays: recentDelays.filter(d => {
      const daysSince = (Date.now() - new Date(d.start_time).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length,
    totalCost: recentDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0),
    unverifiedDelays: recentDelays.filter(d => !d.verified).length
  }

  if (selectedReportType === 'current-delay') {
    const selectedProjectData = projects.find(p => p.id === selectedProject)
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedReportType(null)
              setSelectedProject(null)
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Document Current Weather Delay</h2>
        </div>

        {!selectedProject ? (
          <Card className="border-2 border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Quick Delay Documentation
              </CardTitle>
              <CardDescription>
                Select a project to document weather-related work stoppage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Project</label>
                <div className="grid gap-3">
                  {projects.filter(p => p.active).map(project => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className="p-4 rounded-lg border-2 text-left transition-all border-gray-200 hover:border-red-300"
                    >
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-600">{project.address}</div>
                      {activeDelays.some(d => d.project_id === project.id) && (
                        <Badge variant="destructive" className="mt-2">Active Delay</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DelayDocumentationForm
            project={selectedProjectData}
            onSuccess={() => {
              setSelectedProject(null)
              setSelectedReportType(null)
              // Could add a success toast here
            }}
            onCancel={() => setSelectedProject(null)}
          />
        )}
      </div>
    )
  }

  if (selectedReportType === 'insurance-claim') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedReportType(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Insurance Claim Wizard</h2>
        </div>

        <div className="grid gap-6">
          {Object.entries(delaysByProject).map(([projectId, data]: [string, any]) => {
            const totalCost = data.delays.reduce((sum: number, d: any) => sum + (d.total_cost || 0), 0)
            const totalHours = data.delays.reduce((sum: number, d: any) => sum + (d.duration_hours || 0), 0)
            
            return (
              <Card key={projectId} className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
                  <h3 className="text-lg font-semibold">{data.project.name}</h3>
                  <p className="text-sm opacity-90">{data.project.address}</p>
                </div>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Delays</p>
                      <p className="text-2xl font-bold">{data.delays.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hours Lost</p>
                      <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Cost</p>
                      <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">Recent Delays:</p>
                    {data.delays.slice(0, 3).map((delay: any) => (
                      <div key={delay.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">
                            {format(new Date(delay.start_time), 'MMM d')}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {delay.weather_condition}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={delay.verified ? "default" : "secondary"} className={delay.verified ? "bg-green-500 text-white hover:bg-green-600" : ""}>
                            {delay.verified ? "Verified" : "Unverified"}
                          </Badge>
                          <span className="font-medium">${(delay.total_cost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => {
                      setSelectedProject(projectId)
                      setShowGenerateDialog(true)
                    }}
                  >
                    Generate Insurance Claim
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Default view - Report type selection
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Stats */}
      {(quickStats.activeDelays > 0 || quickStats.unverifiedDelays > 0) && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-4">Action Required</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickStats.activeDelays > 0 && (
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{quickStats.activeDelays}</p>
                    <p className="text-sm">Active weather delays</p>
                  </div>
                </div>
                <Button 
                  className="mt-3 w-full bg-white text-red-600 hover:bg-gray-100"
                  onClick={() => setSelectedReportType('current-delay')}
                >
                  Document Now
                </Button>
              </div>
            )}
            {quickStats.unverifiedDelays > 0 && (
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{quickStats.unverifiedDelays}</p>
                    <p className="text-sm">Delays need verification</p>
                  </div>
                </div>
                <Button 
                  className="mt-3 w-full bg-white text-red-600 hover:bg-gray-100"
                  onClick={() => setSelectedReportType('insurance-claim')}
                >
                  Verify & Claim
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Type Selection */}
      <div>
        <h1 className="text-3xl font-bold mb-2">What do you need today?</h1>
        <p className="text-gray-600 mb-8">Choose a report type to get started</p>

        <div className="grid md:grid-cols-2 gap-6">
          {reportTypes.map(type => (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-xl border-2 hover:border-gray-300 ${
                type.urgent ? 'ring-2 ring-red-500 ring-offset-2' : ''
              }`}
              onClick={() => setSelectedReportType(type.id)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4`}>
                  <type.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">{type.title}</CardTitle>
                <CardDescription className="text-base">{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {type.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentDelays.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Weather Events</h2>
          <div className="grid gap-4">
            {recentDelays.slice(0, 5).map(delay => {
              const project = projects.find(p => p.id === delay.project_id)
              return (
                <Card key={delay.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project?.name}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(delay.start_time), 'PPP')} · {delay.weather_condition}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Impact</p>
                          <p className="font-medium">${(delay.total_cost || 0).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add to Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {selectedProject && (
        <GenerateReportDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          projectId={selectedProject}
          projectName={delaysByProject[selectedProject]?.project.name || ''}
          onReportGenerated={() => {
            setShowGenerateDialog(false)
            setSelectedProject(null)
            setSelectedReportType(null)
          }}
        />
      )}
    </div>
  )
}