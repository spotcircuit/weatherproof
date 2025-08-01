'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  CalendarDays,
  Clock,
  CloudRain,
  Wind,
  Thermometer,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Wrench,
  DollarSign,
  Loader2,
  Info,
  Calendar as CalendarIcon,
  Zap,
  FileText,
  ArrowLeft,
  Cloud,
  Save
} from 'lucide-react'
import { format, parse, startOfDay, subDays, isWithinInterval } from 'date-fns'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { INSURANCE_GUIDANCE } from '@/lib/insurance-guidance'
import { useToast } from '@/hooks/use-toast'
import { parseDelayDescription } from '@/services/n8n-delay-parser'
import { CrewEquipmentSelector } from '@/components/crew-equipment-selector'
import { Separator } from '@/components/ui/separator'
import { n8nWebhooks } from '@/lib/n8n-helpers'
import { fetchRealtimeWeather, formatWeatherForDisplay, getWeatherImpactSummary } from '@/lib/weather-realtime'

interface Props {
  projects: any[]
  defaultProjectId?: string | null
  onComplete?: () => void
}

interface ProjectAssignments {
  crew: any[]
  equipment: any[]
  loaded: boolean
}

// Weather emoji map
const WEATHER_ICONS: Record<string, string> = {
  rain: '🌧️',
  wind: '💨',
  cold: '❄️',
  hot: '🌡️',
  lightning: '⚡',
  snow: '🌨️',
  clear: '☀️',
  cloudy: '☁️'
}

// Time parsing helpers
const TIME_MAPPINGS: Record<string, string> = {
  'morning': '07:00',
  'lunch': '12:00',
  'noon': '12:00',
  'afternoon': '13:00',
  'evening': '17:00',
  'all day': '07:00-15:30'
}

// Activity mappings - Based on ACORD construction classifications
const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  // ACORD Primary Classifications
  'Concrete Work': ['concrete', 'pour', 'placement', 'foundation', 'slab', 'footer'],
  'Carpentry': ['framing', 'frame', 'studs', 'joists', 'trusses', 'carpentry'],
  'Roofing': ['roof', 'shingle', 'roofing', 'flashing', 'membrane'],
  'Excavation': ['excavation', 'digging', 'trenching', 'grading', 'earthwork'],
  'Masonry': ['brick', 'block', 'mortar', 'masonry', 'stone'],
  'Electrical': ['electrical', 'wiring', 'conduit', 'panel', 'electric'],
  'Plumbing': ['plumbing', 'pipe', 'drain', 'water', 'sewer'],
  'HVAC': ['hvac', 'heating', 'cooling', 'ventilation', 'ductwork', 'mechanical'],
  'Steel Erection': ['steel', 'structural steel', 'iron work', 'metal deck'],
  'Drywall': ['drywall', 'sheetrock', 'gypsum', 'taping', 'interior walls'],
  'Painting': ['paint', 'coating', 'finishing', 'stain'],
  'Flooring': ['flooring', 'tile', 'carpet', 'hardwood', 'vinyl'],
  'Site Work': ['site work', 'grading', 'utilities', 'paving', 'landscaping']
}

// Weather to activity mappings - which activities are affected by which weather
const WEATHER_ACTIVITY_IMPACTS: Record<string, string[]> = {
  'Rain': [
    'Concrete Work',
    'Roofing',
    'Site Work',
    'Excavation',
    'Masonry',
    'Painting',
    'Drywall', // Moisture affects drywall
    'Flooring' // Many flooring types affected by moisture
  ],
  'Heavy Rain': [
    'Concrete Work',
    'Roofing',
    'Site Work',
    'Excavation',
    'Masonry',
    'Painting',
    'Carpentry', // Heavy rain affects framing
    'Steel Erection', // Unsafe in heavy rain
    'Electrical', // Outdoor electrical work
    'Plumbing', // Outdoor plumbing work
    'Drywall',
    'Flooring'
  ],
  'Wind': [
    'Roofing',
    'Carpentry',
    'Steel Erection'
  ],
  'High Winds': [
    'Roofing',
    'Carpentry',
    'Steel Erection',
    'Concrete Work', // Can't pour in high winds
    'Masonry', // Can't lay block/brick safely
    'HVAC' // Rooftop units
  ],
  'Lightning': [
    // Lightning affects ALL outdoor activities
    'Concrete Work',
    'Carpentry',
    'Roofing',
    'Excavation',
    'Masonry',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Steel Erection',
    'Site Work'
  ],
  'Cold': [
    'Concrete Work', // Can't pour below 40°F
    'Masonry', // Mortar won't set
    'Painting', // Paint won't cure properly
    'Flooring', // Adhesives affected
    'Site Work' // Paving/asphalt affected
  ],
  'Snow': [
    'Roofing',
    'Excavation',
    'Site Work',
    'Concrete Work',
    'Masonry',
    'Carpentry' // Snow load and visibility
  ]
}

// Helper to calculate duration from time strings
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return (endMinutes - startMinutes) / 60
}

export function SmartDelayDocumentation({ projects, defaultProjectId, onComplete }: Props) {
  const { toast } = useToast()
  const supabase = createClient()
  
  // State
  const [step, setStep] = useState<'select-dates' | 'describe' | 'review'>('select-dates')
  const [selectedProject, setSelectedProject] = useState(defaultProjectId || projects[0]?.id || '')
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [description, setDescription] = useState('')
  const [parsedData, setParsedData] = useState<any>({})
  const [weatherData, setWeatherData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [originalDescription, setOriginalDescription] = useState('')
  const [documentMode, setDocumentMode] = useState<'individual' | 'period'>('individual')
  const [projectActivities, setProjectActivities] = useState<string[]>([])
  const [fetchingWeather, setFetchingWeather] = useState(false)
  const [noaaWeatherData, setNoaaWeatherData] = useState<any>(null)
  
  // Cache for crew and equipment data
  const [projectAssignmentsCache, setProjectAssignmentsCache] = useState<Record<string, ProjectAssignments>>({})
  
  // Load historical weather data, project activities, and crew/equipment
  useEffect(() => {
    if (selectedProject) {
      loadHistoricalWeather()
      loadProjectActivities()
      loadProjectAssignments()
    }
  }, [selectedProject])

  const loadHistoricalWeather = async () => {
    const project = projects.find(p => p.id === selectedProject)
    if (!project) return

    const thirtyDaysAgo = subDays(new Date(), 30)
    
    // Fetch weather readings for the past 30 days
    const { data } = await supabase
      .from('project_weather')
      .select('*')
      .eq('project_id', selectedProject)
      .gte('collected_at', thirtyDaysAgo.toISOString())
      .order('collected_at', { ascending: false })

    if (data) {
      // Group by date
      const weatherByDate: Record<string, any> = {}
      data.forEach(reading => {
        const date = format(new Date(reading.collected_at), 'yyyy-MM-dd')
        if (!weatherByDate[date] || new Date(reading.collected_at) > new Date(weatherByDate[date].collected_at)) {
          weatherByDate[date] = reading
        }
      })
      setWeatherData(weatherByDate)
    }
  }

  const loadProjectActivities = async () => {
    if (!selectedProject) {
      console.log('No project selected, using default activities')
      setProjectActivities(Object.keys(ACTIVITY_KEYWORDS))
      return
    }

    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('activity_name')
        .eq('project_id', selectedProject)
        .eq('is_active', true)
        .order('activity_name')

      if (error) {
        console.error('Error loading project activities:', error)
        console.error('Project ID:', selectedProject)
        // Fall back to default activities if no project activities
        setProjectActivities(Object.keys(ACTIVITY_KEYWORDS))
      } else if (data && data.length > 0) {
        // Use project-specific activities
        console.log('Loaded project activities:', data)
        setProjectActivities(data.map(a => a.activity_name))
      } else {
        // No activities found, use defaults
        console.log('No project activities found for project:', selectedProject)
        console.log('Using default activities')
        setProjectActivities(Object.keys(ACTIVITY_KEYWORDS))
      }
    } catch (error) {
      console.error('Error in loadProjectActivities:', error)
      setProjectActivities(Object.keys(ACTIVITY_KEYWORDS))
    }
  }
  
  const loadProjectAssignments = async () => {
    if (!selectedProject) return
    
    // Check if we already have cached data for this project
    if (projectAssignmentsCache[selectedProject]?.loaded) {
      console.log('Using cached crew/equipment data for project:', selectedProject)
      return
    }
    
    console.log('Loading crew and equipment assignments for project:', selectedProject)
    
    try {
      // Load crew and equipment in parallel with error handling
      const [crewResponse, equipmentResponse] = await Promise.allSettled([
        supabase
          .from('project_crew_assignments')
          .select(`
            *,
            crew_members (
              id,
              name,
              role,
              hourly_rate,
              active
            )
          `)
          .eq('project_id', selectedProject),
        
        supabase
          .from('project_equipment_assignments')
          .select(`
            *,
            equipment (
              id,
              name,
              type,
              daily_rate,
              standby_rate,
              active
            )
          `)
          .eq('project_id', selectedProject)
      ])
      
      let crew = []
      let equipment = []
      let hasErrors = false
      
      // Handle crew response
      if (crewResponse.status === 'fulfilled') {
        const { data, error } = crewResponse.value
        if (error) {
          console.error('Error loading crew:', error)
          hasErrors = true
        } else {
          crew = data || []
        }
      } else {
        console.error('Failed to load crew - connection error')
        hasErrors = true
      }
      
      // Handle equipment response
      if (equipmentResponse.status === 'fulfilled') {
        const { data, error } = equipmentResponse.value
        if (error) {
          console.error('Error loading equipment:', error)
          hasErrors = true
        } else {
          equipment = data || []
        }
      } else {
        console.error('Failed to load equipment - connection error')
        hasErrors = true
      }
      
      // Cache the data even if there were errors
      setProjectAssignmentsCache(prev => ({
        ...prev,
        [selectedProject]: {
          crew,
          equipment,
          loaded: true
        }
      }))
      
      console.log('Cached crew/equipment data:', {
        crewCount: crew.length,
        equipmentCount: equipment.length
      })
      
      // Show toast if there were errors
      if (hasErrors) {
        toast({
          title: "Connection Issue",
          description: "Unable to load crew/equipment data. Please check your connection.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading project assignments:', error)
      
      // Cache empty data to prevent repeated attempts
      setProjectAssignmentsCache(prev => ({
        ...prev,
        [selectedProject]: {
          crew: [],
          equipment: [],
          loaded: true
        }
      }))
      
      toast({
        title: "Loading Error",
        description: "Failed to load crew and equipment data.",
        variant: "destructive"
      })
    }
  }

  // Parse natural language description
  const parseDescription = async (text: string, date: Date) => {
    setLoading(true)
    try {
      // Try AI parsing first
      const aiResult = await parseDelayDescription(text, date)
      
      // Convert AI result to our format
      console.log('Raw AI Response:', aiResult)
      
      // Check if aiResult has the expected structure
      console.log('AI Result structure:', {
        directTimes: aiResult?.times,
        fullResult: aiResult
      })
      
      // Handle both direct response and wrapped response
      const responseData = aiResult
      
      const result = {
        startTime: responseData.times?.start || '',
        endTime: responseData.times?.end || '',
        weatherConditions: responseData.weather?.conditions || [],
        activities: responseData.activities || [],
        crewNotes: responseData.summary || text,
        actions: [] as string[],
        equipment: responseData.equipment || [],
        materials: responseData.materials || {},
        safety: responseData.safety || [],
        duration: responseData.duration,
        questions: responseData.questions || [],
        confidence: responseData.confidence || 100,
        summary: responseData.summary || ''
      }
      
      // Calculate end time if we have start time and duration but no end time
      if (result.startTime && result.duration && !result.endTime) {
        const startParts = result.startTime.split(':')
        if (startParts.length === 2) {
          const startHour = parseInt(startParts[0])
          const startMinute = parseInt(startParts[1])
          const totalMinutes = startHour * 60 + startMinute + (result.duration * 60)
          const endHour = Math.floor(totalMinutes / 60) % 24
          const endMinute = totalMinutes % 60
          result.endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
        }
      }
      
      // Also check the text for specific time mentions that might be the end time
      const lowerText = text.toLowerCase()
      
      // Parse duration if not already set
      if (!result.duration) {
        const durationPatterns = [
          /(?:worked|lasted?)\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*hours?/i,
          /(?:only\s+)?(?:got\s+)?(\d+(?:\.\d+)?)\s*hours?\s+(?:of\s+)?work/i,
          /(\d+(?:\.\d+)?)\s*hours?\s+(?:of\s+)?(?:work|working)/i
        ]
        
        for (const pattern of durationPatterns) {
          const match = text.match(pattern)
          if (match) {
            result.duration = parseFloat(match[1])
            break
          }
        }
      }
      
      // First, look for start time patterns if AI didn't get it
      if (!result.startTime) {
        const startTimePatterns = [
          /(?:started|began|commenced)\s+(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
          /(?:crew|we|work)\s+(?:started|began)\s+(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
          /^(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)/i
        ]
        
        for (const pattern of startTimePatterns) {
          const match = text.match(pattern)
          if (match) {
            const hour = parseInt(match[1])
            const minute = match[2] || '00'
            const meridiem = match[3].toLowerCase()
            const hour24 = meridiem === 'pm' && hour !== 12 ? hour + 12 : (meridiem === 'am' && hour === 12 ? 0 : hour)
            result.startTime = `${hour24.toString().padStart(2, '0')}:${minute}`
            break
          }
        }
      }
      
      // Look for patterns like "until 10am", "stopped at 10am", "by 10am"
      const endTimePatterns = [
        /until\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
        /stopped?\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
        /by\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
        /(?:weather|wind|rain|storm)\s+(?:started|began|begin|hit)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
        /(?:heavy\s+)?(?:wind|rain|storm)s?\s+(?:and\s+(?:wind|rain|storm)s?\s+)?(?:started|began|begin|hit)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i
      ]
      
      for (const pattern of endTimePatterns) {
        const match = text.match(pattern)
        if (match) {
          const hour = parseInt(match[1])
          const minute = match[2] || '00'
          const meridiem = match[3].toLowerCase()
          const hour24 = meridiem === 'pm' && hour !== 12 ? hour + 12 : (meridiem === 'am' && hour === 12 ? 0 : hour)
          const endTime = `${hour24.toString().padStart(2, '0')}:${minute}`
          
          // If this looks like a weather start time and we have a work start time, use it as end time
          if (pattern.toString().includes('weather|wind|rain|storm') && result.startTime && result.startTime !== endTime) {
            result.endTime = endTime
          } else if (!result.endTime) {
            result.endTime = endTime
          }
          break
        }
      }
      
      // Recalculate end time if we now have duration but still no end time
      if (result.startTime && result.duration && !result.endTime) {
        const startParts = result.startTime.split(':')
        if (startParts.length === 2) {
          const startHour = parseInt(startParts[0])
          const startMinute = parseInt(startParts[1])
          const totalMinutes = startHour * 60 + startMinute + (result.duration * 60)
          const endHour = Math.floor(totalMinutes / 60) % 24
          const endMinute = totalMinutes % 60
          result.endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
        }
      }

      // Add crew actions
      if (responseData.crew?.action) {
        if (responseData.crew.action.includes('sent home')) {
          result.actions.push('Crew sent home')
        } else if (responseData.crew.action === 'stood down') {
          result.actions.push('Crew stood down')
        } else {
          result.actions.push(`Crew ${responseData.crew.action}`)
        }
      }

      // Add material actions
      if (responseData.materials?.protected) {
        result.actions.push('Materials protected')
      }
      if (responseData.materials?.damaged) {
        result.actions.push('Materials damaged')
      }
      
      // Add safety concerns
      if (responseData.safety && responseData.safety.length > 0) {
        result.actions.push('Safety concerns: ' + responseData.safety.join(', '))
      }
      
      // Final check: if start and end time are the same and it looks like a weather event time, fix it
      if (result.startTime && result.startTime === result.endTime) {
        // Check if the text mentions an earlier start time
        const allTimeMatches = [...text.matchAll(/(\d{1,2}):?(\d{2})?\s*(am|pm)/gi)]
        if (allTimeMatches.length >= 2) {
          // Convert first time match to 24-hour format
          const firstMatch = allTimeMatches[0]
          const hour = parseInt(firstMatch[1])
          const minute = firstMatch[2] || '00'
          const meridiem = firstMatch[3].toLowerCase()
          const hour24 = meridiem === 'pm' && hour !== 12 ? hour + 12 : (meridiem === 'am' && hour === 12 ? 0 : hour)
          const firstTime = `${hour24.toString().padStart(2, '0')}:${minute}`
          
          // If the first time is different from what we have, use it as start time
          if (firstTime !== result.startTime) {
            result.startTime = firstTime
          }
        }
      }
      
      console.log('Mapped Result:', result)

      return result
    } catch (error) {
      console.error('Error parsing with AI:', error)
      // Fallback to original regex parsing
      return parseDescriptionFallback(text)
    } finally {
      setLoading(false)
    }
  }

  // Fallback regex parsing (original code)
  const parseDescriptionFallback = (text: string) => {
    const result: any = {
      startTime: '',
      endTime: '',
      weatherConditions: [],
      activities: [],
      crewNotes: '',
      actions: []
    }

    const lowerText = text.toLowerCase()

    // Parse times
    Object.entries(TIME_MAPPINGS).forEach(([keyword, time]) => {
      if (lowerText.includes(keyword)) {
        if (keyword === 'all day') {
          const [start, end] = time.split('-')
          result.startTime = start
          result.endTime = end
        } else if (!result.startTime) {
          result.startTime = time
        }
      }
    })

    // Look for specific time patterns (10am, 2:30pm, etc)
    const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)/gi
    const timeMatches = [...text.matchAll(timeRegex)]
    timeMatches.forEach((match, index) => {
      const hour = parseInt(match[1])
      const minute = match[2] || '00'
      const meridiem = match[3].toLowerCase()
      const hour24 = meridiem === 'pm' && hour !== 12 ? hour + 12 : (meridiem === 'am' && hour === 12 ? 0 : hour)
      const timeStr = `${hour24.toString().padStart(2, '0')}:${minute}`
      
      if (index === 0) result.startTime = timeStr
      else if (index === 1) result.endTime = timeStr
    })

    // Parse weather conditions
    const weatherKeywords = {
      'Heavy Rain': ['heavy rain', 'downpour', 'torrential'],
      'Rain': ['rain', 'drizzle', 'showers', 'precipitation'],
      'High Winds': ['high wind', 'strong wind', 'gusts', 'gusty'],
      'Wind': ['wind', 'breezy', 'windy'],
      'Lightning': ['lightning', 'thunder', 'storm'],
      'Cold': ['cold', 'freezing', 'frost', 'ice'],
      'Snow': ['snow', 'blizzard', 'flurries']
    }

    Object.entries(weatherKeywords).forEach(([condition, keywords]) => {
      if (keywords.some(kw => lowerText.includes(kw))) {
        result.weatherConditions.push(condition)
      }
    })

    // Parse activities
    Object.entries(ACTIVITY_KEYWORDS).forEach(([activity, keywords]) => {
      if (keywords.some(kw => lowerText.includes(kw))) {
        result.activities.push(activity)
      }
    })

    // Parse crew actions
    if (lowerText.includes('sent') && (lowerText.includes('home') || lowerText.includes('crew'))) {
      result.actions.push('Crew sent home')
      if (!result.endTime && result.startTime) {
        // If they mention sending crew home but no end time, assume current time
        result.endTime = format(new Date(), 'HH:mm')
      }
    }

    if (lowerText.includes('tarp') || lowerText.includes('protect') || lowerText.includes('cover')) {
      result.actions.push('Materials protected')
    }

    // Extract the full text as notes
    result.crewNotes = text

    return result
  }

  // Handle moving to next step
  const handleDateSelection = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Select dates",
        description: "Please select at least one date to document",
        variant: "destructive"
      })
      return
    }
    setStep('describe')
    setCurrentDateIndex(0)
  }

  // Handle description submission
  const handleDescriptionSubmit = async () => {
    setLoading(true)
    try {
      // Build enhanced description with date context
      let enhancedDescription = description
      
      if (documentMode === 'period' && selectedDates.length > 1) {
        // Add period context
        const startDate = format(selectedDates[selectedDates.length - 1], 'EEEE, MMMM d')
        const endDate = format(selectedDates[0], 'EEEE, MMMM d')
        enhancedDescription = `During the period from ${startDate} to ${endDate}: ${description}`
      } else {
        // Add single date context
        const currentDate = format(selectedDates[currentDateIndex], 'EEEE, MMMM d')
        enhancedDescription = `On ${currentDate}: ${description}`
      }
      
      console.log('Parsing enhanced description:', enhancedDescription)
      
      const parsed = await parseDescription(enhancedDescription, selectedDates[currentDateIndex])
      
      console.log('Parsed result:', parsed)
      
      // Make sure we have the parsed data before proceeding
      if (!parsed) {
        throw new Error('No parsed data returned')
      }
      
      setParsedData(parsed)
      setOriginalDescription(description)
      
      // If confidence is low or there are questions, show them
      if ((parsed.confidence && parsed.confidence < 80) || (parsed.questions && parsed.questions.length > 0)) {
        setShowQuestions(true)
      }
      
      // Only move to review after state is set
      setStep('review')
    } catch (error) {
      console.error('Error in handleDescriptionSubmit:', error)
      toast({
        title: "Error",
        description: "Failed to parse description. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Handle resubmit with better description
  const handleResubmit = async () => {
    // Build an enhanced description with the parsed info
    const enhancedDescription = buildEnhancedDescription()
    setDescription(enhancedDescription)
    setShowQuestions(false)
    setStep('describe')
  }
  
  // Build enhanced description from parsed data
  const buildEnhancedDescription = () => {
    let enhanced = originalDescription
    
    // Add a separator
    enhanced += "\n\n"
    
    // Add specific prompts based on what's missing
    const prompts: string[] = []
    
    if (parsedData.questions?.length > 0) {
      parsedData.questions.forEach((q: string) => {
        if (q.toLowerCase().includes('time') && q.toLowerCase().includes('end')) {
          prompts.push("Work ended at [TIME].")
        } else if (q.toLowerCase().includes('crew')) {
          prompts.push("[NUMBER] crew members were affected.")
        } else if (q.toLowerCase().includes('equipment')) {
          prompts.push("Equipment affected: [LIST EQUIPMENT].")
        } else if (q.toLowerCase().includes('material')) {
          prompts.push("Materials were [protected with tarps / moved inside / damaged].")
        } else if (q.toLowerCase().includes('resume')) {
          prompts.push("Work [resumed at TIME / did not resume].")
        } else {
          // Generic prompt for other questions
          prompts.push(`${q} [YOUR ANSWER]`)
        }
      })
    }
    
    return enhanced + prompts.join(' ')
  }

  // Fetch NOAA weather data via n8n
  const fetchNOAAWeather = async () => {
    const project = projects.find(p => p.id === selectedProject)
    if (!project || !project.latitude || !project.longitude) {
      toast({
        title: "Location required",
        description: "This project doesn't have GPS coordinates. Please update the project settings.",
        variant: "destructive"
      })
      return
    }

    setFetchingWeather(true)
    try {
      // Use the new fetchProjectWeather for comprehensive weather data
      const result = await n8nWebhooks.fetchProjectWeather({
        projectId: project.id,
        latitude: project.latitude,
        longitude: project.longitude,
        requestType: 'realtime',
        includeAlerts: true,
        includeHourly: false,
        storeResult: false // Don't store real-time lookups in delay documentation
      })

      if (result.success && result.data) {
        setNoaaWeatherData(result.data)
        
        // Auto-populate weather conditions based on NOAA data
        const conditions: string[] = []
        
        if (result.data.precipitation_amount > 0.1) {
          conditions.push(result.data.precipitation_amount > 0.5 ? 'Heavy Rain' : 'Rain')
        }
        if (result.data.wind_speed > 15) {
          conditions.push(result.data.wind_speed > 25 ? 'High Winds' : 'Wind')
        }
        if (result.data.temperature < 40) {
          conditions.push('Cold')
        }
        if (result.data.conditions?.includes('snow')) {
          conditions.push('Snow')
        }
        if (result.data.conditions?.includes('thunder') || result.data.conditions?.includes('lightning')) {
          conditions.push('Lightning')
        }
        
        // Update parsed data with NOAA conditions
        setParsedData((prev: any) => ({
          ...prev,
          weatherConditions: [...new Set([...(prev.weatherConditions || []), ...conditions])],
          noaaData: result.data
        }))
        
        toast({
          title: "Weather data fetched",
          description: `NOAA: ${result.data.conditions.join(', ')}, ${result.data.temperature}°F`
        })
      } else {
        toast({
          title: "Weather fetch failed",
          description: result.error || "Unable to fetch NOAA weather data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('NOAA fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFetchingWeather(false)
    }
  }

  // Save delay to database
  const saveDelay = async (dateIndex: number) => {
    setSaving(true)
    
    // Log current state for debugging
    console.log('Saving delay with data:', {
      dateIndex,
      selectedDate: selectedDates[dateIndex],
      parsedData,
      selectedProject,
      description
    })
    
    const date = selectedDates[dateIndex]
    const project = projects.find(p => p.id === selectedProject)
    
    if (!project) {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive"
      })
      setSaving(false)
      return
    }
    
    // Validate required fields
    if (!parsedData.startTime) {
      toast({
        title: "Missing start time",
        description: "Please enter when the delay started",
        variant: "destructive"
      })
      setSaving(false)
      return
    }
    
    if (!parsedData.weatherConditions || parsedData.weatherConditions.length === 0) {
      toast({
        title: "Missing weather conditions",
        description: "Please select at least one weather condition",
        variant: "destructive"
      })
      setSaving(false)
      return
    }

    try {
      // Combine date with parsed times
      const startDateTime = new Date(date)
      const endDateTime = new Date(date)
      
      if (parsedData.startTime) {
        const [hours, minutes] = parsedData.startTime.split(':')
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      }
      
      if (parsedData.endTime) {
        const [hours, minutes] = parsedData.endTime.split(':')
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      }

      // Calculate duration
      let durationHours = parsedData.endTime 
        ? (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
        : null
      
      // If duration is 0 or negative (due to same start/end times), use parsed duration
      if ((durationHours === 0 || durationHours === null || durationHours < 0) && parsedData.duration) {
        durationHours = parsedData.duration
      }
      
      // If still no duration but we have affected crew/equipment, use their hours
      if (!durationHours && parsedData.affectedCrew?.length > 0) {
        durationHours = parsedData.affectedCrew[0].hours_idled || 8
      }
      
      // Check if weather thresholds were violated
      const weatherReading = weatherData[format(date, 'yyyy-MM-dd')]
      let thresholdViolated = false
      
      if (project.weather_thresholds && weatherReading) {
        // Check each threshold
        if (project.weather_thresholds.wind_speed_mph && 
            weatherReading.wind_speed > project.weather_thresholds.wind_speed_mph) {
          thresholdViolated = true
        }
        if (project.weather_thresholds.precipitation_inches && 
            weatherReading.precipitation > project.weather_thresholds.precipitation_inches) {
          thresholdViolated = true
        }
        if (project.weather_thresholds.temperature_low_f && 
            weatherReading.temperature < project.weather_thresholds.temperature_low_f) {
          thresholdViolated = true
        }
        if (project.weather_thresholds.temperature_high_f && 
            weatherReading.temperature > project.weather_thresholds.temperature_high_f) {
          thresholdViolated = true
        }
      }
      
      // Log the date/time values for debugging
      console.log('Date/time values:', {
        date: format(date, 'yyyy-MM-dd'),
        startTime: parsedData.startTime,
        endTime: parsedData.endTime,
        startDateTime: startDateTime.toISOString(),
        endDateTime: parsedData.endTime ? endDateTime.toISOString() : null,
        durationHours
      })

      // Create delay event
      const { data: delay, error: delayError } = await supabase
        .from('delay_events')
        .insert({
          project_id: selectedProject,
          start_time: startDateTime.toISOString(),
          end_time: parsedData.endTime ? endDateTime.toISOString() : null,
          duration_hours: durationHours || parsedData.duration || null,
          weather_condition: parsedData.weatherConditions.join(', '),
          temperature: weatherData[format(date, 'yyyy-MM-dd')]?.temperature,
          wind_speed: weatherData[format(date, 'yyyy-MM-dd')]?.wind_speed,
          precipitation: weatherData[format(date, 'yyyy-MM-dd')]?.precipitation,
          activities_affected: parsedData.activities || [],
          supervisor_notes: parsedData.crewNotes || parsedData.summary || description || 'No notes provided',
          verified: !!weatherData[format(date, 'yyyy-MM-dd')],
          total_cost: 0, // Will be updated after crew/equipment are saved
          threshold_violated: thresholdViolated
        })
        .select()
        .single()

      if (delayError) {
        console.error('Supabase delay_events insert error:', delayError)
        throw new Error(`Failed to create delay event: ${delayError.message}`)
      }

      // Save affected crew if selected
      if (parsedData.affectedCrew && parsedData.affectedCrew.length > 0 && delay) {
        const crewInserts = parsedData.affectedCrew.map((crew: any) => ({
          delay_event_id: delay.id,
          crew_member_id: crew.crew_member_id,
          hours_idled: crew.hours_idled,
          hourly_rate: crew.hourly_rate,
          burden_rate: crew.burden_rate,
          total_cost: crew.total_cost
        }))

        const { error: crewInsertError } = await supabase
          .from('delay_crew_affected')
          .insert(crewInserts)
        
        if (crewInsertError) {
          console.error('Error adding crew to delay:', crewInsertError)
        }
      }
      
      // Save affected equipment if selected
      if (parsedData.affectedEquipment && parsedData.affectedEquipment.length > 0 && delay) {
        const equipmentInserts = parsedData.affectedEquipment.map((equip: any) => ({
          delay_event_id: delay.id,
          equipment_id: equip.equipment_id,
          hours_idled: equip.hours_idled,
          standby_rate: equip.hourly_rate, // Map hourly_rate to standby_rate
          is_rented: false // Default to false, could be enhanced later
        }))

        const { error: equipmentInsertError } = await supabase
          .from('delay_equipment_affected')
          .insert(equipmentInserts)
        
        if (equipmentInsertError) {
          console.error('Error adding equipment to delay:', equipmentInsertError)
        }
      }
      
      // Calculate total cost from crew and equipment
      const totalCrewCost = parsedData.affectedCrew?.reduce((sum: number, c: any) => sum + c.total_cost, 0) || 0
      const totalEquipmentCost = parsedData.affectedEquipment?.reduce((sum: number, e: any) => sum + e.total_cost, 0) || 0
      const totalCost = totalCrewCost + totalEquipmentCost
      
      // Update delay event with total cost and breakdown
      if (delay) {
        const updateData: any = {
          total_cost: totalCost,
          computed_labor_cost: totalCrewCost,
          computed_equipment_cost: totalEquipmentCost,
          computed_total_cost: totalCost,
          crew_size: parsedData.affectedCrew?.length || 0,
          equipment_idle_cost: totalEquipmentCost,
          cost_breakdown: {
            labor: totalCrewCost,
            equipment: totalEquipmentCost,
            total: totalCost,
            crew_details: parsedData.affectedCrew?.map((c: any) => ({
              name: c.name,
              role: c.role,
              hours: c.hours_idled,
              rate: c.hourly_rate,
              burden: c.burden_rate,
              cost: c.total_cost
            })) || [],
            equipment_details: parsedData.affectedEquipment?.map((e: any) => ({
              name: e.name,
              type: e.type,
              hours: e.hours_idled,
              rate: e.hourly_rate,
              cost: e.total_cost
            })) || []
          }
        }
        
        const { error: updateError } = await supabase
          .from('delay_events')
          .update(updateData)
          .eq('id', delay.id)
          
        if (updateError) {
          console.error('Error updating delay costs:', updateError)
        }
      }

      toast({
        title: "Delay documented",
        description: `Successfully saved delay for ${format(date, 'MMM d, yyyy')}`
      })

      // Move to next date or complete
      if (dateIndex < selectedDates.length - 1) {
        setCurrentDateIndex(dateIndex + 1)
        setDescription('')
        setParsedData({})
        setStep('describe')
      } else {
        onComplete?.()
      }

    } catch (error: any) {
      console.error('Error saving delay:', error)
      const errorMessage = error?.message || error?.error || 'Unknown error occurred'
      
      toast({
        title: "Error saving delay",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Log detailed error info
      console.error('Delay save error details:', {
        error,
        errorMessage,
        projectId: selectedProject,
        date: selectedDates[dateIndex],
        parsedData
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Document Weather Delays</h2>
        <div className="flex items-center gap-2">
          <Badge variant={step === 'select-dates' ? 'default' : 'secondary'}>
            1. Select Dates
          </Badge>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === 'describe' ? 'default' : 'secondary'}>
            2. Describe Delays
          </Badge>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === 'review' ? 'default' : 'secondary'}>
            3. Review & Save
          </Badge>
        </div>
      </div>

      {/* Step 1: Select Project and Dates */}
      {step === 'select-dates' && (
        <div className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Selection with Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Select Delay Dates
              </CardTitle>
              <CardDescription>
                Click on dates that had weather delays. We'll show historical weather data where available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick date selection */}
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
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
                    onClick={() => setSelectedDates([subDays(new Date(), 1)])}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Last 3 days is more realistic
                      const dates = []
                      for (let i = 0; i < 3; i++) {
                        dates.push(subDays(new Date(), i))
                      }
                      setSelectedDates(dates)
                    }}
                  >
                    Last 3 Days
                  </Button>
                </div>
                
                {/* Warning for multiple dates */}
                {selectedDates.length > 3 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-sm">
                      <strong>Tip:</strong> Documenting many days at once can be difficult to remember accurately. Consider documenting delays daily or every 2-3 days for best results.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Calendar grid for past 30 days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
                
                {/* Date cells */}
                {Array.from({ length: 30 }, (_, i) => {
                  const date = subDays(new Date(), 29 - i)
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const weather = weatherData[dateStr]
                  const isSelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr)
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDates(selectedDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr))
                        } else {
                          setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()))
                        }
                      }}
                      className={`
                        p-2 rounded-lg border text-sm relative transition-all
                        ${isSelected 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'hover:bg-gray-50 border-gray-200'
                        }
                        ${weather && (weather.precipitation > 0.1 || weather.wind_speed > 25) 
                          ? 'ring-2 ring-orange-400' 
                          : ''
                        }
                      `}
                    >
                      <div className="font-medium">{format(date, 'd')}</div>
                      {weather && (
                        <div className="text-xs mt-1">
                          {weather.precipitation > 0.1 && '🌧️'}
                          {weather.wind_speed > 25 && '💨'}
                          {weather.temperature < 40 && '❄️'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Selected dates summary */}
              {selectedDates.length > 0 && (
                <div className="space-y-3 mt-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Selected {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''}: {' '}
                      {selectedDates.map(d => format(d, 'MMM d')).join(', ')}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Mode selection for multiple dates */}
                  {selectedDates.length > 1 && (
                    <Card className="p-4">
                      <p className="text-sm font-medium mb-3">How would you like to document these days?</p>
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="mode"
                            value="period"
                            checked={documentMode === 'period'}
                            onChange={() => setDocumentMode('period')}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">As a period</p>
                            <p className="text-sm text-gray-600">
                              "We had rain all week..." - One description for the whole period
                            </p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="mode"
                            value="individual"
                            checked={documentMode === 'individual'}
                            onChange={() => setDocumentMode('individual')}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">Day by day</p>
                            <p className="text-sm text-gray-600">
                              Document each day separately with specific details
                            </p>
                          </div>
                        </label>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={handleDateSelection} disabled={selectedDates.length === 0} className="w-full sm:w-auto">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Describe Delays */}
      {step === 'describe' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Describe the delay on {format(selectedDates[currentDateIndex], 'EEEE, MMMM d')}
                </span>
                <Badge>
                  {currentDateIndex + 1} of {selectedDates.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {documentMode === 'period' && selectedDates.length > 1 ? (
                  <span>
                    Describe what happened during {format(selectedDates[selectedDates.length - 1], 'MMM d')} - {format(selectedDates[0], 'MMM d')}.
                    We'll apply this to all selected days.
                  </span>
                ) : selectedDates.length > 1 && currentDateIndex === 0 ? (
                  <span className="text-orange-600">
                    Documenting {selectedDates.length} days. We'll go through each day one at a time.
                  </span>
                ) : (
                  "Just tell us what happened in plain English. We'll extract the details."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show weather if available */}
              {weatherData[format(selectedDates[currentDateIndex], 'yyyy-MM-dd')] && (
                <Alert>
                  <Cloud className="h-4 w-4" />
                  <AlertDescription>
                    <strong>NOAA Weather Data:</strong> {' '}
                    {weatherData[format(selectedDates[currentDateIndex], 'yyyy-MM-dd')].conditions}, {' '}
                    {weatherData[format(selectedDates[currentDateIndex], 'yyyy-MM-dd')].temperature}°F, {' '}
                    Wind: {weatherData[format(selectedDates[currentDateIndex], 'yyyy-MM-dd')].wind_speed} mph
                  </AlertDescription>
                </Alert>
              )}

              {/* Show what was parsed if coming back from review */}
              {originalDescription && parsedData.questions && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <p className="font-medium text-blue-900 mb-2">The AI understood:</p>
                    <div className="text-sm space-y-1">
                      {parsedData.times?.start && <p>• Start time: {parsedData.times.start}</p>}
                      {parsedData.times?.end && <p>• End time: {parsedData.times.end}</p>}
                      {parsedData.weather?.conditions?.length > 0 && <p>• Weather: {parsedData.weather.conditions.join(', ')}</p>}
                      {parsedData.activities?.length > 0 && <p>• Activities: {parsedData.activities.join(', ')}</p>}
                      {parsedData.crew?.count && <p>• Crew affected: {parsedData.crew.count}</p>}
                      {parsedData.equipment?.length > 0 && <p>• Equipment: {parsedData.equipment.join(', ')}</p>}
                    </div>
                    <p className="text-sm text-blue-700 mt-2">Please add more details below to answer the questions.</p>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Example prompts */}
              {!originalDescription && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    {documentMode === 'period' ? 'Example period descriptions:' : 'Example descriptions:'}
                  </p>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {documentMode === 'period' ? (
                      <>
                        <li>• "Had intermittent rain all week. Lost about 2-3 hours each day on exterior work."</li>
                        <li>• "High winds Monday through Wednesday. Couldn't use crane any of those days."</li>
                        <li>• "Cold snap all week. Temperatures below 40°F prevented concrete work every morning."</li>
                      </>
                    ) : (
                      <>
                        <li>• "Heavy rain started at 9am, had to stop pouring foundation. Sent crew home at 11."</li>
                        <li>• "High winds all morning made crane work unsafe. Waited until 2pm then called it."</li>
                        <li>• "Started at 7 but too cold for concrete. Tarped everything and left at 10am."</li>
                      </>
                    )}
                  </ul>
                  {description && description.length < 50 && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Tip: Include times, weather conditions, activities affected, and crew actions for best results.
                    </p>
                  )}
                </div>
              )}

              {/* Description input */}
              <div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  className="min-h-[120px]"
                />
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{description.length} characters</span>
                  <span className="text-blue-600">
                    {documentMode === 'period' && selectedDates.length > 1 
                      ? `Period: ${format(selectedDates[selectedDates.length - 1], 'MMM d')} - ${format(selectedDates[0], 'MMM d')}`
                      : `Date: ${format(selectedDates[currentDateIndex], 'MMM d, yyyy')}`
                    }
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setStep('select-dates')} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleDescriptionSubmit} 
                  disabled={!description.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review and Save */}
      {step === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review and Confirm</CardTitle>
              <CardDescription>
                We've extracted these details. Please verify and adjust as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original description */}
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your description:</strong> {description}
                </AlertDescription>
              </Alert>
              
              {/* AI Interpretation */}
              {parsedData.summary && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong className="text-green-900">AI understood:</strong>
                    <p className="mt-1">{parsedData.summary}</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-green-700">
                      {parsedData.startTime && (
                        <div>
                          <strong>Start:</strong> {parsedData.startTime}
                        </div>
                      )}
                      {parsedData.endTime && (
                        <div>
                          <strong>End:</strong> {parsedData.endTime}
                        </div>
                      )}
                      {parsedData.weatherConditions && parsedData.weatherConditions.length > 0 && (
                        <div className="col-span-2">
                          <strong>Weather:</strong> {parsedData.weatherConditions.join(', ')}
                        </div>
                      )}
                      {parsedData.activities && parsedData.activities.length > 0 && (
                        <div className="col-span-2">
                          <strong>Activities affected:</strong> {parsedData.activities.join(', ')}
                        </div>
                      )}
                      {parsedData.actions && parsedData.actions.length > 0 && (
                        <div className="col-span-2">
                          <strong>Actions taken:</strong> {parsedData.actions.join(', ')}
                        </div>
                      )}
                    </div>
                    {parsedData.confidence && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-700">
                          Confidence: {parsedData.confidence}%
                        </span>
                        <div className="w-32 bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${parsedData.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Confidence and Questions */}
              {showQuestions && parsedData.questions && parsedData.questions.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong>AI Confidence: {parsedData.confidence || 'N/A'}%</strong>
                        <p className="text-sm mt-1">The AI needs more information for accurate documentation:</p>
                      </div>
                      <div>
                        <p className="font-medium">Please clarify:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {parsedData.questions.map((q: string, i: number) => (
                            <li key={i} className="text-sm">{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleResubmit}
                          className="w-full sm:flex-1"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Answer Questions
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowQuestions(false)}
                          className="w-full sm:flex-1"
                        >
                          Continue Anyway
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Extracted details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date and Time */}
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input 
                      value={format(selectedDates[currentDateIndex], 'MMMM d, yyyy')} 
                      disabled 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input 
                        type="time" 
                        value={parsedData.startTime || '07:00'}
                        onChange={(e) => setParsedData({...parsedData, startTime: e.target.value})}
                      />
                      {parsedData.startTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          AI detected: {parsedData.startTime}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input 
                        type="time" 
                        value={parsedData.endTime || ''}
                        onChange={(e) => setParsedData({...parsedData, endTime: e.target.value})}
                      />
                      {parsedData.endTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          AI detected: {parsedData.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Conditions */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Weather Conditions</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchNOAAWeather}
                        disabled={fetchingWeather}
                      >
                        {fetchingWeather ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <Cloud className="mr-2 h-3 w-3" />
                            Get NOAA Weather
                          </>
                        )}
                      </Button>
                    </div>
                    {noaaWeatherData && (
                      <Alert className="mb-2">
                        <Cloud className="h-4 w-4" />
                        <AlertDescription>
                          <strong>NOAA Data:</strong> {noaaWeatherData.temperature}°{noaaWeatherData.temperatureUnit || 'F'}, 
                          Wind: {noaaWeatherData.wind_speed} mph {noaaWeatherData.wind_direction}, 
                          Precipitation: {noaaWeatherData.precipitation_amount}"
                          {noaaWeatherData.conditions && noaaWeatherData.conditions.length > 0 && (
                            <>, Conditions: {noaaWeatherData.conditions.join(', ')}</>
                          )}
                          {noaaWeatherData.has_alerts && (
                            <><br /><span className="text-orange-600">⚠️ Weather alerts active</span></>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      {['Rain', 'Heavy Rain', 'Wind', 'High Winds', 'Lightning', 'Cold', 'Snow'].map(condition => (
                        <label key={condition} className="flex items-center gap-2">
                          <Checkbox 
                            checked={parsedData.weatherConditions?.includes(condition)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Add the weather condition
                                const newWeatherConditions = [...(parsedData.weatherConditions || []), condition]
                                
                                // Get all affected activities for this weather condition
                                const affectedActivities = WEATHER_ACTIVITY_IMPACTS[condition] || []
                                
                                // Only include activities that are in the project's activity list
                                const projectAffectedActivities = affectedActivities.filter(activity => 
                                  projectActivities.includes(activity)
                                )
                                
                                // Merge with existing activities (avoid duplicates)
                                const currentActivities = parsedData.activities || []
                                const newActivities = [...new Set([...currentActivities, ...projectAffectedActivities])]
                                
                                setParsedData({
                                  ...parsedData, 
                                  weatherConditions: newWeatherConditions,
                                  activities: newActivities
                                })
                              } else {
                                // Remove the weather condition
                                const newWeatherConditions = parsedData.weatherConditions?.filter((c: string) => c !== condition) || []
                                
                                // Recalculate which activities should be selected based on remaining weather conditions
                                let activitiesToKeep = new Set<string>()
                                
                                // For each remaining weather condition, add its affected activities
                                newWeatherConditions.forEach((weatherCond: string) => {
                                  const affected = WEATHER_ACTIVITY_IMPACTS[weatherCond] || []
                                  affected.forEach((activity: string) => activitiesToKeep.add(activity))
                                })
                                
                                // Only keep activities that are still affected by remaining weather conditions
                                // or that were manually selected (not in any weather mapping)
                                const newActivities = (parsedData.activities || []).filter((activity: string) => {
                                  // Keep if affected by remaining weather
                                  if (activitiesToKeep.has(activity)) return true
                                  
                                  // Keep if not in ANY weather mapping (manually selected)
                                  const isWeatherRelated = Object.values(WEATHER_ACTIVITY_IMPACTS)
                                    .some(activities => activities.includes(activity))
                                  
                                  return !isWeatherRelated
                                })
                                
                                setParsedData({
                                  ...parsedData, 
                                  weatherConditions: newWeatherConditions,
                                  activities: newActivities
                                })
                              }
                            }}
                          />
                          {condition}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activities Affected */}
              <div>
                <Label className="flex items-center gap-2">
                  Activities Affected
                  <span className="text-xs text-gray-500 font-normal">
                    (Auto-selected based on weather conditions)
                  </span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {projectActivities.map(activity => {
                    // Check if this activity is auto-selected by current weather conditions
                    const isWeatherSelected = (parsedData.weatherConditions || []).some((weather: string) => 
                      WEATHER_ACTIVITY_IMPACTS[weather]?.includes(activity)
                    )
                    
                    return (
                      <label 
                        key={activity} 
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                          isWeatherSelected ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <Checkbox 
                          checked={parsedData.activities?.includes(activity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setParsedData({
                                ...parsedData, 
                                activities: [...(parsedData.activities || []), activity]
                              })
                            } else {
                              setParsedData({
                                ...parsedData, 
                                activities: parsedData.activities?.filter((a: string) => a !== activity)
                              })
                            }
                          }}
                        />
                        <span className="text-sm">
                          {activity}
                          {isWeatherSelected && (
                            <span className="ml-1 text-xs text-blue-600">●</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="text-blue-600">●</span> = Auto-selected by weather conditions
                </p>
                {projectActivities.length > 0 && 
                 !projectActivities.every(a => Object.keys(ACTIVITY_KEYWORDS).includes(a)) && (
                  <p className="text-xs text-blue-600 mt-1">
                    Using project-specific activities
                  </p>
                )}
              </div>
              
              {/* Crew and Equipment Affected */}
              <div className="mt-6">
                <Separator className="mb-6" />
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Crew & Equipment Impact
                </h3>
                {selectedProject ? (
                  <CrewEquipmentSelector
                    projectId={selectedProject}
                    date={selectedDates[currentDateIndex]}
                    duration={parsedData.duration || (parsedData.endTime && parsedData.startTime ? 
                      calculateDuration(parsedData.startTime, parsedData.endTime) : 8)}
                    onCrewChange={(crew) => {
                      console.log('Crew changed:', crew)
                      setParsedData({...parsedData, affectedCrew: crew})
                    }}
                    onEquipmentChange={(equipment) => {
                      console.log('Equipment changed:', equipment)
                      setParsedData({...parsedData, affectedEquipment: equipment})
                    }}
                    defaultSelectAll={true}
                    cachedAssignments={projectAssignmentsCache[selectedProject]}
                  />
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>Error:</strong> No project selected. Please go back and select a project.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep('describe')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={() => saveDelay(currentDateIndex)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Continue
                    </>
                  )}
                </Button>
              </div>
              
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6">
                  <summary className="text-sm text-gray-500 cursor-pointer">Debug: Full AI Response</summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}