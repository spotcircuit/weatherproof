// Sample data generator for testing/demo purposes

export const generateSampleProjects = () => {
  const projectTypes = ['roofing', 'concrete', 'framing', 'painting', 'general']
  const cities = [
    { city: 'Austin', state: 'TX', zip: '78701' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'San Antonio', state: 'TX', zip: '78201' },
  ]
  
  const streets = ['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'Commerce St', 'Broadway', 'Houston St']
  const projectNames = [
    'Residential Roof Replacement',
    'Commercial Building Reroof', 
    'Storm Damage Repair',
    'New Construction Roofing',
    'Office Complex Foundation',
    'Parking Garage Concrete',
    'Retail Store Framing',
    'Warehouse Exterior Painting'
  ]

  const projects = []
  const today = new Date()
  
  // Generate 10-20 sample projects
  const count = Math.floor(Math.random() * 10) + 10
  
  for (let i = 0; i < count; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)) // Started within last 60 days
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 14) // 14-44 days duration
    
    projects.push({
      project_name: projectNames[Math.floor(Math.random() * projectNames.length)] + ` #${1000 + i}`,
      address: `${Math.floor(Math.random() * 9999) + 100} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: city.city,
      state: city.state,
      zip: city.zip,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate > today ? '' : endDate.toISOString().split('T')[0], // Only set end date if in past
      project_type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
      crew_size: Math.floor(Math.random() * 8) + 2, // 2-10 crew members
      hourly_rate: Math.floor(Math.random() * 30) + 35, // $35-65 per hour
    })
  }
  
  return projects
}

// Generate sample weather data for testing
export const generateSampleWeatherData = (projectId: string, days: number = 30) => {
  const weatherData = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Simulate realistic weather patterns
    const isRainy = Math.random() < 0.15 // 15% chance of rain
    const isWindy = Math.random() < 0.1 // 10% chance of high wind
    const isCold = date.getMonth() >= 10 || date.getMonth() <= 2 // Winter months
    
    weatherData.push({
      project_id: projectId,
      date: date.toISOString().split('T')[0],
      temperature_high: isCold ? Math.floor(Math.random() * 30) + 30 : Math.floor(Math.random() * 30) + 70,
      temperature_low: isCold ? Math.floor(Math.random() * 20) + 20 : Math.floor(Math.random() * 20) + 50,
      wind_speed: isWindy ? Math.floor(Math.random() * 20) + 25 : Math.floor(Math.random() * 15) + 5,
      precipitation: isRainy ? (Math.random() * 2).toFixed(2) : '0',
      humidity: Math.floor(Math.random() * 40) + 40,
      conditions: isRainy ? 'Rainy' : isWindy ? 'Windy' : 'Clear',
      delay_triggered: (isRainy && parseFloat((Math.random() * 2).toFixed(2)) > 0.1) || (isWindy && Math.floor(Math.random() * 20) + 25 > 25)
    })
  }
  
  return weatherData
}

// Calculate delay statistics
export const calculateDelayStats = (weatherData: any[]) => {
  const delays = weatherData.filter(day => day.delay_triggered)
  const totalDelayDays = delays.length
  const estimatedCostPerDay = 2000 // Average daily cost of delays
  
  return {
    totalDelayDays,
    totalCost: totalDelayDays * estimatedCostPerDay,
    delaysByReason: {
      rain: delays.filter(d => parseFloat(d.precipitation) > 0.1).length,
      wind: delays.filter(d => d.wind_speed > 25).length,
      temperature: delays.filter(d => d.temperature_high > 95 || d.temperature_low < 40).length
    },
    averageDelaysPerMonth: Math.round((totalDelayDays / (weatherData.length / 30)) * 10) / 10
  }
}

// Export sample CSV data
export const generateSampleCSV = () => {
  const projects = generateSampleProjects()
  const headers = ['project_name', 'address', 'city', 'state', 'zip', 'start_date', 'end_date', 'project_type', 'crew_size', 'hourly_rate']
  
  const csv = [
    headers.join(','),
    ...projects.map(p => 
      headers.map(h => {
        const value = p[h as keyof typeof p]
        // Quote strings that might contain commas
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
  ].join('\n')
  
  return csv
}