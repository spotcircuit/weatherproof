'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CloudRain, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  AlertTriangle,
  DollarSign,
  FileText,
  Users,
  Mail,
  User,
  Phone
} from 'lucide-react'

interface FormData {
  // Contact info (collected first)
  email: string
  contactName: string
  companyName: string
  phone: string
  role: string
  
  // Qualifier questions
  projectsPerYear: string
  typicalDelayCost: string
  delaysLastYear: string
  
  // Details
  constructionTypes: string[]
  biggestChallenges: string[]
  filedClaim: string[]
  currentDocumentation: string[]
  
  // Features
  valuableFeatures: string[]
  willingToPay: string
  wantsNotification: string
}

const initialFormData: FormData = {
  // Contact info
  email: '',
  contactName: '',
  companyName: '',
  phone: '',
  role: '',
  
  // Qualifier questions
  projectsPerYear: '',
  typicalDelayCost: '',
  delaysLastYear: '',
  
  // Details
  constructionTypes: [],
  biggestChallenges: [],
  filedClaim: [],
  currentDocumentation: [],
  
  // Features
  valuableFeatures: [],
  willingToPay: '',
  wantsNotification: ''
}

export default function SurveyPage() {
  // Force refresh - show intro first
  const [currentStep, setCurrentStep] = useState(-1) // Start with intro screen
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const totalSteps = 4 // Contact, Details, Features, Thank You (removed qualifier)
  const progress = currentStep >= 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  const handleNext = () => {
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate current step before proceeding
    if (currentStep >= 0 && !validateCurrentStep()) {
      return
    }
    
    setCurrentStep(currentStep + 1)
  }

  // Enhanced validation with specific error messages
  const validateCurrentStep = () => {
    const errors: Record<string, string> = {}
    
    switch (currentStep) {
      case 0: // Contact section
        if (!formData.email) {
          errors.email = 'Email address is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address'
        }
        if (!formData.contactName.trim()) {
          errors.contactName = 'Your name is required'
        }
        if (!formData.companyName.trim()) {
          errors.companyName = 'Company name is required'
        }
        if (!formData.role) {
          errors.role = 'Please select your role'
        }
        break
        
      case 1: // Details section (formerly qualifier)
        if (!formData.projectsPerYear) {
          errors.projectsPerYear = 'Please select number of projects per year'
        }
        if (!formData.typicalDelayCost) {
          errors.typicalDelayCost = 'Please select typical delay cost'
        }
        if (!formData.delaysLastYear) {
          errors.delaysLastYear = 'Please select delays experienced last year'
        }
        if (formData.filedClaim.length === 0) {
          errors.filedClaim = 'Please select your experience with weather-related claims'
        }
        if (formData.constructionTypes.length === 0) {
          errors.constructionTypes = 'Please select at least one construction type'
        }
        if (formData.currentDocumentation.length === 0) {
          errors.currentDocumentation = 'Please select at least one documentation method'
        }
        break
        
      case 2: // Features section
        if (formData.valuableFeatures.length === 0) {
          errors.valuableFeatures = 'Please select at least one valuable feature'
        }
        if (!formData.willingToPay) {
          errors.willingToPay = 'Please select your pricing preference'
        }
        break
        
      default:
        break
    }
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = document.querySelector(`[data-error="true"]`)
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return false
    }
    
    return true
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qualified: true // Everyone qualifies now
        })
      })
      
      if (response.ok) {
        setIsComplete(true)
        setCurrentStep(totalSteps)
      } else {
        throw new Error('Failed to submit')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error submitting your response. Please try again.'
      console.error('Survey submission error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        formData: JSON.stringify(formData, null, 2)
      })
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render different sections based on current step
  const renderStep = () => {
    if (currentStep === -1) {
      return <IntroSection onBegin={() => setCurrentStep(0)} />
    }
    
    switch (currentStep) {
      case 0:
        return <ContactSection formData={formData} setFormData={setFormData} validationErrors={validationErrors} />
      case 1:
        return <CombinedDetailsSection formData={formData} setFormData={setFormData} validationErrors={validationErrors} />
      case 2:
        return <FeaturesSection formData={formData} setFormData={setFormData} validationErrors={validationErrors} />
      default:
        return <ThankYouSection />
    }
  }

  if (currentStep >= totalSteps) {
    return renderStep()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {currentStep === -1 ? (
          renderStep()
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <CloudRain className="h-12 w-12 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 ml-4">WeatherProof Research</h1>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Help us build the perfect solution for weather delay documentation and insurance claims
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="bg-white rounded-full p-1 shadow-sm">
                <Progress value={progress} className="h-3" />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center font-medium">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>

            {/* Current step content */}
            <div className="mb-8">
              {renderStep()}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="px-8 py-3">
                  ← Back
                </Button>
              )}
              <div className="ml-auto">
                {currentStep < totalSteps - 1 ? (
                  <Button onClick={handleNext} className="px-8 py-3 bg-blue-600 hover:bg-blue-700">
                    Continue → 
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-green-600 hover:bg-green-700">
                    {isSubmitting ? 'Submitting...' : 'Complete Survey'}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function IntroSection({ onBegin }: any) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-2xl">
            <CloudRain className="h-16 w-16 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          The Future of Weather Delay
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Documentation</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Help us build the industry-leading platform that transforms how contractors document weather delays 
          and how insurance companies process claims.
        </p>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* For Contractors */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl text-blue-900">For Contractors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Automated Documentation:</strong> Capture weather conditions, delays, and costs effortlessly</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Faster Claims:</strong> Submit insurance claims with bulletproof documentation</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Recover More Costs:</strong> Maximize reimbursement with precise delay tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Real-time Alerts:</strong> Know exactly when to stop work to protect your crew and budget</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For Insurance Companies */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-green-600" />
              <CardTitle className="text-2xl text-green-900">For Insurance Companies</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Standardized Claims:</strong> Receive consistent, verified weather delay documentation</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Faster Processing:</strong> Reduce claim review time with automated verification</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Reduced Fraud:</strong> Third-party weather verification eliminates false claims</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Better Risk Assessment:</strong> Historical weather data improves underwriting accuracy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Statement */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-red-50 mb-12">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">The Current Problem</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contractors Lose Money</h4>
                <p className="text-gray-700 text-sm">Manual documentation leads to rejected claims and unrecovered costs from weather delays</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Insurance Delays</h4>
                <p className="text-gray-700 text-sm">Inconsistent documentation creates lengthy claim review processes and disputes</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Industry Inefficiency</h4>
                <p className="text-gray-700 text-sm">Billions lost annually due to poor weather delay documentation and claim processing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Help Us Build the Solution</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Your insights will shape WeatherProof into the industry standard for weather delay documentation. 
          This survey takes just 3-4 minutes and your feedback is invaluable.
        </p>
        <Button 
          onClick={onBegin} 
          className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Begin Survey
          <ArrowRight className="ml-3 h-5 w-5" />
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          ⏱️ Takes 3-4 minutes • 🔒 Your information is secure • 📊 Results help build better tools
        </p>
      </div>
    </div>
  )
}

function CombinedDetailsSection({ formData, setFormData, validationErrors }: any) {
  const challengeCategories = [
    { id: 'documentation', label: 'Documenting weather conditions' },
    { id: 'tracking', label: 'Tracking delay costs' },
    { id: 'claims', label: 'Filing insurance claims' },
    { id: 'proof', label: 'Proving weather caused delays' },
    { id: 'notification', label: 'Not knowing when to stop work' }
  ]

  const constructionTypes = [
    'Commercial buildings',
    'Residential',
    'Infrastructure/Heavy civil',
    'Industrial',
    'Specialty trade'
  ]

  const impactedTrades = [
    'Concrete/Foundation',
    'Roofing',
    'Framing',
    'Earthwork/Excavation',
    'Exterior finishes',
    'Steel erection'
  ]

  const documentationMethods = [
    'Manual daily reports',
    'Photos with phones',
    'Third-party weather service',
    'On-site weather station',
    'No formal process'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell Us About Your Operations</CardTitle>
        <CardDescription>
          Help us understand your specific challenges with weather delays
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Projects per year */}
        <div className="space-y-3">
          <Label>How many construction projects does your company manage annually? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.projectsPerYear}
            onValueChange={(value) => setFormData({ ...formData, projectsPerYear: value })}
            data-error={!!validationErrors.projectsPerYear}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1-2 projects" id="p1" />
              <Label htmlFor="p1">1-2 projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3-10 projects" id="p2" />
              <Label htmlFor="p2">3-10 projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="11-25 projects" id="p3" />
              <Label htmlFor="p3">11-25 projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="26-50 projects" id="p4" />
              <Label htmlFor="p4">26-50 projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="50+ projects" id="p5" />
              <Label htmlFor="p5">50+ projects</Label>
            </div>
          </RadioGroup>
          {validationErrors.projectsPerYear && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.projectsPerYear}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Typical delay cost */}
        <div className="space-y-3">
          <Label>What's the typical cost of a weather delay for your company? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.typicalDelayCost}
            onValueChange={(value) => setFormData({ ...formData, typicalDelayCost: value })}
            data-error={!!validationErrors.typicalDelayCost}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Under $1,000" id="c1" />
              <Label htmlFor="c1">Under $1,000</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$1,000 - $5,000" id="c2" />
              <Label htmlFor="c2">$1,000 - $5,000</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$5,000 - $25,000" id="c3" />
              <Label htmlFor="c3">$5,000 - $25,000</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$25,000 - $100,000" id="c4" />
              <Label htmlFor="c4">$25,000 - $100,000</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Over $100,000" id="c5" />
              <Label htmlFor="c5">Over $100,000</Label>
            </div>
          </RadioGroup>
          {validationErrors.typicalDelayCost && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.typicalDelayCost}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Delays last year */}
        <div className="space-y-3">
          <Label>How many weather-related delays did you experience in the last 12 months? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.delaysLastYear}
            onValueChange={(value) => setFormData({ ...formData, delaysLastYear: value })}
            data-error={!!validationErrors.delaysLastYear}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="None" id="d1" />
              <Label htmlFor="d1">None</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1-5 delays" id="d2" />
              <Label htmlFor="d2">1-5 delays</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="6-15 delays" id="d3" />
              <Label htmlFor="d3">6-15 delays</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="16-30 delays" id="d4" />
              <Label htmlFor="d4">16-30 delays</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30+ delays" id="d5" />
              <Label htmlFor="d5">30+ delays</Label>
            </div>
          </RadioGroup>
          {validationErrors.delaysLastYear && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.delaysLastYear}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Filed claim */}
        <div className="space-y-3">
          <Label>Have you ever filed a weather delay insurance claim or change order? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.filedClaim}
            onValueChange={(value) => setFormData({ ...formData, filedClaim: value })}
            data-error={!!validationErrors.filedClaim}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes, successfully" id="f1" />
              <Label htmlFor="f1">Yes, successfully</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes, but denied" id="f2" />
              <Label htmlFor="f2">Yes, but it was denied/disputed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No, too much hassle" id="f3" />
              <Label htmlFor="f3">No, too much hassle</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No, didn't know" id="f4" />
              <Label htmlFor="f4">No, didn't know we could</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Not applicable" id="f5" />
              <Label htmlFor="f5">No, not applicable to our work</Label>
            </div>
          </RadioGroup>
          {validationErrors.filedClaim && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.filedClaim}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Construction types */}
        <div className="space-y-3">
          <Label>Types of construction (check all that apply) <span className="text-red-500">*</span></Label>
          <div className="space-y-2" data-error={!!validationErrors.constructionTypes}>
            {constructionTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={formData.constructionTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        constructionTypes: [...formData.constructionTypes, type]
                      })
                    } else {
                      setFormData({
                        ...formData,
                        constructionTypes: formData.constructionTypes.filter((t: string) => t !== type)
                      })
                    }
                  }}
                />
                <Label htmlFor={type}>{type}</Label>
              </div>
            ))}
          </div>
        </div>



        {/* Current documentation */}
        <div className="space-y-3">
          <Label>How do you currently document weather?</Label>
          <div className="space-y-2">
            {documentationMethods.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={formData.currentDocumentation.includes(method)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        currentDocumentation: [...formData.currentDocumentation, method]
                      })
                    } else {
                      setFormData({
                        ...formData,
                        currentDocumentation: formData.currentDocumentation.filter((m: string) => m !== method)
                      })
                    }
                  }}
                />
                <Label htmlFor={method}>{method}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Biggest challenges */}
        <div className="space-y-3">
          <Label>Rate your biggest weather delay challenges (1 = Not a problem, 5 = Major problem)</Label>
          <div className="space-y-3">
            {challengeCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{category.label}</span>
                  <RadioGroup
                    value={formData.biggestChallenges[category.id]?.toString() || ''}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      biggestChallenges: { ...formData.biggestChallenges, [category.id]: parseInt(value) }
                    })}
                    className="flex gap-4"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <RadioGroupItem 
                          value={rating.toString()} 
                          id={`${category.id}-${rating}`}
                          className="h-6 w-6"
                        />
                        <Label htmlFor={`${category.id}-${rating}`} className="ml-1 cursor-pointer">
                          {rating}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current software */}
        <div className="space-y-3">
          <Label>Current construction management software</Label>
          <RadioGroup
            value={formData.currentSoftware}
            onValueChange={(value) => setFormData({ ...formData, currentSoftware: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Procore" id="s1" />
              <Label htmlFor="s1">Procore</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Autodesk Build" id="s2" />
              <Label htmlFor="s2">Autodesk Build</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Buildertrend" id="s3" />
              <Label htmlFor="s3">Buildertrend</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Spreadsheets" id="s4" />
              <Label htmlFor="s4">Spreadsheets</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="s5" />
              <Label htmlFor="s5">Other</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturesSection({ formData, setFormData, validationErrors }: any) {
  const features = [
    'Automatic weather monitoring',
    '21-day claim alerts',
    'Cost impact calculations',
    'ACORD form generation',
    'Photo documentation',
    'Digital signatures',
    'Multi-site dashboard',
    'Predictive weather alerts',
    'Subcontractor delay tracking',
    'Equipment idle time tracking'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>What Features Would Help You Most?</CardTitle>
        <CardDescription>
          Select up to 5 features that would provide the most value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Valuable features */}
        <div className="space-y-3">
          <Label>Which features would provide the most value? (Select up to 5) <span className="text-red-500">*</span></Label>
          <div className="space-y-2" data-error={!!validationErrors.valuableFeatures}>
            {features.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={formData.valuableFeatures.includes(feature)}
                  disabled={!formData.valuableFeatures.includes(feature) && formData.valuableFeatures.length >= 5}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        valuableFeatures: [...formData.valuableFeatures, feature]
                      })
                    } else {
                      setFormData({
                        ...formData,
                        valuableFeatures: formData.valuableFeatures.filter((f: string) => f !== feature)
                      })
                    }
                  }}
                />
                <Label htmlFor={feature}>{feature}</Label>
              </div>
            ))}
          </div>
          {formData.valuableFeatures.length >= 5 && (
            <p className="text-sm text-gray-500">Maximum 5 features selected</p>
          )}
          {validationErrors.valuableFeatures && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.valuableFeatures}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Pricing preference */}
        <div className="space-y-3">
          <Label>What would you be willing to pay monthly for a comprehensive weather delay solution? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.willingToPay}
            onValueChange={(value) => setFormData({ ...formData, willingToPay: value })}
            data-error={!!validationErrors.willingToPay}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Under $50/month" id="price1" />
              <Label htmlFor="price1">Under $50/month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$50-$150/month" id="price2" />
              <Label htmlFor="price2">$50-$150/month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$150-$300/month" id="price3" />
              <Label htmlFor="price3">$150-$300/month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="$300+/month" id="price4" />
              <Label htmlFor="price4">$300+/month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Would not pay" id="price5" />
              <Label htmlFor="price5">Would not pay for this</Label>
            </div>
          </RadioGroup>
          {validationErrors.willingToPay && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.willingToPay}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Notification preference */}
        <div className="space-y-3">
          <Label>Would you like to be notified when WeatherProof launches? <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={formData.wantsNotification}
            onValueChange={(value) => setFormData({ ...formData, wantsNotification: value })}
            data-error={!!validationErrors.wantsNotification}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes, keep me updated" id="notify1" />
              <Label htmlFor="notify1">Yes, keep me updated on progress</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes, beta access" id="notify2" />
              <Label htmlFor="notify2">Yes, and I want early beta access</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No thanks" id="notify3" />
              <Label htmlFor="notify3">No thanks</Label>
            </div>
          </RadioGroup>
          {validationErrors.wantsNotification && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.wantsNotification}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ContactSection({ formData, setFormData, validationErrors }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Let's Get Started
        </CardTitle>
        <CardDescription>
          First, we need some basic information to personalize your survey experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact information - now required upfront */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@abcconstruction.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-error={!!validationErrors.email}
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {validationErrors.email}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              data-error={!!validationErrors.contactName}
              className={validationErrors.contactName ? 'border-red-500' : ''}
            />
            {validationErrors.contactName && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {validationErrors.contactName}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company"
              placeholder="ABC Construction"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              data-error={!!validationErrors.companyName}
              className={validationErrors.companyName ? 'border-red-500' : ''}
            />
            {validationErrors.companyName && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {validationErrors.companyName}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone (Optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Role selection - moved here and made required */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            What's your role? <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
            data-error={!!validationErrors.role}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="General Contractor" id="role1" />
              <Label htmlFor="role1">General Contractor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Subcontractor" id="role2" />
              <Label htmlFor="role2">Subcontractor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Project Manager" id="role3" />
              <Label htmlFor="role3">Project Manager</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Owner/Developer" id="role4" />
              <Label htmlFor="role4">Owner/Developer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="role5" />
              <Label htmlFor="role5">Other</Label>
            </div>
          </RadioGroup>
          {validationErrors.role && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {validationErrors.role}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Notification preference - now optional */}
        <div className="space-y-3">
          <Label>Would you like updates about WeatherProof?</Label>
          <RadioGroup
            value={formData.wantsNotification || 'Yes, very interested'}
            onValueChange={(value) => setFormData({ ...formData, wantsNotification: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes, very interested" id="n1" />
              <Label htmlFor="n1">Yes, I'm very interested</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Maybe" id="n2" />
              <Label htmlFor="n2">Maybe, send me updates</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No thanks" id="n3" />
              <Label htmlFor="n3">No thanks</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}

function ThankYouSection() {
  return (
    <Card className="text-center max-w-2xl mx-auto shadow-lg">
      <CardHeader className="pb-4">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <CardTitle className="text-3xl font-bold">Thank You for Your Valuable Input!</CardTitle>
        <CardDescription className="text-lg mt-2">
          Your feedback is helping us build the perfect solution for contractors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-4">
          <p className="text-gray-600">
            Your responses will help shape WeatherProof to solve real contractor challenges.
          </p>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100 space-y-4">
            <h3 className="font-bold text-xl text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              What Happens Next:
            </h3>
            <ul className="text-left space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>We're currently in development and your feedback is invaluable</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>You'll receive updates as we near launch</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Early participants will get priority access and special pricing</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-8 rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg mb-3 flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Have Questions?
            </h3>
            <p className="text-gray-600 mb-2">
              We'd love to hear from you
            </p>
            <a href="mailto:info@weatherproof.build" className="text-blue-600 hover:text-blue-700 font-medium text-lg">
              info@weatherproof.build
            </a>
          </div>
        </div>

        <div className="pt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home Page
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}