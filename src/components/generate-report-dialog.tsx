'use client'

import { useState } from 'react'
import { format } from 'date-fns/format'
import { Calendar, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface GenerateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  onReportGenerated?: (reportId: string) => void
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onReportGenerated
}: GenerateReportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('INSURANCE_CLAIM')
  const [periodStart, setPeriodStart] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  )
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [includePhotos, setIncludePhotos] = useState(true)
  const [outputFormat, setOutputFormat] = useState('pdf')
  
  // Insurance-specific fields
  const [policyNumber, setPolicyNumber] = useState('')
  const [insurerName, setInsurerName] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [generateACORD, setGenerateACORD] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          reportType,
          periodStart,
          periodEnd,
          includePhotos,
          format: outputFormat,
          policyNumber,
          insurerName,
          claimNumber
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // If ACORD is requested, generate it too
        if (generateACORD && reportType === 'INSURANCE_CLAIM') {
          await fetch('/api/reports/acord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId: data.reportId,
              format: 'xml',
              claimNumber,
              policyLimit: null,
              policyDeductible: null
            })
          })
        }
        
        onReportGenerated?.(data.reportId)
        onOpenChange(false)
      } else {
        alert(`Failed to generate report: ${data.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report'
      console.error('Report generation error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        reportType,
        projectId,
        periodStart,
        periodEnd
      })
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Create a weather delay report for {projectName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSURANCE_CLAIM">Insurance Claim</SelectItem>
                <SelectItem value="MONTHLY">Monthly Summary</SelectItem>
                <SelectItem value="WEEKLY">Weekly Summary</SelectItem>
                <SelectItem value="CUSTOM">Custom Period</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-start">Period Start</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period-end">Period End</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {reportType === 'INSURANCE_CLAIM' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="policy-number">Policy Number</Label>
                <Input
                  id="policy-number"
                  placeholder="Enter policy number"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="insurer-name">Insurance Company</Label>
                <Input
                  id="insurer-name"
                  placeholder="e.g., Travelers, Liberty Mutual"
                  value={insurerName}
                  onChange={(e) => setInsurerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="claim-number">Claim Number (Optional)</Label>
                <Input
                  id="claim-number"
                  placeholder="If already assigned"
                  value={claimNumber}
                  onChange={(e) => setClaimNumber(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="output-format">Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger id="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-photos"
                checked={includePhotos}
                onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
              />
              <Label htmlFor="include-photos" className="text-sm cursor-pointer">
                Include photographic evidence
              </Label>
            </div>
            
            {reportType === 'INSURANCE_CLAIM' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-acord"
                  checked={generateACORD}
                  onCheckedChange={(checked) => setGenerateACORD(checked as boolean)}
                />
                <Label htmlFor="generate-acord" className="text-sm cursor-pointer">
                  Also generate ACORD 125 form (XML)
                </Label>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}