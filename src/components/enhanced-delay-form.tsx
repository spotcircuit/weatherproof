'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle,
  Shield,
  User,
  Phone,
  FileText,
  Signature,
  Camera,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { SignatureCanvas } from '@/components/signature-canvas'

interface InsuranceFieldsProps {
  onUpdate: (fields: any) => void
  existingData?: any
}

export function InsuranceClaimFields({ onUpdate, existingData = {} }: InsuranceFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isForInsurance, setIsForInsurance] = useState(existingData.isForInsurance || false)
  
  // Insurance-specific fields
  const [witnessName, setWitnessName] = useState(existingData.witnessName || '')
  const [witnessPhone, setWitnessPhone] = useState(existingData.witnessPhone || '')
  const [witnessStatement, setWitnessStatement] = useState(existingData.witnessStatement || '')
  const [reportedBy, setReportedBy] = useState(existingData.reportedBy || '')
  const [reportedByTitle, setReportedByTitle] = useState(existingData.reportedByTitle || 'Project Manager')
  const [reportedByPhone, setReportedByPhone] = useState(existingData.reportedByPhone || '')
  const [reportedByEmail, setReportedByEmail] = useState(existingData.reportedByEmail || '')
  const [signatureData, setSignatureData] = useState(existingData.signatureData || '')
  const [photos, setPhotos] = useState<File[]>([])

  const handleInsuranceToggle = (checked: boolean) => {
    setIsForInsurance(checked)
    setIsExpanded(checked)
    
    // Update parent with insurance flag
    onUpdate({
      isForInsurance: checked,
      // Clear other fields if unchecked
      ...(checked ? {} : {
        witnessName: '',
        witnessPhone: '',
        witnessStatement: '',
        reportedBy: '',
        reportedByTitle: '',
        reportedByPhone: '',
        reportedByEmail: '',
        signatureData: ''
      })
    })
  }

  const updateField = (field: string, value: any) => {
    const updates = { [field]: value }
    
    // Auto-expand if filling out insurance fields
    if (value && !isExpanded) {
      setIsExpanded(true)
    }
    
    onUpdate(updates)
  }

  return (
    <Card className="border-orange-200">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => isForInsurance && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <Checkbox
              id="insurance-claim"
              checked={isForInsurance}
              onCheckedChange={handleInsuranceToggle}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-1">
            <Label 
              htmlFor="insurance-claim" 
              className="text-base font-medium cursor-pointer flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-orange-600" />
              This delay will be used for an insurance claim
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Additional documentation required for insurance purposes
            </p>
          </div>
          {isForInsurance && (
            <div className="pt-1">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          )}
        </div>
      </CardHeader>

      {isForInsurance && isExpanded && (
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Insurance claims require additional verification and documentation. 
              All fields marked with * are required for claim processing.
            </AlertDescription>
          </Alert>

          {/* Reported By Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Reported By Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportedBy">Full Name*</Label>
                <Input
                  id="reportedBy"
                  value={reportedBy}
                  onChange={(e) => {
                    setReportedBy(e.target.value)
                    updateField('reportedBy', e.target.value)
                  }}
                  placeholder="John Smith"
                  required={isForInsurance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportedByTitle">Title*</Label>
                <Input
                  id="reportedByTitle"
                  value={reportedByTitle}
                  onChange={(e) => {
                    setReportedByTitle(e.target.value)
                    updateField('reportedByTitle', e.target.value)
                  }}
                  placeholder="Project Manager"
                  required={isForInsurance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportedByPhone">Phone*</Label>
                <Input
                  id="reportedByPhone"
                  type="tel"
                  value={reportedByPhone}
                  onChange={(e) => {
                    setReportedByPhone(e.target.value)
                    updateField('reportedByPhone', e.target.value)
                  }}
                  placeholder="(555) 123-4567"
                  required={isForInsurance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportedByEmail">Email*</Label>
                <Input
                  id="reportedByEmail"
                  type="email"
                  value={reportedByEmail}
                  onChange={(e) => {
                    setReportedByEmail(e.target.value)
                    updateField('reportedByEmail', e.target.value)
                  }}
                  placeholder="john@company.com"
                  required={isForInsurance}
                />
              </div>
            </div>
          </div>

          {/* Witness Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Witness Information (Optional but Recommended)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="witnessName">Witness Name</Label>
                <Input
                  id="witnessName"
                  value={witnessName}
                  onChange={(e) => {
                    setWitnessName(e.target.value)
                    updateField('witnessName', e.target.value)
                  }}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="witnessPhone">Witness Phone</Label>
                <Input
                  id="witnessPhone"
                  type="tel"
                  value={witnessPhone}
                  onChange={(e) => {
                    setWitnessPhone(e.target.value)
                    updateField('witnessPhone', e.target.value)
                  }}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="witnessStatement">Witness Statement</Label>
              <Textarea
                id="witnessStatement"
                value={witnessStatement}
                onChange={(e) => {
                  setWitnessStatement(e.target.value)
                  updateField('witnessStatement', e.target.value)
                }}
                placeholder="Brief statement about what the witness observed..."
                rows={3}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Documentation*
            </h4>
            <p className="text-sm text-gray-600">
              Photos of weather conditions are required for insurance claims. 
              Upload clear photos showing the weather impact on work site.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setPhotos(prev => [...prev, ...files])
                  updateField('photos', [...photos, ...files])
                }}
                className="hidden"
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload"
                className="cursor-pointer"
              >
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB each
                </p>
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((photo, idx) => (
                  <Badge key={idx} variant="secondary">
                    {photo.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Digital Signature */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Signature className="h-4 w-4" />
              Digital Signature*
            </h4>
            <p className="text-sm text-gray-600">
              By signing below, you certify that all information provided is accurate and true.
            </p>
            <SignatureCanvas
              onSave={(signature) => {
                setSignatureData(signature)
                updateField('signatureData', signature)
              }}
            />
          </div>

          {/* Affidavit Text */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Affidavit:</strong> I hereby certify under penalty of perjury that the 
                information contained in this weather delay documentation is true and correct to 
                the best of my knowledge. I understand that any false statements may result in 
                denial of insurance claims and possible legal action.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  )
}