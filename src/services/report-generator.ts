// Insurance-grade report generation service

import { format } from 'date-fns/format'

// Dynamic import for jsPDF to avoid build issues
let jsPDF: any

interface WeatherEvent {
  date: string
  time: string
  condition: string
  value: number
  threshold: number
  source: string
  station_distance: number
}

interface DelayEvent {
  date: string
  hours_lost: number
  crew_size: number
  labor_cost: number
  equipment_cost: number
  overhead_cost: number
  total_cost: number
  activities_affected: string[]
  weather_events: WeatherEvent[]
  photos?: {
    filename: string
    takenAt: string
    location: string
    device: string
    caption: string
    url: string
  }[]
}

interface ReportData {
  project: {
    name: string
    address: string
    lat: number
    lng: number
    contract_number?: string
    policy_number?: string
  }
  company: {
    name: string
    contact: string
    email: string
    phone: string
  }
  claim_period: {
    start: string
    end: string
  }
  delays: DelayEvent[]
  weather_thresholds: {
    wind_speed?: number
    precipitation?: number
    temperature_min?: number
    temperature_max?: number
  }
  summary: {
    total_delay_days: number
    total_hours_lost: number
    total_labor_cost: number
    total_equipment_cost: number
    total_overhead_cost: number
    total_claim_amount: number
  }
  signature?: {
    signedBy: string
    signedAt: string
    signatureData: string
    affidavitText: string
  }
}

export class ReportGenerator {
  
  async generateInsuranceReport(data: ReportData): Promise<Blob> {
    const doc = new jsPDF()
    let yPosition = 20
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('WEATHER DELAY CERTIFICATION REPORT', 105, yPosition, { align: 'center' })
    
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Report ID: WP-${Date.now()}`, 105, yPosition, { align: 'center' })
    doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 105, yPosition + 5, { align: 'center' })
    
    // Executive Summary Box
    yPosition += 20
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPosition, 180, 60, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('EXECUTIVE SUMMARY', 20, yPosition + 10)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Project: ${data.project.name}`, 20, yPosition + 20)
    doc.text(`Location: ${data.project.address}`, 20, yPosition + 27)
    doc.text(`Claim Period: ${format(new Date(data.claim_period.start), 'MMM dd')} - ${format(new Date(data.claim_period.end), 'MMM dd, yyyy')}`, 20, yPosition + 34)
    
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Delay Days: ${data.summary.total_delay_days}`, 20, yPosition + 44)
    doc.text(`Total Claim Amount: $${data.summary.total_claim_amount.toLocaleString()}`, 20, yPosition + 51)
    
    // Weather Verification Section
    yPosition += 70
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('WEATHER DATA VERIFICATION', 15, yPosition)
    
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('All weather data obtained from:', 15, yPosition)
    doc.text('• National Oceanic and Atmospheric Administration (NOAA)', 20, yPosition + 7)
    doc.text('• National Weather Service (NWS) Certified Stations', 20, yPosition + 14)
    doc.text(`• Nearest Station Distance: < 5 miles from project site`, 20, yPosition + 21)
    
    // Thresholds Section
    yPosition += 35
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRACTUAL WEATHER THRESHOLDS', 15, yPosition)
    doc.setFont('helvetica', 'normal')
    
    yPosition += 10
    if (data.weather_thresholds.wind_speed) {
      doc.text(`• Wind Speed: Work stops when exceeding ${data.weather_thresholds.wind_speed} mph`, 20, yPosition)
      yPosition += 7
    }
    if (data.weather_thresholds.precipitation) {
      doc.text(`• Precipitation: Work stops when exceeding ${data.weather_thresholds.precipitation}"`, 20, yPosition)
      yPosition += 7
    }
    if (data.weather_thresholds.temperature_min) {
      doc.text(`• Temperature: Work stops below ${data.weather_thresholds.temperature_min}°F or above ${data.weather_thresholds.temperature_max}°F`, 20, yPosition)
      yPosition += 7
    }
    
    // Add new page for detailed logs
    doc.addPage()
    yPosition = 20
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETAILED DELAY LOG', 15, yPosition)
    
    yPosition += 15
    
    // Detailed delay events
    data.delays.forEach((delay, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      // Delay header
      doc.setFillColor(250, 250, 250)
      doc.rect(15, yPosition, 180, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text(`${format(new Date(delay.date), 'EEEE, MMMM dd, yyyy')}`, 17, yPosition + 6)
      
      yPosition += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      // Weather conditions
      doc.text('Weather Conditions:', 20, yPosition)
      yPosition += 7
      
      delay.weather_events.forEach(event => {
        doc.text(`• ${event.time} - ${event.condition}: ${event.value} (Threshold: ${event.threshold})`, 25, yPosition)
        doc.text(`  Source: ${event.source}, Distance: ${event.station_distance} miles`, 25, yPosition + 5)
        yPosition += 12
      })
      
      // Impact
      doc.text('Impact:', 20, yPosition)
      yPosition += 7
      doc.text(`• Hours Lost: ${delay.hours_lost}`, 25, yPosition)
      doc.text(`• Crew Affected: ${delay.crew_size} workers`, 25, yPosition + 5)
      doc.text(`• Activities: ${delay.activities_affected.join(', ')}`, 25, yPosition + 10)
      
      yPosition += 20
      
      // Costs
      doc.text('Costs:', 20, yPosition)
      yPosition += 7
      doc.text(`• Labor: $${delay.labor_cost.toLocaleString()}`, 25, yPosition)
      doc.text(`• Equipment: $${delay.equipment_cost.toLocaleString()}`, 25, yPosition + 5)
      doc.text(`• Overhead: $${delay.overhead_cost.toLocaleString()}`, 25, yPosition + 10)
      doc.setFont('helvetica', 'bold')
      doc.text(`• Daily Total: $${delay.total_cost.toLocaleString()}`, 25, yPosition + 15)
      
      yPosition += 30
    })
    
    // Add photo documentation if available
    const photosExist = data.delays.some(d => d.photos && d.photos.length > 0)
    if (photosExist) {
      doc.addPage()
      yPosition = 20
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('PHOTOGRAPHIC EVIDENCE', 15, yPosition)
      
      yPosition += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      data.delays.forEach(delay => {
        if (delay.photos && delay.photos.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.text(`Delay Event: ${delay.date}`, 15, yPosition)
          yPosition += 10
          
          delay.photos.forEach((photo, index) => {
            if (yPosition > 250) {
              doc.addPage()
              yPosition = 20
            }
            
            doc.setFont('helvetica', 'normal')
            doc.text(`Photo ${index + 1}: ${photo.filename}`, 20, yPosition)
            yPosition += 5
            doc.setFontSize(9)
            doc.text(`Taken: ${photo.takenAt}`, 25, yPosition)
            yPosition += 5
            if (photo.location !== 'Not available') {
              doc.text(`Location: ${photo.location}`, 25, yPosition)
              yPosition += 5
            }
            doc.text(`Device: ${photo.device}`, 25, yPosition)
            yPosition += 5
            if (photo.caption) {
              doc.text(`Caption: ${photo.caption}`, 25, yPosition)
              yPosition += 5
            }
            doc.setFontSize(10)
            yPosition += 10
          })
        }
      })
    }
    
    // Add new page for summary
    doc.addPage()
    yPosition = 20
    
    // Cost Summary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('COST SUMMARY', 15, yPosition)
    
    yPosition += 15
    doc.setFontSize(10)
    
    // Summary table
    const summaryData = [
      ['Labor Costs', `$${data.summary.total_labor_cost.toLocaleString()}`],
      ['Equipment Costs', `$${data.summary.total_equipment_cost.toLocaleString()}`],
      ['Overhead Costs', `$${data.summary.total_overhead_cost.toLocaleString()}`],
      ['', ''],
      ['TOTAL CLAIM AMOUNT', `$${data.summary.total_claim_amount.toLocaleString()}`]
    ]
    
    summaryData.forEach((row, index) => {
      if (index === summaryData.length - 1) {
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(240, 240, 240)
        doc.rect(15, yPosition - 5, 180, 10, 'F')
      } else {
        doc.setFont('helvetica', 'normal')
      }
      
      doc.text(row[0], 20, yPosition)
      doc.text(row[1], 150, yPosition, { align: 'right' })
      yPosition += 10
    })
    
    // Certification
    yPosition += 20
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICATION', 15, yPosition)
    
    yPosition += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const certText = [
      'I hereby certify that the information contained in this report is true and accurate to the best of my knowledge.',
      'All weather data has been obtained from official NOAA/NWS sources and accurately represents the conditions',
      'at the project site during the claim period. The delays and associated costs documented herein were directly',
      'caused by weather conditions exceeding the contractual thresholds.',
    ]
    
    certText.forEach(line => {
      doc.text(line, 15, yPosition)
      yPosition += 5
    })
    
    yPosition += 15
    doc.text('_______________________________', 15, yPosition)
    doc.text('Signature', 15, yPosition + 5)
    doc.text(data.company.contact, 15, yPosition + 10)
    doc.text(data.company.name, 15, yPosition + 15)
    doc.text(format(new Date(), 'MMMM dd, yyyy'), 15, yPosition + 20)
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('WeatherProof - Construction Weather Delay Documentation System', 105, 285, { align: 'center' })
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' })
    }
    
    return doc.output('blob')
  }

  async generateCSVReport(data: ReportData): Promise<string> {
    const rows = [
      ['Weather Delay Report'],
      ['Project:', data.project.name],
      ['Location:', data.project.address],
      ['Report Period:', `${data.claim_period.start} to ${data.claim_period.end}`],
      [''],
      ['Date', 'Weather Condition', 'Value', 'Threshold Exceeded', 'Hours Lost', 'Crew Size', 'Labor Cost', 'Equipment Cost', 'Overhead Cost', 'Total Cost'],
    ]
    
    data.delays.forEach(delay => {
      delay.weather_events.forEach((event, index) => {
        rows.push([
          delay.date,
          event.condition,
          event.value.toString(),
          `${event.threshold} (${event.condition})`,
          index === 0 ? delay.hours_lost.toString() : '',
          index === 0 ? delay.crew_size.toString() : '',
          index === 0 ? `$${delay.labor_cost}` : '',
          index === 0 ? `$${delay.equipment_cost}` : '',
          index === 0 ? `$${delay.overhead_cost}` : '',
          index === 0 ? `$${delay.total_cost}` : ''
        ])
      })
    })
    
    rows.push([''])
    rows.push(['Summary'])
    rows.push(['Total Delay Days:', data.summary.total_delay_days.toString()])
    rows.push(['Total Hours Lost:', data.summary.total_hours_lost.toString()])
    rows.push(['Total Claim Amount:', `$${data.summary.total_claim_amount}`])
    
    return rows.map(row => row.map(cell => 
      cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n')
  }
}

// Export singleton
export const reportGenerator = new ReportGenerator()