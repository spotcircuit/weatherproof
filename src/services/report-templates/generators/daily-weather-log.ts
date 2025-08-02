// Daily Weather Log Generator

import { BaseReportGenerator, ReportData, GeneratorOptions } from '../base-generator'
import { format } from 'date-fns'

export class DailyWeatherLogGenerator extends BaseReportGenerator {
  getReportTitle(): string {
    return 'Daily Weather Log'
  }
  
  getReportType(): string {
    return 'DAILY_WEATHER_LOG'
  }
  
  async generateReport(data: ReportData, options?: GeneratorOptions): Promise<Blob> {
    this.data = data
    this.options = options || {}
    
    // Report header
    this.addHeader(
      'Daily Weather Log',
      `${data.project.name} - ${this.formatDate(new Date())}`
    )
    
    // Project info box
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(15, this.currentY, 180, 40, 'F')
    this.currentY += 5
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Project: ${data.project.name}`, 20, this.currentY)
    this.currentY += 7
    this.doc.text(`Location: ${data.project.address}`, 20, this.currentY)
    this.currentY += 7
    this.doc.text(`Date: ${this.formatDate(new Date(), 'EEEE, MMMM dd, yyyy')}`, 20, this.currentY)
    this.currentY += 7
    this.doc.text(`Superintendent: ${data.company.contact || 'N/A'}`, 20, this.currentY)
    
    this.currentY += 20
    
    // Weather Conditions Section
    this.addSectionHeader('Weather Conditions')
    
    const latestWeather = data.weather[data.weather.length - 1]
    if (latestWeather) {
      // Weather data in a grid
      const weatherGrid = [
        ['Temperature:', `${latestWeather.temperature?.toFixed(0) || 'N/A'}°F`],
        ['Wind Speed:', `${latestWeather.wind_speed?.toFixed(0) || 'N/A'} mph`],
        ['Precipitation:', `${latestWeather.precipitation_amount?.toFixed(2) || '0.00'} inches`],
        ['Conditions:', latestWeather.conditions || 'Clear'],
        ['Humidity:', `${latestWeather.humidity || 'N/A'}%`],
        ['Visibility:', `${latestWeather.visibility?.toFixed(1) || 'N/A'} miles`]
      ]
      
      const startX = 20
      const col1Width = 60
      const col2X = startX + col1Width + 40
      
      weatherGrid.forEach((item, index) => {
        const row = Math.floor(index / 2)
        const col = index % 2
        const x = col === 0 ? startX : col2X
        const y = this.currentY + (row * 7)
        
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(item[0], x, y)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(item[1], x + 40, y)
      })
      
      this.currentY += 25
      
      // Weather source info
      this.doc.setFontSize(9)
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(
        `Source: ${latestWeather.data_source || 'NOAA'} Station ${latestWeather.station_id || 'N/A'} (${latestWeather.station_distance?.toFixed(1) || 'N/A'} miles away)`,
        20, this.currentY
      )
      this.doc.text(
        `Last Updated: ${this.formatDate(latestWeather.collected_at, 'HH:mm')}`,
        20, this.currentY + 5
      )
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(10)
      
      this.currentY += 15
    }
    
    // Work Status Section
    this.addSectionHeader('Work Status')
    
    const todaysDelay = data.delays.find(d => 
      this.formatDate(d.start_time) === this.formatDate(new Date())
    )
    
    if (todaysDelay) {
      // Work stopped
      this.doc.setFillColor(255, 240, 240)
      this.doc.rect(15, this.currentY, 180, 30, 'F')
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('⚠️ WORK STOPPED', 20, this.currentY + 10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Reason: ${todaysDelay.weather_condition}`, 20, this.currentY + 20)
      this.currentY += 35
      
      // Impact details
      this.doc.text(`Crew Affected: ${todaysDelay.crew_size || data.project.crew_size} workers`, 20, this.currentY)
      this.currentY += 7
      this.doc.text(`Activities Affected: ${todaysDelay.activities_affected?.activities?.join(', ') || 'General work'}`, 20, this.currentY)
      this.currentY += 7
      this.doc.text(`Estimated Cost Impact: ${this.formatCurrency(todaysDelay.total_cost || 0)}`, 20, this.currentY)
    } else {
      // Work proceeding
      this.doc.setFillColor(240, 255, 240)
      this.doc.rect(15, this.currentY, 180, 20, 'F')
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('✓ WORK PROCEEDING NORMALLY', 20, this.currentY + 13)
      this.currentY += 25
    }
    
    this.currentY += 15
    
    // Threshold Status
    this.addSectionHeader('Weather Threshold Status')
    
    const thresholds = data.project.weather_thresholds
    const violations = this.checkThresholdViolations(latestWeather || {}, thresholds)
    
    if (violations.length > 0) {
      this.doc.setTextColor(200, 0, 0)
      violations.forEach(violation => {
        this.doc.text(`⚠️ ${violation}`, 20, this.currentY)
        this.currentY += 7
      })
      this.doc.setTextColor(0, 0, 0)
    } else {
      this.doc.setTextColor(0, 150, 0)
      this.doc.text('✓ All conditions within acceptable thresholds', 20, this.currentY)
      this.doc.setTextColor(0, 0, 0)
    }
    
    this.currentY += 15
    
    // Photos section if included
    if (this.options.includePhotos && data.photos && data.photos.length > 0) {
      this.checkPageBreak(50)
      this.addSectionHeader('Site Photos')
      
      this.doc.setFontSize(9)
      data.photos.forEach((photo, index) => {
        this.doc.text(`${index + 1}. ${photo.filename}`, 20, this.currentY)
        this.currentY += 5
        this.doc.text(`   Taken: ${this.formatDate(photo.taken_at, 'HH:mm')}`, 20, this.currentY)
        this.currentY += 5
        if (photo.caption) {
          this.doc.text(`   Caption: ${photo.caption}`, 20, this.currentY)
          this.currentY += 5
        }
        this.currentY += 3
      })
    }
    
    this.currentY += 10
    
    // Superintendent notes section
    this.checkPageBreak(50)
    this.addSectionHeader('Notes')
    
    this.doc.setDrawColor(200, 200, 200)
    for (let i = 0; i < 5; i++) {
      this.doc.line(20, this.currentY + (i * 10), 190, this.currentY + (i * 10))
    }
    
    this.currentY += 60
    
    // Signature line
    this.doc.line(20, this.currentY, 90, this.currentY)
    this.doc.text('Superintendent Signature', 20, this.currentY + 5)
    
    this.doc.line(120, this.currentY, 190, this.currentY)
    this.doc.text('Date', 120, this.currentY + 5)
    
    // Add footer
    this.addFooter()
    
    return this.doc.output('blob')
  }
}