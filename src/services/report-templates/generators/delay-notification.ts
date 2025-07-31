// Client Delay Notification Generator

import { BaseReportGenerator, ReportData, GeneratorOptions } from '../base-generator'
import { differenceInDays } from 'date-fns'

export class DelayNotificationGenerator extends BaseReportGenerator {
  getReportTitle(): string {
    return 'Project Delay Notification'
  }
  
  getReportType(): string {
    return 'DELAY_NOTIFICATION'
  }
  
  async generateReport(data: ReportData, options?: GeneratorOptions): Promise<Blob> {
    this.data = data
    this.options = options || {}
    
    // Professional header with logo space
    this.doc.setFillColor(0, 82, 155) // Professional blue
    this.doc.rect(0, 0, 210, 30, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PROJECT UPDATE', 105, 20, { align: 'center' })
    this.doc.setTextColor(0, 0, 0)
    
    this.currentY = 45
    
    // Date and recipient info
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.formatDate(new Date(), 'MMMM dd, yyyy'), 15, this.currentY)
    
    this.currentY += 15
    
    if (data.recipient) {
      this.doc.text(data.recipient.name || 'Property Owner', 15, this.currentY)
      this.currentY += 6
      if (data.recipient.company) {
        this.doc.text(data.recipient.company, 15, this.currentY)
        this.currentY += 6
      }
    }
    
    this.currentY += 10
    
    // Project reference
    this.doc.text(`Re: ${data.project.name}`, 15, this.currentY)
    this.currentY += 6
    this.doc.text(`${data.project.address}`, 15, this.currentY)
    
    this.currentY += 15
    
    // Opening paragraph
    this.doc.text('Dear Property Owner,', 15, this.currentY)
    this.currentY += 10
    
    const openingText = [
      'We are writing to inform you of weather-related delays that have affected your project.',
      'Our commitment to quality and safety requires us to pause work during severe weather',
      'conditions. This update provides details about recent delays and their impact on your',
      'project schedule.'
    ]
    
    openingText.forEach(line => {
      this.doc.text(line, 15, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 10
    
    // Summary box
    this.doc.setFillColor(245, 247, 250)
    this.doc.rect(15, this.currentY, 180, 40, 'F')
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DELAY SUMMARY', 20, this.currentY + 10)
    
    const totalDelayDays = data.delays.length
    const totalCost = this.calculateTotalCosts(data.delays).total
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Total Weather Delay Days: ${totalDelayDays}`, 20, this.currentY + 20)
    this.doc.text(`Period: ${this.formatDate(data.delays[0].start_time)} to ${this.formatDate(data.delays[data.delays.length - 1].start_time)}`, 20, this.currentY + 30)
    
    this.currentY += 50
    
    // Recent delays section
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Recent Weather Events', 15, this.currentY)
    this.currentY += 10
    
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    // Show last 3 delays
    const recentDelays = data.delays.slice(-3).reverse()
    recentDelays.forEach((delay, index) => {
      this.checkPageBreak(30)
      
      // Date header
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(this.formatDate(delay.start_time, 'EEEE, MMMM dd'), 20, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      
      this.currentY += 6
      this.doc.text(`Weather Condition: ${delay.weather_condition}`, 25, this.currentY)
      this.currentY += 6
      this.doc.text(`Work Affected: ${delay.activities_affected?.activities?.join(', ') || 'General construction'}`, 25, this.currentY)
      
      this.currentY += 10
    })
    
    // Schedule impact
    this.currentY += 5
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Schedule Impact', 15, this.currentY)
    this.currentY += 10
    
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    const originalEnd = new Date(data.project.end_date)
    const delayDays = totalDelayDays
    const revisedEnd = new Date(originalEnd)
    revisedEnd.setDate(revisedEnd.getDate() + delayDays)
    
    const scheduleInfo = [
      ['Original Completion Date:', this.formatDate(originalEnd)],
      ['Weather Delay Days:', `${delayDays} days`],
      ['Revised Completion Date:', this.formatDate(revisedEnd)]
    ]
    
    scheduleInfo.forEach(([label, value]) => {
      this.doc.text(label, 20, this.currentY)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(value, 100, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.currentY += 7
    })
    
    this.currentY += 10
    
    // What this means section
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('What This Means For You', 15, this.currentY)
    this.currentY += 10
    
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    const impacts = [
      '• Your project completion date has been adjusted to account for weather delays',
      '• All work will resume as soon as weather conditions permit',
      '• The quality and safety of your project remain our top priorities',
      '• Weather delays are covered under the force majeure clause of your contract'
    ]
    
    impacts.forEach(impact => {
      this.checkPageBreak(10)
      this.doc.text(impact, 20, this.currentY)
      this.currentY += 7
    })
    
    this.currentY += 10
    
    // Next steps
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Next Steps', 15, this.currentY)
    this.currentY += 10
    
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    const nextSteps = [
      '1. We will continue monitoring weather conditions daily',
      '2. Work will resume immediately when conditions improve',
      '3. We will provide weekly updates on project progress',
      '4. Any questions or concerns can be directed to your project manager'
    ]
    
    nextSteps.forEach(step => {
      this.checkPageBreak(10)
      this.doc.text(step, 20, this.currentY)
      this.currentY += 7
    })
    
    this.currentY += 15
    
    // Closing
    const closingText = [
      'We appreciate your patience and understanding during these weather-related delays.',
      'Our team is committed to delivering a quality project, and we look forward to',
      'resuming work as soon as conditions allow.'
    ]
    
    closingText.forEach(line => {
      this.doc.text(line, 15, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 15
    
    this.doc.text('Sincerely,', 15, this.currentY)
    this.currentY += 15
    
    this.doc.text(data.company.contact || 'Project Manager', 15, this.currentY)
    this.currentY += 6
    this.doc.text(data.company.name, 15, this.currentY)
    this.currentY += 6
    this.doc.text(data.company.phone || '', 15, this.currentY)
    this.currentY += 6
    this.doc.text(data.company.email || '', 15, this.currentY)
    
    // Add photos appendix if requested
    if (this.options.includePhotos && data.photos && data.photos.length > 0) {
      this.addNewPage()
      
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Appendix: Site Conditions', 15, this.currentY)
      this.currentY += 10
      
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('The following photos document weather conditions at your project site:', 15, this.currentY)
      this.currentY += 10
      
      data.photos.forEach((photo, index) => {
        this.checkPageBreak(15)
        this.doc.text(`Photo ${index + 1}: ${this.formatDate(photo.taken_at)}`, 20, this.currentY)
        this.currentY += 5
        if (photo.caption) {
          this.doc.text(photo.caption, 25, this.currentY)
          this.currentY += 5
        }
        this.currentY += 5
      })
    }
    
    // Professional footer
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(100, 100, 100)
      
      // Add footer line
      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(15, 275, 195, 275)
      
      this.doc.text(data.company.name, 15, 280)
      this.doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' })
      this.doc.text('WeatherProof Documentation', 195, 280, { align: 'right' })
      
      this.doc.setTextColor(0, 0, 0)
    }
    
    return this.doc.output('blob')
  }
}