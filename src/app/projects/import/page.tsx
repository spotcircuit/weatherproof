"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Zap,
  ArrowRight,
  FileText,
  Shield,
  Clock,
  TrendingUp
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import NavigationHeader from "@/components/navigation-header"

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

        if (error) {
          console.error('Project import insert error:', error)
          throw new Error(`Failed to import project: ${error.message || JSON.stringify(error)}`)
        }
        result.success++
      } catch (error) {
        result.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Project import error:', {
          error,
          message: errorMessage,
          type: typeof error,
          stringified: JSON.stringify(error, null, 2),
          projectName: project.project_name,
          address: project.address
        })
        result.errors.push(`${project.project_name}: ${errorMessage}`)
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
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Import Projects
            </h1>
            <p className="text-gray-600 mt-1">Bulk import from CSV or connect your existing CRM</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <Tabs defaultValue="csv" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                CSV Import
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                CRM Integration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    Import Projects from CSV
                  </CardTitle>
                  <CardDescription>
                    Bulk import your construction projects from a CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Step 1: Download Template */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Step 1: Download Template</h3>
                        <p className="text-gray-600 mb-4">
                          Download our CSV template and fill it with your project data. The template includes all required fields and example data.
                        </p>
                        <Button onClick={downloadTemplate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                          <Download className="mr-2 h-4 w-4" />
                          Download CSV Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Upload File */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Upload className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Step 2: Upload Your File</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="csv-file" className="text-gray-700 font-medium">Select CSV File</Label>
                            <Input
                              id="csv-file"
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              className="mt-2 border-2 border-dashed hover:border-purple-300 transition-colors"
                            />
                          </div>

                          {/* Preview */}
                          {preview.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-3">Preview (first 5 rows):</h4>
                              <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b">
                                    <tr>
                                      <th className="text-left p-3 font-medium text-gray-700">Project Name</th>
                                      <th className="text-left p-3 font-medium text-gray-700">Address</th>
                                      <th className="text-left p-3 font-medium text-gray-700">Type</th>
                                      <th className="text-left p-3 font-medium text-gray-700">Start Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {preview.map((row, i) => (
                                      <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{row.project_name}</td>
                                        <td className="p-3">{row.address}</td>
                                        <td className="p-3">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {row.project_type}
                                          </span>
                                        </td>
                                        <td className="p-3">{row.start_date}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Import */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Step 3: Import Projects</h3>
                        <p className="text-gray-600 mb-4">
                          We'll automatically geocode addresses and apply weather thresholds based on project type
                        </p>
                        <Button 
                          onClick={handleImport} 
                          disabled={!file || importing}
                          className="bg-green-600 hover:bg-green-700 text-white shadow-md"
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
                    </div>
                  </div>

                  {/* Results */}
                  {result && (
                    <div className={`rounded-xl p-6 ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <div className="flex items-start gap-3">
                        {result.failed === 0 ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">Import Complete</h4>
                          <p className="text-gray-700 mt-1">
                            Successfully imported {result.success} projects
                            {result.failed > 0 && `, ${result.failed} failed`}
                          </p>
                          {result.errors.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium text-red-700">Errors:</p>
                              <ul className="text-sm text-red-600 mt-1 space-y-1">
                                {result.errors.map((error, i) => (
                                  <li key={i}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.success > 0 && (
                            <p className="text-gray-600 mt-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Redirecting to projects page...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crm">
              <div className="space-y-6">
                {/* CRM Integration Header */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Connect Your CRM</h2>
                        <p className="text-purple-100">
                          Sync projects directly from your existing construction management software
                        </p>
                      </div>
                      <Zap className="h-16 w-16 text-white/20" />
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Secure Sync</h3>
                      <p className="text-gray-600 text-sm">
                        OAuth 2.0 authentication ensures your data stays secure during import
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Real-time Updates</h3>
                      <p className="text-gray-600 text-sm">
                        Keep your projects synchronized with automatic daily updates
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Smart Matching</h3>
                      <p className="text-gray-600 text-sm">
                        AI-powered field mapping ensures accurate data transfer
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* CRM Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">ST</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">ServiceTitan</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Import jobs, customers, and service locations directly from ServiceTitan
                          </p>
                          <Button className="w-full bg-orange-600 hover:bg-orange-700">
                            Connect ServiceTitan
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">QB</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">QuickBooks</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Sync customers and projects from QuickBooks Online or Desktop
                          </p>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            Connect QuickBooks
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">BT</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">Buildertrend</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Import projects, schedules, and job sites from Buildertrend
                          </p>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            Connect Buildertrend
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">PD</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">Pipedrive</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Sync deals and organizations as projects from Pipedrive CRM
                          </p>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Connect Pipedrive
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* More CRMs Coming Soon */}
                <Card className="border-0 shadow-lg bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">More Integrations Coming Soon</h3>
                    <div className="flex flex-wrap gap-3">
                      {['Procore', 'CoConstruct', 'Salesforce', 'HubSpot', 'JobNimbus', 'AccuLynx'].map((crm) => (
                        <div key={crm} className="px-4 py-2 bg-white rounded-lg border shadow-sm text-sm text-gray-600">
                          {crm}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Don't see your CRM? <a href="#" className="text-blue-600 hover:underline">Request an integration</a>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}