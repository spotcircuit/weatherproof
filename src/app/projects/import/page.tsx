"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

// CSV template for users to download
const CSV_TEMPLATE = `project_name,address,city,state,zip,start_date,end_date,project_type,crew_size,hourly_rate
"Sample Roofing Job","123 Main St","Austin","TX","78701","2024-02-01","2024-02-28","roofing",4,50
"Sample Concrete Job","456 Oak Ave","Dallas","TX","75201","2024-02-15","2024-03-15","concrete",6,45`

const PROJECT_TYPES = [
  { value: 'roofing', label: 'Roofing', thresholds: { wind: 25, rain: 0.1, temp_min: 40, temp_max: 95 } },
  { value: 'concrete', label: 'Concrete/Foundation', thresholds: { wind: 30, rain: 0.25, temp_min: 40, temp_max: 90 } },
  { value: 'framing', label: 'Framing', thresholds: { wind: 35, rain: 0.5, temp_min: 20, temp_max: 100 } },
  { value: 'painting', label: 'Exterior Painting', thresholds: { wind: 20, rain: 0, temp_min: 50, temp_max: 90, humidity_max: 85 } },
  { value: 'general', label: 'General Construction', thresholds: { wind: 40, rain: 0.5, temp_min: 20, temp_max: 100 } }
]

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ProjectImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'weatherproof_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)/g) || []
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '').trim() || ''
      })
      return row
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    
    // Parse and preview
    const text = await selectedFile.text()
    const parsed = parseCSV(text)
    setPreview(parsed.slice(0, 5)) // Show first 5 rows
  }

  const geocodeAddress = async (address: string, city: string, state: string, zip: string) => {
    const fullAddress = `${address}, ${city}, ${state} ${zip}`
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
      )
      const data = await response.json()
      
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
    }
    return null
  }

  const handleImport = async () => {
    if (!file || !user) return

    setImporting(true)
    const text = await file.text()
    const projects = parseCSV(text)
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const project of projects) {
      try {
        // Geocode address
        const coords = await geocodeAddress(
          project.address,
          project.city,
          project.state,
          project.zip
        )

        if (!coords) {
          throw new Error(`Could not geocode address: ${project.address}`)
        }

        // Find project type and thresholds
        const projectType = PROJECT_TYPES.find(t => t.value === project.project_type) || PROJECT_TYPES[4]

        // Insert project
        const { error } = await supabase.from('projects').insert({
          user_id: user.id,
          name: project.project_name,
          address: `${project.address}, ${project.city}, ${project.state} ${project.zip}`,
          lat: coords.lat,
          lng: coords.lng,
          start_date: project.start_date,
          end_date: project.end_date || null,
          project_type: projectType.value,
          crew_size: parseInt(project.crew_size) || 1,
          hourly_rate: parseFloat(project.hourly_rate) || 50,
          weather_thresholds: projectType.thresholds,
          active: true
        })

        if (error) throw error
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push(`${project.project_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setResult(result)
    setImporting(false)

    // Redirect to projects page after 3 seconds if successful
    if (result.success > 0) {
      setTimeout(() => {
        router.push('/projects')
      }, 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Import Projects from CSV
          </CardTitle>
          <CardDescription>
            Bulk import your construction projects from a CSV file or your existing project management tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Step 1: Download Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download our CSV template and fill it with your project data
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Step 2: Upload Your File</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview (first 5 rows):</h4>
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Project Name</th>
                          <th className="text-left p-2">Address</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Start Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{row.project_name}</td>
                            <td className="p-2">{row.address}</td>
                            <td className="p-2">{row.project_type}</td>
                            <td className="p-2">{row.start_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Import */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Step 3: Import Projects</h3>
            <p className="text-sm text-gray-600 mb-4">
              We'll automatically geocode addresses and apply weather thresholds based on project type
            </p>
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Projects
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className={`border rounded-lg p-4 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">Import Complete</h4>
                  <p className="text-sm mt-1">
                    Successfully imported {result.success} projects
                    {result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-sm text-red-600 mt-1">
                        {result.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.success > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Redirecting to projects page...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Integration Options */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Coming Soon: Direct Integrations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">ST</span>
                </div>
                ServiceTitan
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">QB</span>
                </div>
                QuickBooks
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">BT</span>
                </div>
                Buildertrend
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">PD</span>
                </div>
                Pipedrive
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}