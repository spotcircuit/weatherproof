'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  Cloud,
  FileDown,
  Loader2,
  Users,
  Wrench,
  Package
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import Link from 'next/link'

interface Props {
  params: Promise<{
    id: string
  }>
}

interface ReportPreview {
  delaySummary: {
    totalDelayedTasks: number
    totalDelayDays: number
    weatherRelatedDelays: number
    totalCostImpact: number
    delaysByCategory: Record<string, number>
  }
  weatherAlerts: number
  taskCount: number
}

export default function ClaimReportPage({ params }: Props) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [preview, setPreview] = useState<ReportPreview | null>(null)
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    params.then(p => setProjectId(p.id))
  }, [params])

  useEffect(() => {
    if (projectId) {
      loadProjectAndPreview()
    }
  }, [projectId, startDate, endDate])

  async function loadProjectAndPreview() {
    try {
      // Load project
      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          *,
          companies (
            name,
            insurance_company,
            policy_number
          )
        `)
        .eq('id', projectId)
        .single()

      setProject(projectData)

      // Get preview data
      const response = await fetch(`/api/projects/${projectId}/claim-report?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setPreview({
          delaySummary: data.delaySummary,
          weatherAlerts: data.weatherAlerts.length,
          taskCount: data.detailedDelays.length
        })
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateReport(format: 'json' | 'csv' | 'pdf') {
    setGenerating(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/claim-report?startDate=${startDate}&endDate=${endDate}&format=${format}`
      )

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      if (format === 'json') {
        const data = await response.json()
        // Download JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `claim-report-${project.name}-${format}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `claim-report-${project.name}-${format}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        // PDF generation would require additional implementation
        alert('PDF export coming soon!')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/projects" className="hover:text-blue-600">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectId}/dashboard`} className="hover:text-blue-600">
              {project?.name}
            </Link>
            <span>/</span>
            <span>Claim Report</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance Claim Report</h1>
          <p className="text-gray-600 mt-1">Generate weather delay documentation for insurance claims</p>
        </div>

        {/* Company Info */}
        {project?.companies && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Policy Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{project.companies.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Insurance Company</p>
                  <p className="font-medium">{project.companies.insurance_company || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Policy Number</p>
                  <p className="font-medium">{project.companies.policy_number || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project Type</p>
                  <p className="font-medium">{project.project_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Period</CardTitle>
            <CardDescription>Select the date range for delay documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {preview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>Summary of delays for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {preview.delaySummary.totalDelayedTasks}
                  </div>
                  <p className="text-sm text-gray-600">Delayed Tasks</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {preview.delaySummary.totalDelayDays}
                  </div>
                  <p className="text-sm text-gray-600">Total Delay Days</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {preview.delaySummary.weatherRelatedDelays}
                  </div>
                  <p className="text-sm text-gray-600">Weather Delays</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${preview.delaySummary.totalCostImpact.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Cost Impact</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Delays by Category</h4>
                {Object.entries(preview.delaySummary.delaysByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category === 'weather' && <Cloud className="h-4 w-4 text-blue-500" />}
                      {category === 'crew' && <Users className="h-4 w-4 text-purple-500" />}
                      {category === 'equipment' && <Wrench className="h-4 w-4 text-orange-500" />}
                      {category === 'material' && <Package className="h-4 w-4 text-green-500" />}
                      {category === 'other' && <AlertTriangle className="h-4 w-4 text-gray-500" />}
                      <span className="capitalize">{category}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>

              {preview.weatherAlerts > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Weather Alerts</AlertTitle>
                  <AlertDescription>
                    {preview.weatherAlerts} NOAA weather alerts were active during this period
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Report</CardTitle>
            <CardDescription>Choose your preferred format for the insurance claim report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => generateReport('csv')}
                disabled={generating}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <FileDown className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium">CSV Export</div>
                  <div className="text-xs text-gray-600">Spreadsheet format</div>
                </div>
              </Button>

              <Button
                onClick={() => generateReport('json')}
                disabled={generating}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium">JSON Export</div>
                  <div className="text-xs text-gray-600">Structured data</div>
                </div>
              </Button>

              <Button
                onClick={() => generateReport('pdf')}
                disabled={generating}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <div className="font-medium">PDF Report</div>
                  <div className="text-xs text-gray-600">Coming soon</div>
                </div>
              </Button>
            </div>

            {generating && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating report...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Insurance Claim Documentation:</strong> This report includes all weather-related delays,
            NOAA alerts, task-specific impacts, crew/equipment costs, and photographic evidence. 
            The report is formatted for submission to insurance companies for weather delay claims.
          </p>
        </div>
      </div>
    </div>
  )
}