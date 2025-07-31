'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MapPin, Calendar, DollarSign, Building, Shield, ChevronRight, ChevronLeft, Check, X, Plus } from 'lucide-react'
import { CONTRACTOR_TYPE_ACTIVITIES, ContractorType } from '@/types/project-activities'
import { format } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'

interface ProjectSetupWizardProps {
  onComplete?: (projectId: string) => void
  initialData?: any
}

export function ProjectSetupWizard({ onComplete, initialData }: ProjectSetupWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [customActivity, setCustomActivity] = useState('')
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: initialData?.name || '',
    contractor_type: initialData?.contractor_type || 'General Contractor' as ContractorType,
    address: initialData?.address || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    
    // Step 2: Schedule
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    project_value: initialData?.project_value || '',
    
    // Step 3: Insurance
    insurance_company: initialData?.insurance_company || '',
    insurance_claim_number: initialData?.insurance_claim_number || '',
    deductible_amount: initialData?.deductible_amount || '',
    general_contractor: initialData?.general_contractor || '',
    
    // Step 4: Activities
    activities: [] as string[]
  })
  
  const steps = [
    { number: 1, title: 'Basic Information', icon: Building },
    { number: 2, title: 'Schedule & Value', icon: Calendar },
    { number: 3, title: 'Insurance Details', icon: Shield },
    { number: 4, title: 'Project Activities', icon: ChevronRight }
  ]
  
  // Initialize activities based on contractor type
  const initializeActivities = (contractorType: ContractorType) => {
    const defaultActivities = CONTRACTOR_TYPE_ACTIVITIES[contractorType] || []
    setFormData(prev => ({ ...prev, activities: [...defaultActivities] }))
  }
  
  // Handle contractor type change
  const handleContractorTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, contractor_type: value as ContractorType }))
    initializeActivities(value as ContractorType)
  }
  
  // Toggle activity
  const toggleActivity = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }))
  }
  
  // Add custom activity
  const addCustomActivity = () => {
    if (customActivity.trim() && !formData.activities.includes(customActivity.trim())) {
      setFormData(prev => ({
        ...prev,
        activities: [...prev.activities, customActivity.trim()]
      }))
      setCustomActivity('')
    }
  }
  
  // Remove activity
  const removeActivity = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a !== activity)
    }))
  }
  
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.address && formData.contractor_type)
      case 2:
        return !!(formData.start_date && formData.project_value)
      case 3:
        return !!(formData.insurance_company && formData.general_contractor)
      case 4:
        return formData.activities.length > 0
      default:
        return false
    }
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1 && formData.activities.length === 0) {
        initializeActivities(formData.contractor_type)
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          contractor_type: formData.contractor_type,
          address: formData.address,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          project_value: parseFloat(formData.project_value),
          insurance_company: formData.insurance_company,
          insurance_claim_number: formData.insurance_claim_number,
          deductible_amount: formData.deductible_amount ? parseFloat(formData.deductible_amount) : null,
          general_contractor: formData.general_contractor,
          status: 'Active'
        })
        .select()
        .single()
      
      if (projectError) throw projectError
      
      // Create project activities
      if (project && formData.activities.length > 0) {
        const defaultActivities = CONTRACTOR_TYPE_ACTIVITIES[formData.contractor_type as ContractorType] || []
        const activitiesData = formData.activities.map(activity => ({
          project_id: project.id,
          activity_name: activity,
          is_active: true,
          is_default: defaultActivities.includes(activity)
        }))
        
        const { error: activitiesError } = await supabase
          .from('project_activities')
          .insert(activitiesData)
        
        if (activitiesError) throw activitiesError
      }
      
      if (onComplete) {
        onComplete(project.id)
      } else {
        router.push(`/projects/${project.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
            
            <div>
              <Label htmlFor="contractor_type">Contractor Type *</Label>
              <Select value={formData.contractor_type} onValueChange={handleContractorTypeChange}>
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
                This will set default activities based on your specialty
              </p>
            </div>
            
            <div>
              <Label htmlFor="address">Project Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter project address"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="40.7128"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="-74.0060"
                />
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={formData.start_date}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="project_value">Project Value *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="project_value"
                  type="number"
                  step="0.01"
                  value={formData.project_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_value: e.target.value }))}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="insurance_company">Insurance Company *</Label>
              <Input
                id="insurance_company"
                value={formData.insurance_company}
                onChange={(e) => setFormData(prev => ({ ...prev, insurance_company: e.target.value }))}
                placeholder="Enter insurance company name"
              />
            </div>
            
            <div>
              <Label htmlFor="insurance_claim_number">Claim Number (optional)</Label>
              <Input
                id="insurance_claim_number"
                value={formData.insurance_claim_number}
                onChange={(e) => setFormData(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
                placeholder="Enter claim number"
              />
            </div>
            
            <div>
              <Label htmlFor="deductible_amount">Deductible Amount (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="deductible_amount"
                  type="number"
                  step="0.01"
                  value={formData.deductible_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, deductible_amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="general_contractor">General Contractor *</Label>
              <Input
                id="general_contractor"
                value={formData.general_contractor}
                onChange={(e) => setFormData(prev => ({ ...prev, general_contractor: e.target.value }))}
                placeholder="Enter general contractor name"
              />
            </div>
          </div>
        )
        
      case 4:
        const defaultActivities = CONTRACTOR_TYPE_ACTIVITIES[formData.contractor_type as ContractorType] || []
        const customActivities = formData.activities.filter(a => !defaultActivities.includes(a))
        
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Default Activities for {formData.contractor_type}</h3>
              <p className="text-sm text-gray-500 mb-3">
                These are typical activities for your contractor type. Uncheck any that don't apply.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {defaultActivities.map(activity => (
                  <label
                    key={activity}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.activities.includes(activity)}
                      onCheckedChange={() => toggleActivity(activity)}
                    />
                    <span className="text-sm">{activity}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {customActivities.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Custom Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {customActivities.map(activity => (
                    <Badge key={activity} variant="secondary" className="pl-3">
                      {activity}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => removeActivity(activity)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-2">Add Custom Activity</h3>
              <div className="flex gap-2">
                <Input
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="Enter custom activity"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomActivity()}
                />
                <Button
                  type="button"
                  onClick={addCustomActivity}
                  disabled={!customActivity.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Selected Activities:</strong> {formData.activities.length}
              </p>
              <p className="text-sm text-gray-600">
                These activities will be available for selection when documenting delays.
              </p>
            </div>
          </div>
        )
    }
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>New Project Setup</CardTitle>
        <CardDescription>
          Let's set up your project with all the necessary information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep
              
              return (
                <div
                  key={step.number}
                  className={`flex items-center ${
                    isActive ? 'text-blue-600 font-medium' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mr-2
                    ${isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'}
                  `}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="min-h-[300px] mb-6">
          {renderStepContent()}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !validateStep(currentStep)}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}