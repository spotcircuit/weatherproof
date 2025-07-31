'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Building2,
  ChevronRight,
  ArrowLeft,
  Download,
  Send,
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react"
import { format } from 'date-fns/format'
import { ReportTemplateSelector } from "@/components/report-template-selector"
import { ReportTemplate } from "@/services/report-templates"
import { ReportFactory } from "@/services/report-templates/report-factory"
import DelayDocumentationForm from "@/components/delay-documentation-form"

interface EnhancedReportWizardProps {
  projects: any[]
  recentDelays: any[]
  activeDelays: any[]
}

type WizardStep = 'select-type' | 'configure' | 'preview' | 'generate'

export default function EnhancedReportsWizard({ 
  projects, 
  recentDelays, 
  activeDelays 
}: EnhancedReportWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-type')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  })
  const [reportOptions, setReportOptions] = useState({
    includePhotos: true,
    includeWeatherMaps: false,
    includeHistorical: false,
    groupByEvent: true,
    language: 'en' as 'en' | 'es'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Special handling for delay documentation
  const [showDelayForm, setShowDelayForm] = useState(false)
  
  // Check for action parameter from quick actions
  useEffect(() => {
    const action = searchParams.get('action')
    const projectId = searchParams.get('project')
    
    if (action === 'document-delay') {
      setShowDelayForm(true)
      if (projectId) setSelectedProject(projectId)
    } else if (action === 'insurance-claim') {
      // Pre-select insurance claim template
      const insuranceTemplate = {
        id: 'insurance-claim',
        name: 'Insurance Claim Documentation',
        category: 'insurance' as const,
        // ... other fields
      } as ReportTemplate
      setSelectedTemplate(insuranceTemplate)
      setCurrentStep('configure')
    }
  }, [searchParams])
  
  // Handle delay documentation separately
  if (showDelayForm) {
    const selectedProjectData = projects.find(p => p.id === selectedProject)
    
    if (!selectedProject) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowDelayForm(false)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold">Document Weather Delay</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>Choose which project is experiencing a weather delay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {projects.filter(p => p.active).map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className="p-4 rounded-lg border-2 text-left transition-all hover:border-primary"
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-600">{project.address}</div>
                    {activeDelays.some(d => d.project_id === project.id) && (
                      <Badge variant="destructive" className="mt-2">Active Delay</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              setShowDelayForm(false)
              setSelectedProject(null)
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Document Weather Delay</h2>
        </div>
        
        <DelayDocumentationForm
          project={selectedProjectData}
          onSuccess={() => {
            setShowDelayForm(false)
            setSelectedProject(null)
            router.push('/projects')
          }}
          onCancel={() => setSelectedProject(null)}
        />
      </div>
    )
  }
  
  // Report generation functions
  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep('configure')
    setError(null)
  }
  
  const handleGenerateReport = async () => {
    if (!selectedTemplate || !selectedProject) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await ReportFactory.generateReport(
        selectedTemplate.id,
        selectedProject,
        dateRange,
        reportOptions
      )
      
      if (result.success) {
        setGeneratedReport(result.data)
        setCurrentStep('preview')
      } else {
        setError(result.error || 'Failed to generate report')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Enhanced report generation error:', {
        error: err,
        message: errorMessage,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2),
        templateId: selectedTemplate?.id,
        projectId: selectedProject,
        dateRange,
        reportOptions
      })
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleDownloadReport = () => {
    if (!generatedReport) return
    
    const blob = new Blob([atob(generatedReport.base64)], { 
      type: generatedReport.mimeType 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedReport.fileName
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // Quick stats for the dashboard
  const quickStats = {
    activeDelays: activeDelays.length,
    recentDelays: recentDelays.filter(d => {
      const daysSince = (Date.now() - new Date(d.start_time).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length,
    totalCost: recentDelays.reduce((sum, d) => sum + (d.total_cost || 0), 0),
    unverifiedDelays: recentDelays.filter(d => !d.verified).length
  }
  
  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 'select-type':
        return (
          <div className="space-y-6">
            {/* Action required banner */}
            {(quickStats.activeDelays > 0 || quickStats.unverifiedDelays > 0) && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Action Required:</strong> You have {quickStats.activeDelays} active delays 
                  and {quickStats.unverifiedDelays} unverified delays that need documentation.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-red-300"
                onClick={() => setShowDelayForm(true)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <CardTitle>Document Current Delay</CardTitle>
                  <CardDescription>Weather is affecting work right now</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="destructive">
                    Start Documentation
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300"
                onClick={() => {
                  const insuranceTemplate = {
                    id: 'insurance-claim',
                    name: 'Insurance Claim Documentation',
                    category: 'insurance' as const,
                  } as ReportTemplate
                  setSelectedTemplate(insuranceTemplate)
                  setCurrentStep('configure')
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge>Popular</Badge>
                  </div>
                  <CardTitle>Generate Insurance Claim</CardTitle>
                  <CardDescription>Create formal documentation for claims</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Create Claim
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Full template selector */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Report Types</h3>
              <ReportTemplateSelector 
                onSelectTemplate={handleTemplateSelect}
                projectId={selectedProject || undefined}
              />
            </div>
          </div>
        )
      
      case 'configure':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setCurrentStep('select-type')
                  setSelectedTemplate(null)
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h3 className="text-lg font-semibold">{selectedTemplate?.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate?.description}</p>
              </div>
            </div>
            
            {/* Configuration form would go here */}
            <Card>
              <CardHeader>
                <CardTitle>Configure Report</CardTitle>
                <CardDescription>Select project and options for your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Project</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.address}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Date range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border rounded-md"
                      value={format(dateRange.start, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange(prev => ({
                        ...prev,
                        start: new Date(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border rounded-md"
                      value={format(dateRange.end, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange(prev => ({
                        ...prev,
                        end: new Date(e.target.value)
                      }))}
                    />
                  </div>
                </div>
                
                {/* Options */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={reportOptions.includePhotos}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includePhotos: e.target.checked
                      }))}
                    />
                    Include photo documentation
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={reportOptions.includeWeatherMaps}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeWeatherMaps: e.target.checked
                      }))}
                    />
                    Include weather maps
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={reportOptions.includeHistorical}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeHistorical: e.target.checked
                      }))}
                    />
                    Include historical weather comparison
                  </label>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentStep('select-type')
                  setSelectedTemplate(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport}
                disabled={!selectedProject || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Report
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      
      case 'preview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep('configure')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h3 className="text-lg font-semibold">Report Generated Successfully</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate?.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <Send className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button size="sm" onClick={handleDownloadReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Report Ready</h4>
                <p className="text-gray-600 mb-4">
                  Your {selectedTemplate?.name} has been generated successfully.
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={handleDownloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('select-type')}>
                    Generate Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Report Center</h1>
        <p className="text-gray-600">Generate professional reports for all your documentation needs</p>
      </div>
      
      {renderStep()}
    </div>
  )
}