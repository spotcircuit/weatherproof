// Service dedicated to delay parsing via n8n with regex fallback
// This replaces the OpenAI service for delay parsing

export interface ParsedDelayInfo {
  dates: string[]
  times: {
    start?: string
    end?: string
  }
  weather: {
    conditions: string[]
    severity?: 'light' | 'moderate' | 'severe'
  }
  activities: string[]
  crew: {
    action?: string
    count?: number
    notes?: string
  }
  equipment: string[]
  materials: {
    protected?: boolean
    damaged?: boolean
    description?: string
  }
  safety: string[]
  duration?: number
  summary: string
  questions?: string[]  // AI can suggest clarifying questions
  confidence?: number   // How confident the AI is in its parsing
}

export async function parseDelayDescription(description: string, date?: Date): Promise<ParsedDelayInfo> {
  // Try n8n webhook first if configured
  if (process.env.N8N_PARSE_DELAY_URL) {
    const startTime = Date.now()
    try {
      const { n8nWebhooks, logWebhookPerformance } = await import('@/lib/n8n-helpers')
      const result = await n8nWebhooks.parseDelay(description, date)
      
      logWebhookPerformance('parseDelay', Date.now() - startTime, result.success, result.error)
      
      if (result.success && result.data) {
        return result.data
      }
      
      if (!result.fallbackToLocal) {
        throw new Error(result.error || 'n8n webhook failed')
      }
    } catch (error) {
      console.error('n8n parsing failed, falling back:', error)
    }
  }

  // n8n webhook failed or not configured, fall back to regex parsing
  return parseDelayDescriptionRegex(description, date)
}

// Fallback regex-based parsing
function parseDelayDescriptionRegex(description: string, date?: Date): ParsedDelayInfo {
  const result: ParsedDelayInfo = {
    dates: [],
    times: {},
    weather: { conditions: [] },
    activities: [],
    crew: {},
    equipment: [],
    materials: {},
    safety: [],
    summary: description.substring(0, 100)
  }

  const lowerDesc = description.toLowerCase()

  // Enhanced time parsing
  const timePatterns = [
    { pattern: /(\d{1,2}):?(\d{2})?\s*(am|pm)/gi, type: 'specific' },
    { pattern: /morning/i, value: '07:00' },
    { pattern: /lunch|noon/i, value: '12:00' },
    { pattern: /afternoon/i, value: '13:00' },
    { pattern: /all day/i, value: '07:00-15:30' }
  ]

  // Parse specific times with context
  const timeMatches = [...description.matchAll(timePatterns[0].pattern)]
  if (timeMatches.length > 0) {
    timeMatches.forEach((match, index) => {
      const hour = parseInt(match[1])
      const minute = match[2] || '00'
      const meridiem = match[3].toLowerCase()
      const hour24 = meridiem === 'pm' && hour !== 12 ? hour + 12 : (meridiem === 'am' && hour === 12 ? 0 : hour)
      const timeStr = `${hour24.toString().padStart(2, '0')}:${minute}`
      
      // Check context around the time
      const beforeTime = description.substring(Math.max(0, match.index! - 30), match.index!).toLowerCase()
      const afterTime = description.substring(match.index!, Math.min(description.length, match.index! + 50)).toLowerCase()
      
      // If "sent home", "stopped", "ended", "called it" appears near the time, it's an end time
      if (beforeTime.includes('sent') || beforeTime.includes('stop') || 
          beforeTime.includes('end') || beforeTime.includes('call') ||
          afterTime.includes('sent home') || afterTime.includes('stopped')) {
        result.times.end = timeStr
        // If no start time yet, assume normal start
        if (!result.times.start) {
          result.times.start = '07:00'
        }
      } else if (beforeTime.includes('start') || beforeTime.includes('began') || 
                 beforeTime.includes('rain at') || beforeTime.includes('wind at')) {
        result.times.start = timeStr
      } else {
        // Default behavior if no clear context
        if (index === 0 && !result.times.start) result.times.start = timeStr
        else if (!result.times.end) result.times.end = timeStr
      }
    })
  }

  // Parse keyword times
  timePatterns.slice(1).forEach(({ pattern, value }) => {
    if (pattern && value && lowerDesc.match(pattern)) {
      if (value.includes('-')) {
        const [start, end] = value.split('-')
        result.times.start = result.times.start || start
        result.times.end = result.times.end || end
      } else {
        result.times.start = result.times.start || value
      }
    }
  })

  // Weather parsing with severity
  const weatherPatterns = {
    'Heavy Rain': { keywords: ['heavy rain', 'downpour', 'torrential'], severity: 'severe' },
    'Rain': { keywords: ['rain', 'drizzle', 'shower', 'wet'], severity: 'moderate' },
    'High Winds': { keywords: ['high wind', 'strong wind', 'gale'], severity: 'severe' },
    'Wind': { keywords: ['wind', 'breezy', 'gusty'], severity: 'moderate' },
    'Lightning': { keywords: ['lightning', 'thunder', 'storm'], severity: 'severe' },
    'Cold': { keywords: ['cold', 'freezing', 'frost'], severity: 'moderate' },
    'Snow': { keywords: ['snow', 'blizzard', 'ice'], severity: 'severe' }
  }

  Object.entries(weatherPatterns).forEach(([condition, { keywords, severity }]) => {
    if (keywords.some(kw => lowerDesc.includes(kw))) {
      result.weather.conditions.push(condition)
      if (!result.weather.severity || severity === 'severe') {
        result.weather.severity = severity as 'light' | 'moderate' | 'severe'
      }
    }
  })

  // Activity parsing
  const activityPatterns = {
    'Concrete Work': ['concrete', 'pour', 'slab', 'foundation'],
    'Roofing': ['roof', 'shingle', 'flashing'],
    'Framing': ['framing', 'frame', 'stud', 'joist'],
    'Excavation': ['excavat', 'dig', 'trench', 'grade'],
    'Electrical': ['electrical', 'wiring', 'conduit'],
    'Plumbing': ['plumbing', 'pipe', 'drain'],
    'HVAC': ['hvac', 'heating', 'cooling', 'ventilation'],
    'Masonry': ['masonry', 'brick', 'block', 'mortar'],
    'Drywall': ['drywall', 'sheetrock', 'gypsum'],
    'Painting': ['paint', 'primer', 'coating']
  }

  Object.entries(activityPatterns).forEach(([activity, keywords]) => {
    if (keywords.some(kw => lowerDesc.includes(kw))) {
      result.activities.push(activity)
    }
  })

  // Crew parsing
  if (lowerDesc.includes('sent') && (lowerDesc.includes('home') || lowerDesc.includes('crew'))) {
    result.crew.action = 'sent home'
  } else if (lowerDesc.includes('stood down') || lowerDesc.includes('stand down')) {
    result.crew.action = 'stood down'
  }

  // Extract crew count
  const crewMatch = lowerDesc.match(/(\d+)\s*(crew|worker|people|guy)/i)
  if (crewMatch) {
    result.crew.count = parseInt(crewMatch[1])
  }

  // Equipment parsing
  const equipmentKeywords = [
    'crane', 'excavator', 'bulldozer', 'loader', 'forklift',
    'scissor lift', 'boom lift', 'generator', 'compressor',
    'backhoe', 'skid steer', 'dump truck'
  ]

  equipmentKeywords.forEach(equipment => {
    if (lowerDesc.includes(equipment)) {
      result.equipment.push(equipment.charAt(0).toUpperCase() + equipment.slice(1))
    }
  })

  // Materials parsing
  if (lowerDesc.includes('tarp') || lowerDesc.includes('cover') || lowerDesc.includes('protect')) {
    result.materials.protected = true
  }
  if (lowerDesc.includes('damage') || lowerDesc.includes('ruin') || lowerDesc.includes('destroy')) {
    result.materials.damaged = true
  }

  // Safety concerns
  const safetyKeywords = {
    'slip hazard': ['slip', 'slippery'],
    'visibility': ['visibility', 'can\'t see', 'fog'],
    'wind hazard': ['unsafe wind', 'dangerous wind'],
    'electrical hazard': ['electrical', 'power line'],
    'falling objects': ['falling', 'debris']
  }

  Object.entries(safetyKeywords).forEach(([concern, keywords]) => {
    if (keywords.some(kw => lowerDesc.includes(kw))) {
      result.safety.push(concern)
    }
  })

  // Calculate duration if we have start and end times
  if (result.times.start && result.times.end) {
    const [startHour, startMin] = result.times.start.split(':').map(Number)
    const [endHour, endMin] = result.times.end.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    result.duration = (endMinutes - startMinutes) / 60
  }

  return result
}

// Helper function to suggest improvements to user input
export async function suggestDelayDescription(partial: string): Promise<string[]> {
  const suggestions = [
    "Include specific times (e.g., 'started at 9am, stopped at 2pm')",
    "Mention weather conditions (e.g., 'heavy rain', 'high winds')",
    "Specify activities affected (e.g., 'couldn't pour concrete')",
    "Note crew actions (e.g., 'sent 6 crew members home')",
    "Mention safety concerns (e.g., 'slippery conditions')",
    "Include material protection (e.g., 'tarped the rebar')"
  ]

  // Check what's missing from the description
  const missing = []
  const lower = partial.toLowerCase()
  
  if (!lower.match(/\d{1,2}(:\d{2})?\s*(am|pm)/i) && !lower.includes('morning') && !lower.includes('afternoon')) {
    missing.push(suggestions[0])
  }
  if (!lower.includes('rain') && !lower.includes('wind') && !lower.includes('snow') && !lower.includes('cold')) {
    missing.push(suggestions[1])
  }
  
  // Check for activities using regex parser
  const parsed = parseDelayDescriptionRegex(partial)
  if (parsed.activities.length === 0) {
    missing.push(suggestions[2])
  }
  
  return missing.slice(0, 3) // Return top 3 suggestions
}