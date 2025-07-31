'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { 
  Mic, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  Camera,
  FileText,
  Wrench,
  HardHat,
  DollarSign,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  Package,
  Users,
  Truck,
  ClipboardCheck,
  X
} from 'lucide-react'
import { format, parse, isValid, startOfDay, endOfDay } from 'date-fns'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { INSURANCE_GUIDANCE } from '@/lib/insurance-guidance'

interface SmartDocumentationWizardProps {
  projectId?: string
  projects: any[]
  crew: any[]
  equipment: any[]
  onComplete?: () => void
}

// Documentation types with smart defaults
const DOCUMENTATION_TYPES = {
  WEATHER_DELAY: {
    title: 'Weather Delay',
    icon: CloudRain,
    color: 'blue',
    description: 'Rain, wind, temperature, or other weather conditions',
    smartPrompts: [
      "Rain started around [time] and we had to stop [activity]",
      "High winds made it unsafe to operate the crane",
      "Too cold to pour concrete this morning",
      "Lightning within 10 miles, evacuated site"
    ]
  },
  MATERIAL_DAMAGE: {
    title: 'Material Damage',
    icon: Package,
    color: 'orange',
    description: 'Weather damage to materials or supplies',
    smartPrompts: [
      "Wind damaged roofing materials",
      "Rain got into stored drywall",
      "Concrete materials had to be protected"
    ]
  },
  SAFETY_INCIDENT: {
    title: 'Safety Incident',
    icon: Shield,
    color: 'red',
    description: 'Injury, near-miss, or safety concern',
    smartPrompts: [
      "Worker slipped on wet surface",
      "Near miss with equipment",
      "Safety stand-down due to conditions"
    ]
  },
  EQUIPMENT_ISSUE: {
    title: 'Equipment Issue',
    icon: Wrench,
    color: 'purple',
    description: 'Equipment breakdown or unavailability',
    smartPrompts: [
      "Excavator broke down",
      "Crane rental didn't show up",
      "Generator failed during storm"
    ]
  },
  ACCESS_ISSUE: {
    title: 'Site Access',
    icon: Truck,
    color: 'amber',
    description: 'Unable to access site or deliver materials',
    smartPrompts: [
      "Road flooded, couldn't get to site",
      "Material delivery delayed due to weather",
      "Utility outage prevented work"
    ]
  },
  WORKFORCE: {
    title: 'Workforce Issue',
    icon: Users,
    color: 'green',
    description: 'Crew availability or productivity issues',
    smartPrompts: [
      "Half the crew couldn't make it due to road conditions",
      "Subcontractor didn't show up",
      "Crew sent home early due to conditions"
    ]
  }
}

// AI parsing functions
function parseNaturalLanguage(input: string) {
  const result: any = {
    dates: [],
    times: [],
    weatherConditions: [],
    activities: [],
    crew: [],
    equipment: [],
    actions: [],
    costs: []
  }

  // Parse dates (today, yesterday, Monday, March 15, etc.)
  const datePatterns = [
    /today/i,
    /yesterday/i,
    /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/i,
    /\d{1,2}\/\d{1,2}/
  ]

  // Parse times
  const timePatterns = [
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i,
    /morning|afternoon|lunch|noon/i,
    /around \d{1,2}/i
  ]

  // Parse weather conditions
  const weatherKeywords = {
    rain: ['rain', 'raining', 'rainy', 'precipitation', 'downpour', 'drizzle'],
    wind: ['wind', 'windy', 'gusts', 'breezy', 'blowing'],
    cold: ['cold', 'freezing', 'frozen', 'frost', 'ice'],
    hot: ['hot', 'heat', 'warm'],
    lightning: ['lightning', 'thunder', 'storm'],
    snow: ['snow', 'snowing', 'blizzard']
  }

  // Parse activities
  const activityKeywords = [
    'concrete', 'pour', 'roofing', 'framing', 'excavation', 'painting',
    'drywall', 'siding', 'foundation', 'grading', 'paving', 'electrical',
    'plumbing', 'hvac', 'insulation', 'flooring'
  ]

  // Parse crew mentions
  const crewPatterns = [
    /sent (?:everyone|crew|them) home/i,
    /crew (?:couldn't|could not) (?:work|continue)/i,
    /(\d+) (?:guys|workers|people)/i,
    /half (?:the|my) crew/i
  ]

  // Extract information
  input.toLowerCase().split(/[.!?]/).forEach(sentence => {
    // Check dates
    datePatterns.forEach(pattern => {
      const match = sentence.match(pattern)
      if (match) result.dates.push(match[0])
    })

    // Check times
    timePatterns.forEach(pattern => {
      const match = sentence.match(pattern)
      if (match) result.times.push(match[0])
    })

    // Check weather
    Object.entries(weatherKeywords).forEach(([condition, keywords]) => {
      if (keywords.some(keyword => sentence.includes(keyword))) {
        result.weatherConditions.push(condition)
      }
    })

    // Check activities
    activityKeywords.forEach(activity => {
      if (sentence.includes(activity)) {
        result.activities.push(activity)
      }
    })

    // Check crew
    crewPatterns.forEach(pattern => {
      const match = sentence.match(pattern)
      if (match) result.crew.push(match[0])
    })
  })

  return result
}

// Convert parsed data to form values
function convertToFormData(parsed: any, type: string) {
  const formData: any = {
    documentationType: type,
    affectedCrew: [],
    affectedEquipment: [],
    photos: []
  }

  // Convert dates
  if (parsed.dates.length > 0) {
    const dateStr = parsed.dates[0]
    if (dateStr === 'today') {
      formData.date = new Date()
    } else if (dateStr === 'yesterday') {
      formData.date = new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
    // Add more date parsing logic
  }

  // Convert times
  if (parsed.times.length > 0) {
    const timeStr = parsed.times[0]
    if (timeStr.includes('morning')) {
      formData.startTime = '07:00'
    } else if (timeStr.includes('lunch')) {
      formData.startTime = '12:00'
    }
    // Add more time parsing logic
  }

  // Set weather conditions
  if (parsed.weatherConditions.length > 0) {
    formData.weatherCondition = parsed.weatherConditions.join(', ')
  }

  // Set activities
  if (parsed.activities.length > 0) {
    formData.activitiesAffected = parsed.activities
  }

  return formData
}

export function SmartDocumentationWizard({
  projectId,
  projects,
  crew,
  equipment,
  onComplete
}: SmartDocumentationWizardProps) {
  const [step, setStep] = useState<'type' | 'input' | 'review' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<string>('')
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [noaaData, setNoaaData] = useState<any>(null)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  // Process natural language input
  const processInput = async () => {
    setIsProcessing(true)
    
    // Parse the natural language
    const parsed = parseNaturalLanguage(naturalLanguageInput)
    setParsedData(parsed)
    
    // Convert to form data
    const data = convertToFormData(parsed, selectedType)
    setFormData(data)
    
    // If weather delay and date is identified, fetch NOAA data
    if (selectedType === 'WEATHER_DELAY' && data.date) {
      setFetchingWeather(true)
      try {
        // Fetch NOAA data for the date
        // This would call your NOAA service
        // const weather = await fetchNOAAData(projectId, data.date)
        // setNoaaData(weather)
      } catch (error) {
        console.error('Failed to fetch weather data:', error)
      }
      setFetchingWeather(false)
    }
    
    setIsProcessing(false)
    setStep('review')
  }

  // Smart activity selection based on weather
  const getAffectedActivities = (weatherType: string) => {
    const activityMap: Record<string, string[]> = {
      rain: ['Concrete Work', 'Roofing', 'Exterior Painting', 'Excavation', 'Site Grading'],
      wind: ['Crane Operations', 'Roofing', 'Siding', 'Scaffolding Work'],
      cold: ['Concrete Placement', 'Masonry', 'Painting', 'Asphalt Paving'],
      lightning: ['All Outdoor Work', 'Crane Operations', 'Roofing'],
      hot: ['Concrete Work', 'Asphalt Paving', 'Roofing']
    }
    return activityMap[weatherType] || []
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'type' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className={step === 'type' ? 'font-medium' : 'text-gray-500'}>
              Select Type
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'input' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className={step === 'input' ? 'font-medium' : 'text-gray-500'}>
              Describe Event
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className={step === 'review' ? 'font-medium' : 'text-gray-500'}>
              Review & Confirm
            </span>
          </div>
        </div>
        <Progress value={
          step === 'type' ? 33 : 
          step === 'input' ? 66 : 
          100
        } className="h-2" />
      </div>

      {/* Step 1: Select Documentation Type */}
      {step === 'type' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>What do you need to document?</CardTitle>
              <CardDescription>
                Select the type of event that affected your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(DOCUMENTATION_TYPES).map(([key, type]) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedType(key)
                        setStep('input')
                      }}
                      className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-lg ${
                        selectedType === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${type.color}-100`}>
                          <Icon className={`h-6 w-6 text-${type.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{type.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Natural Language Input */}
      {step === 'input' && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Describe what happened
                  </CardTitle>
                  <CardDescription>
                    Just tell us in your own words - we'll figure out the details
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('type')}
                >
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show example prompts */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Example phrases:
                </p>
                <div className="space-y-1">
                  {DOCUMENTATION_TYPES[selectedType as keyof typeof DOCUMENTATION_TYPES]?.smartPrompts.map((prompt, i) => (
                    <p key={i} className="text-sm text-blue-700 italic">
                      "{prompt}"
                    </p>
                  ))}
                </div>
              </div>

              {/* Input area */}
              <div className="space-y-2">
                <Label>Tell us what happened:</Label>
                <Textarea
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="Type or paste your description here..."
                  className="min-h-[150px]"
                />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mic className="h-4 w-4" />
                  <span>Voice input coming soon</span>
                </div>
              </div>

              {/* Quick date selection */}
              <div className="space-y-2">
                <Label>Or select dates manually:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDates([new Date()])}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDates([new Date(Date.now() - 24*60*60*1000)])}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Last 7 days
                      const dates = []
                      for (let i = 0; i < 7; i++) {
                        dates.push(new Date(Date.now() - i * 24*60*60*1000))
                      }
                      setSelectedDates(dates)
                    }}
                  >
                    This Week
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('details')
                  }}
                >
                  Manual Entry
                </Button>
                <Button
                  onClick={processInput}
                  disabled={!naturalLanguageInput || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Process Input
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review and Confirm */}
      {step === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review and confirm details</CardTitle>
                  <CardDescription>
                    We've extracted this information - please verify and adjust as needed
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('input')}
                >
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show what we understood */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>What we understood:</strong> {naturalLanguageInput}
                </AlertDescription>
              </Alert>

              {/* Parsed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                <div className="space-y-4">
                  <div>
                    <Label>Date(s) Affected</Label>
                    <div className="mt-2">
                      {parsedData?.dates.map((date: string, i: number) => (
                        <Badge key={i} variant="secondary" className="mr-2">
                          {date}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Time Period</Label>
                    <div className="mt-2">
                      {parsedData?.times.map((time: string, i: number) => (
                        <Badge key={i} variant="secondary" className="mr-2">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weather Conditions */}
                <div className="space-y-4">
                  <div>
                    <Label>Weather Conditions</Label>
                    <div className="mt-2">
                      {parsedData?.weatherConditions.map((condition: string, i: number) => (
                        <Badge key={i} className="mr-2">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* NOAA Verification */}
                  {fetchingWeather ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching NOAA weather data...
                    </div>
                  ) : noaaData ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <strong>NOAA Verified:</strong> {noaaData.summary}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              </div>

              {/* Activities Affected */}
              <div>
                <Label>Activities Affected</Label>
                <div className="mt-2 space-y-2">
                  {getAffectedActivities(parsedData?.weatherConditions[0] || 'rain').map((activity) => (
                    <label key={activity} className="flex items-center gap-2">
                      <Checkbox defaultChecked />
                      <span>{activity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Crew Selection */}
              <div>
                <Label className="flex items-center gap-1">
                  Crew Members Affected
                  <InfoTooltip content={INSURANCE_GUIDANCE.crew.documentation} />
                </Label>
                <div className="mt-2 space-y-2">
                  {crew.filter(c => c.project_id === projectId).map((member) => (
                    <label key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Checkbox defaultChecked />
                        <div>
                          <p className="font-medium">{member.name} - {member.role}</p>
                          <p className="text-sm text-gray-600">
                            ${member.hourly_rate}/hr × 1.35 burden = ${(member.hourly_rate * 1.35).toFixed(2)}/hr
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(member.hourly_rate * 1.35 * 8).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">8 hours</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Equipment Selection */}
              <div>
                <Label className="flex items-center gap-1">
                  Equipment Idled
                  <InfoTooltip content={INSURANCE_GUIDANCE.equipment.documentation} />
                </Label>
                <div className="mt-2 space-y-2">
                  {equipment.filter(e => e.project_id === projectId).map((item) => (
                    <label key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Checkbox defaultChecked />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Standby: ${item.standby_rate}/hr 
                            {item.is_rented && <Badge variant="destructive" className="ml-2">Rented</Badge>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.standby_rate * 8).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">8 hours</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <DollarSign className="inline h-4 w-4" />
                  Estimated Total: <span className="font-bold text-lg">${formData.totalCost || '0'}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('details')}>
                    Edit Details
                  </Button>
                  <Button onClick={() => {
                    // Submit the documentation
                    onComplete?.()
                  }}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button variant="outline" size="sm">
                  <Camera className="mr-2 h-4 w-4" />
                  Add Photos
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Add Notes
                </Button>
                <Button variant="outline" size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Costs
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Adjust Time
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}