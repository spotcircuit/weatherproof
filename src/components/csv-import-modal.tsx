'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Users,
  Truck,
  FolderOpen
} from 'lucide-react'
import { CSVImporter, CSVExporter } from '@/services/csv-import-export'

interface CSVImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'equipment' | 'crew' | 'projects'
  onSuccess?: () => void
}

export default function CSVImportModal({
  open,
  onOpenChange,
  type,
  onSuccess
}: CSVImportModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    total: number
    successful: number
    failed: number
  } | null>(null)
  
  const getTypeLabel = () => {
    switch (type) {
      case 'equipment': return 'Equipment'
      case 'crew': return 'Crew Members'
      case 'projects': return 'Projects'
    }
  }
  
  const getTypeIcon = () => {
    switch (type) {
      case 'equipment': return <Truck className="h-5 w-5" />
      case 'crew': return <Users className="h-5 w-5" />
      case 'projects': return <FolderOpen className="h-5 w-5" />
    }
  }
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setErrors([])
    setPreview(null)
    setImportResults(null)
    
    // Read and preview file
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      const result = await CSVImporter.parseCSV(content, type)
      
      if (result.success && result.data) {
        setPreview(result.data.slice(0, 5)) // Show first 5 rows
      } else {
        setErrors(result.errors || ['Failed to parse CSV file'])
      }
    }
    reader.readAsText(selectedFile)
  }
  
  const handleImport = async () => {
    if (!file || !preview) return
    
    setImporting(true)
    setProgress(0)
    setErrors([])
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const results = {
        total: preview.length,
        successful: 0,
        failed: 0
      }
      
      // Import records one by one with progress
      for (let i = 0; i < preview.length; i++) {
        const record = preview[i]
        setProgress(Math.round((i / preview.length) * 100))
        
        try {
          // Add user_id to each record
          const recordWithUser = { ...record, user_id: user.id }
          
          // Insert based on type
          const { error } = await supabase
            .from(type)
            .insert(recordWithUser)
        
          if (error) {
            results.failed++
            console.error(`CSV import row ${i + 2} error:`, error)
            const errorMsg = error.message || JSON.stringify(error)
            setErrors(prev => [...prev, `Row ${i + 2}: ${errorMsg}`])
          } else {
            results.successful++
          }
        } catch (err) {
          results.failed++
          setErrors(prev => [...prev, `Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`])
        }
      }
      
      setProgress(100)
      setImportResults(results)
      
      if (results.successful > 0 && onSuccess) {
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
        }, 2000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed'
      console.error('CSV import error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        importType: type,
        recordCount: preview?.length
      })
      setErrors([errorMessage])
    } finally {
      setImporting(false)
    }
  }
  
  const handleDownloadSample = () => {
    const csv = CSVExporter.generateSampleCSV(type)
    CSVExporter.downloadCSV(csv, `${type}_import_template.csv`)
  }
  
  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setErrors([])
    setImportResults(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            Import {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import {type}. Download the sample template for the correct format.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {/* File Upload Section */}
            {!file && !importResults && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Drop your CSV file here or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select CSV File
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 5MB
                </p>
              </div>
            )}
            
            {/* File Selected */}
            {file && !importResults && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Remove
                  </Button>
                </div>
              </div>
            )}
            
            {/* Preview Section */}
            {preview && preview.length > 0 && !importResults && (
              <div>
                <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-t">
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="px-3 py-2">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Total rows to import: {preview.length}
                </p>
              </div>
            )}
            
            {/* Import Progress */}
            {importing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Importing records...</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500 text-center">
                  {progress}% complete
                </p>
              </div>
            )}
            
            {/* Import Results */}
            {importResults && (
              <div className="space-y-4">
                <Alert className={importResults.failed === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                  <div className="flex items-center gap-2">
                    {importResults.failed === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <AlertDescription>
                      <p className="font-medium">Import Complete</p>
                      <p>Successfully imported: {importResults.successful} records</p>
                      {importResults.failed > 0 && (
                        <p>Failed: {importResults.failed} records</p>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
                
                {importResults.successful > 0 && (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Redirecting to {type} list...
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Import Errors:</p>
                  <ul className="list-disc list-inside text-sm">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  {errors.length > 5 && (
                    <p className="text-sm mt-1">...and {errors.length - 5} more errors</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="instructions" className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4>CSV Format Requirements</h4>
              <p>Your CSV file must include the following columns:</p>
              
              {type === 'equipment' && (
                <ul>
                  <li><strong>name</strong> (required): Equipment name/identifier</li>
                  <li><strong>type</strong> (required): Equipment type (Excavator, Crane, etc.)</li>
                  <li><strong>model</strong>: Equipment model</li>
                  <li><strong>serial_number</strong>: Serial number</li>
                  <li><strong>hourly_rate</strong>: Hourly rental/usage rate</li>
                  <li><strong>daily_rate</strong>: Daily rental/usage rate</li>
                  <li><strong>status</strong> (required): available, in_use, or maintenance</li>
                  <li><strong>location</strong>: Current location</li>
                  <li><strong>notes</strong>: Additional notes</li>
                </ul>
              )}
              
              {type === 'crew' && (
                <ul>
                  <li><strong>name</strong> (required): Full name</li>
                  <li><strong>role</strong> (required): Job role/title</li>
                  <li><strong>email</strong>: Email address</li>
                  <li><strong>phone</strong>: Phone number</li>
                  <li><strong>hourly_rate</strong> (required): Hourly wage</li>
                  <li><strong>certifications</strong>: Comma-separated certifications</li>
                  <li><strong>emergency_contact</strong>: Emergency contact name</li>
                  <li><strong>emergency_phone</strong>: Emergency contact phone</li>
                  <li><strong>status</strong>: active, on_leave, or inactive</li>
                </ul>
              )}
              
              {type === 'projects' && (
                <ul>
                  <li><strong>name</strong> (required): Project name</li>
                  <li><strong>address</strong> (required): Street address</li>
                  <li><strong>city</strong>: City</li>
                  <li><strong>state</strong>: State code</li>
                  <li><strong>zip</strong>: ZIP code</li>
                  <li><strong>latitude</strong> (required): Latitude coordinate</li>
                  <li><strong>longitude</strong> (required): Longitude coordinate</li>
                  <li><strong>start_date</strong> (required): YYYY-MM-DD format</li>
                  <li><strong>end_date</strong>: YYYY-MM-DD format</li>
                  <li><strong>project_type</strong>: commercial, residential, etc.</li>
                  <li><strong>contract_number</strong>: Contract reference</li>
                  <li><strong>general_contractor</strong>: GC company name</li>
                  <li><strong>insurance_policy_number</strong>: Policy number</li>
                  <li><strong>crew_size</strong>: Default crew size</li>
                  <li><strong>hourly_rate</strong>: Default hourly rate</li>
                  <li><strong>daily_overhead</strong>: Daily overhead cost</li>
                  <li><strong>wind_speed_threshold</strong>: Wind limit (mph)</li>
                  <li><strong>precipitation_threshold</strong>: Rain limit (inches)</li>
                  <li><strong>temp_min</strong>: Minimum temperature (°F)</li>
                  <li><strong>temp_max</strong>: Maximum temperature (°F)</li>
                </ul>
              )}
              
              <h4>Tips for Successful Import</h4>
              <ul>
                <li>Download the sample template to see the correct format</li>
                <li>Ensure dates are in YYYY-MM-DD format</li>
                <li>Remove any special characters from numeric fields</li>
                <li>Check that required fields are not empty</li>
                <li>For best results, limit imports to 500 records at a time</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadSample}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Sample
          </Button>
          
          {!importResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  handleReset()
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!preview || preview.length === 0 || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {preview?.length || 0} Records
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}