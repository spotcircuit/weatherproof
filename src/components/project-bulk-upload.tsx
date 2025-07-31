'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Upload, Download, CheckCircle, XCircle } from 'lucide-react'
import { CONTRACTOR_TYPE_ACTIVITIES, ContractorType } from '@/types/project-activities'

interface ProjectBulkUploadProps {
  onComplete?: () => void
}

export function ProjectBulkUpload({ onComplete }: ProjectBulkUploadProps) {
  const supabase = createClient()
  const [csvContent, setCsvContent] = useState('')
  const [contractorType, setContractorType] = useState<ContractorType>('General Contractor')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sampleCSV = `Project Name,Address,Start Date,End Date,Project Value,Insurance Company,Claim Number,Deductible,General Contractor,Custom Activities
"Medical Center Expansion","123 Healthcare Blvd, Medical City, MC 12345",2024-01-15,2024-12-31,5000000,"State Insurance Co","CLM-2024-001",50000,"ABC Construction","Emergency Repairs;Weekend Work"
"Office Park Renovation","456 Business Ave, Commerce City, CC 67890",2024-02-01,,2500000,"National Insurers","CLM-2024-002",25000,"XYZ Builders",
"School Retrofit","789 Education Dr, Learning Town, LT 13579",2024-03-01,2024-08-31,3500000,"Educational Insurance","CLM-2024-003",35000,"DEF Contractors","Asbestos Removal;Lead Paint Abatement"`

  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }

    return data
  }

  const handleUpload = async () => {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const projects = parseCSV(csvContent)
      if (projects.length === 0) {
        throw new Error('No valid projects found in CSV')
      }

      const results = []
      const defaultActivities = CONTRACTOR_TYPE_ACTIVITIES[contractorType] || []

      for (const project of projects) {
        try {
          // Create project
          const { data: newProject, error: projectError } = await supabase
            .from('projects')
            .insert({
              name: project['Project Name'],
              contractor_type: contractorType,
              address: project['Address'],
              start_date: project['Start Date'] || null,
              end_date: project['End Date'] || null,
              project_value: parseFloat(project['Project Value']) || 0,
              insurance_company: project['Insurance Company'],
              insurance_claim_number: project['Claim Number'],
              deductible_amount: project['Deductible'] ? parseFloat(project['Deductible']) : null,
              general_contractor: project['General Contractor'],
              status: 'Active'
            })
            .select()
            .single()

          if (projectError) throw projectError

          // Create project activities
          if (newProject) {
            // Parse custom activities
            const customActivities = project['Custom Activities'] 
              ? project['Custom Activities'].split(';').map((a: string) => a.trim()).filter(Boolean)
              : []
            
            // Combine default and custom activities
            const allActivities = [...new Set([...defaultActivities, ...customActivities])]
            
            if (allActivities.length > 0) {
              const activitiesData = allActivities.map(activity => ({
                project_id: newProject.id,
                activity_name: activity,
                is_active: true,
                is_default: defaultActivities.includes(activity)
              }))

              const { error: activitiesError } = await supabase
                .from('project_activities')
                .insert(activitiesData)

              if (activitiesError) throw activitiesError
            }

            results.push({
              name: project['Project Name'],
              success: true,
              id: newProject.id
            })
          }
        } catch (error: any) {
          results.push({
            name: project['Project Name'],
            success: false,
            error: error.message
          })
        }
      }

      setResults(results)
      
      // If all successful, call onComplete
      if (results.every(r => r.success) && onComplete) {
        setTimeout(onComplete, 2000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'weatherproof-projects-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload Projects</CardTitle>
        <CardDescription>
          Upload multiple projects at once using CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Contractor Type</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          <Select value={contractorType} onValueChange={(v) => setContractorType(v as ContractorType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CONTRACTOR_TYPE_ACTIVITIES).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            All projects will be created with default activities for this contractor type
          </p>
        </div>

        <div>
          <Label htmlFor="csv">CSV Content</Label>
          <Textarea
            id="csv"
            rows={10}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Paste your CSV content here..."
            className="font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-1">
            Custom activities can be added per project using semicolon separation
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Upload Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className="text-sm">{result.name}</span>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">{result.error}</span>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!csvContent.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Projects
            </>
          )}
        </Button>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>CSV Format</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Required columns:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Project Name</li>
              <li>Address</li>
              <li>Start Date (YYYY-MM-DD)</li>
              <li>Project Value (number)</li>
              <li>Insurance Company</li>
              <li>General Contractor</li>
            </ul>
            <p className="mt-2">Optional columns:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>End Date (YYYY-MM-DD)</li>
              <li>Claim Number</li>
              <li>Deductible (number)</li>
              <li>Custom Activities (semicolon-separated)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}