'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  CloudRain,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Shield,
  Signature,
  Upload,
  User,
  X,
  AlertTriangle,
  Download,
  Eye
} from "lucide-react"
import { SignatureCanvas } from '@/components/signature-canvas'
import { createClient } from '@/lib/supabase'

interface InsuranceClaimWizardProps {
  projectId: string
  project: any
  delays: any[]
  onComplete?: (reportId: string) => void
  onCancel?: () => void
}

type WizardStep = 'overview' | 'policy' | 'insured' | 'delays' | 'photos' | 'signature' | 'review'

export default function InsuranceClaimWizard({
  projectId,
  project,
  delays,
  onComplete,
  onCancel
}: InsuranceClaimWizardProps) {
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState<WizardStep>('overview')
  const [loading, setLoading] = useState(false)
  
  // Form data matching ACORD requirements
  const [formData, setFormData] = useState({
    // Policy Information
    policyNumber: project.insurance_policy_number || '',
    insurerName: '',
    policyEffectiveDate: '',
    policyExpirationDate: '',
    coverageLimit: '',
    deductible: '',
    
    // Insured/Company Information
    insuredName: '',
    insuredAddress: project.address || '',
    insuredCity: '',
    insuredState: '',
    insuredZip: '',
    insuredPhone: '',
    insuredEmail: '',
    
    // Claim Information
    claimNumber: '',
    reportedBy: '',
    reportedByTitle: 'Project Manager',
    reportedByPhone: '',
    reportedByEmail: '',
    
    // Loss Details
    selectedDelays: delays.map(d => d.id), // Select all by default
    lossDescription: '',
    
    // Additional Info
    witnessName: '',
    witnessPhone: '',
    witnessStatement: '',
    
    // Photos
    photos: [] as File[],
    
    // Signature
    signatureData: '',
    signedBy: '',
    signedDate: format(new Date(), 'yyyy-MM-dd'),
    
    // Options
    includePhotos: true,
    generateACORD: true,
    generatePDF: true
  })

  const steps: { id: WizardStep; title: string; icon: any }[] = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'policy', title: 'Policy Info', icon: Shield },
    { id: 'insured', title: 'Insured Details', icon: Building2 },
    { id: 'delays', title: 'Select Delays', icon: CloudRain },
    { id: 'photos', title: 'Add Photos', icon: Camera },
    { id: 'signature', title: 'Sign & Submit', icon: Signature },
    { id: 'review', title: 'Review', icon: Eye }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Calculate totals for selected delays
  const selectedDelayData = delays.filter(d => formData.selectedDelays.includes(d.id))
  const totalHours = selectedDelayData.reduce((sum, d) => sum + (d.duration_hours || 0), 0)
  const totalCost = selectedDelayData.reduce((sum, d) => sum + (d.total_cost || 0), 0)
  const laborCost = selectedDelayData.reduce((sum, d) => sum + (d.labor_cost || 0), 0)
  const equipmentCost = selectedDelayData.reduce((sum, d) => sum + (d.equipment_cost || 0), 0)

  // Photo handling with drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...acceptedFiles]
    }))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id)
    }
  }

  const handleBack = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Prepare report data matching ACORD structure
      const reportData = {
        projectId,
        reportType: 'INSURANCE_CLAIM',
        periodStart: Math.min(...selectedDelayData.map(d => new Date(d.start_time).getTime())),
        periodEnd: Math.max(...selectedDelayData.map(d => d.end_time ? new Date(d.end_time).getTime() : Date.now())),
        
        // ACORD required fields
        policyNumber: formData.policyNumber,
        insurerName: formData.insurerName,
        claimNumber: formData.claimNumber,
        
        // Company/Insured info
        insuredName: formData.insuredName,
        insuredAddress: {
          line1: formData.insuredAddress,
          city: formData.insuredCity,
          state: formData.insuredState,
          postalCode: formData.insuredZip
        },
        
        // Contact info
        reportedBy: {
          name: formData.reportedBy,
          title: formData.reportedByTitle,
          phone: formData.reportedByPhone,
          email: formData.reportedByEmail
        },
        
        // Signature
        signatureData: formData.signatureData,
        signedBy: formData.signedBy,
        signedAt: formData.signedDate,
        
        // Delays included
        selectedDelays: formData.selectedDelays,
        
        // Options
        includePhotos: formData.includePhotos,
        format: formData.generatePDF ? 'pdf' : 'data',
        generateACORD: formData.generateACORD,
        
        // Calculated totals
        totalHours,
        totalCost,
        laborCost,
        equipmentCost
      }

      // Upload photos if any
      if (formData.photos.length > 0) {
        // TODO: Upload photos to storage
      }

      // Generate report
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      const data = await response.json()
      
      if (data.success) {
        onComplete?.(data.reportId)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error generating claim:', error)
      alert('Failed to generate insurance claim')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Insurance Claim Report</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                This wizard will help you create a comprehensive insurance claim report with all required documentation, 
                including ACORD 125 Loss Notice format.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Project</p>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {project.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Delays</p>
                    <p className="text-2xl font-bold text-red-600">{delays.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Impact</p>
                    <p className="text-2xl font-bold text-green-600">${totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-orange-900">Required Information</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Valid insurance policy number</li>
                      <li>• Insured company details and address</li>
                      <li>• Authorized signature for claim submission</li>
                      <li>• Photos documenting weather conditions (recommended)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'policy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Insurance Policy Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number*</Label>
                  <Input
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                    placeholder="POL-123456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurerName">Insurance Company*</Label>
                  <Input
                    id="insurerName"
                    value={formData.insurerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurerName: e.target.value }))}
                    placeholder="Travelers, Liberty Mutual, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyEffectiveDate">Policy Effective Date</Label>
                  <Input
                    id="policyEffectiveDate"
                    type="date"
                    value={formData.policyEffectiveDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyEffectiveDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyExpirationDate">Policy Expiration Date</Label>
                  <Input
                    id="policyExpirationDate"
                    type="date"
                    value={formData.policyExpirationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyExpirationDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverageLimit">Coverage Limit</Label>
                  <Input
                    id="coverageLimit"
                    type="number"
                    value={formData.coverageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverageLimit: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductible">Deductible</Label>
                  <Input
                    id="deductible"
                    type="number"
                    value={formData.deductible}
                    onChange={(e) => setFormData(prev => ({ ...prev, deductible: e.target.value }))}
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimNumber">Claim Number (if already assigned)</Label>
              <Input
                id="claimNumber"
                value={formData.claimNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                placeholder="CLM-2024-001"
              />
            </div>
          </div>
        )

      case 'insured':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Insured/Company Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insuredName">Insured Name (Company)*</Label>
                  <Input
                    id="insuredName"
                    value={formData.insuredName}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuredName: e.target.value }))}
                    placeholder="ABC Construction Company"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="insuredAddress">Company Address*</Label>
                  <Input
                    id="insuredAddress"
                    value={formData.insuredAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuredAddress: e.target.value }))}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuredCity">City*</Label>
                    <Input
                      id="insuredCity"
                      value={formData.insuredCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuredCity: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuredState">State*</Label>
                    <Input
                      id="insuredState"
                      value={formData.insuredState}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuredState: e.target.value }))}
                      maxLength={2}
                      placeholder="NY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuredZip">ZIP Code*</Label>
                    <Input
                      id="insuredZip"
                      value={formData.insuredZip}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuredZip: e.target.value }))}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuredPhone">Company Phone</Label>
                    <Input
                      id="insuredPhone"
                      type="tel"
                      value={formData.insuredPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuredPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuredEmail">Company Email</Label>
                    <Input
                      id="insuredEmail"
                      type="email"
                      value={formData.insuredEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuredEmail: e.target.value }))}
                      placeholder="claims@company.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Reported By</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportedBy">Name*</Label>
                  <Input
                    id="reportedBy"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportedByTitle">Title*</Label>
                  <Input
                    id="reportedByTitle"
                    value={formData.reportedByTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedByTitle: e.target.value }))}
                    placeholder="Project Manager"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportedByPhone">Phone*</Label>
                  <Input
                    id="reportedByPhone"
                    type="tel"
                    value={formData.reportedByPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedByPhone: e.target.value }))}
                    placeholder="(555) 987-6543"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportedByEmail">Email*</Label>
                  <Input
                    id="reportedByEmail"
                    type="email"
                    value={formData.reportedByEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedByEmail: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'delays':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Delays to Include</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose which weather delay events to include in this insurance claim.
              </p>
            </div>

            <div className="space-y-3">
              {delays.map((delay) => {
                const isSelected = formData.selectedDelays.includes(delay.id)
                return (
                  <Card 
                    key={delay.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        selectedDelays: isSelected
                          ? prev.selectedDelays.filter(id => id !== delay.id)
                          : [...prev.selectedDelays, delay.id]
                      }))
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {format(new Date(delay.start_time), 'MMMM d, yyyy')}
                              </p>
                              <p className="text-sm text-gray-600">{delay.weather_condition}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${(delay.total_cost || 0).toLocaleString()}</p>
                              <p className="text-sm text-gray-600">{delay.duration_hours?.toFixed(1)} hours</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(delay.start_time), 'h:mm a')} - {
                                delay.end_time 
                                  ? format(new Date(delay.end_time), 'h:mm a')
                                  : 'Ongoing'
                              }
                            </span>
                            {delay.verified && (
                              <Badge variant="default" className="bg-green-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Selected Delays</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.selectedDelays.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalHours.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="lossDescription">Additional Loss Description</Label>
              <Textarea
                id="lossDescription"
                value={formData.lossDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, lossDescription: e.target.value }))}
                placeholder="Provide any additional details about the weather delays and their impact..."
                rows={4}
              />
            </div>
          </div>
        )

      case 'photos':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Photo Documentation</h3>
              <p className="text-sm text-gray-600">
                Add photos showing weather conditions during delay events. Drag & drop or click to upload.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop photos here...</p>
              ) : (
                <div>
                  <p className="text-gray-600">Drag & drop photos here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-1">Maximum 10MB per photo</p>
                </div>
              )}
            </div>

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">Witness Information (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="witnessName">Witness Name</Label>
                  <Input
                    id="witnessName"
                    value={formData.witnessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, witnessName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="witnessPhone">Witness Phone</Label>
                  <Input
                    id="witnessPhone"
                    type="tel"
                    value={formData.witnessPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, witnessPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="witnessStatement">Witness Statement</Label>
                <Textarea
                  id="witnessStatement"
                  value={formData.witnessStatement}
                  onChange={(e) => setFormData(prev => ({ ...prev, witnessStatement: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 'signature':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Signature & Affidavit</h3>
              <p className="text-sm text-gray-600">
                By signing below, you certify that all information provided is true and accurate.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Affidavit Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                  <p>
                    I, the undersigned, hereby certify that the information contained in this claim 
                    is true and correct to the best of my knowledge and belief.
                  </p>
                  <p>
                    I understand that any false statements or misrepresentations may result in 
                    denial of this claim and possible legal action.
                  </p>
                  <p>
                    I authorize the insurance company to investigate all statements made in this 
                    claim and to obtain any necessary information.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signedBy">Signed By*</Label>
                <Input
                  id="signedBy"
                  value={formData.signedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, signedBy: e.target.value }))}
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signedDate">Date*</Label>
                <Input
                  id="signedDate"
                  type="date"
                  value={formData.signedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, signedDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Digital Signature*</Label>
              <SignatureCanvas
                onSave={(signature) => setFormData(prev => ({ ...prev, signatureData: signature }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateACORD"
                  checked={formData.generateACORD}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generateACORD: checked as boolean }))}
                />
                <Label htmlFor="generateACORD" className="cursor-pointer">
                  Generate ACORD 125 Loss Notice (XML format)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generatePDF"
                  checked={formData.generatePDF}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generatePDF: checked as boolean }))}
                />
                <Label htmlFor="generatePDF" className="cursor-pointer">
                  Generate PDF report with all documentation
                </Label>
              </div>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review & Submit</h3>
              <p className="text-sm text-gray-600">
                Please review all information before submitting your insurance claim.
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Policy Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Policy Number</p>
                    <p className="font-medium">{formData.policyNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurance Company</p>
                    <p className="font-medium">{formData.insurerName || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Claim Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Delays Included</p>
                      <p className="font-medium">{formData.selectedDelays.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Hours Lost</p>
                      <p className="font-medium">{totalHours.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Claim Amount</p>
                      <p className="font-medium text-green-600">${totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Labor Cost</p>
                      <p className="font-medium">${laborCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Equipment Cost</p>
                      <p className="font-medium">${equipmentCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Other Costs</p>
                      <p className="font-medium">${(totalCost - laborCost - equipmentCost).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Photos</span>
                    <span className="font-medium">{formData.photos.length} files</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Digital Signature</span>
                    <span className="font-medium text-green-600">
                      {formData.signatureData ? 'Provided' : 'Missing'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Output Formats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.generateACORD && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>ACORD 125 Loss Notice (XML)</span>
                    </div>
                  )}
                  {formData.generatePDF && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>PDF Report with Documentation</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="font-medium">
            {steps[currentStepIndex].title}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = index < currentStepIndex
          
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-2 cursor-pointer ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
              onClick={() => setCurrentStep(step.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.title}</span>
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 'overview' ? onCancel : handleBack}
          disabled={loading}
        >
          {currentStep === 'overview' ? 'Cancel' : 'Back'}
        </Button>
        
        <div className="flex items-center gap-3">
          {currentStep === 'review' ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.signatureData}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Claim...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Submit Claim
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}