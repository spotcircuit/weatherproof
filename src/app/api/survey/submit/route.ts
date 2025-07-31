import { NextRequest, NextResponse } from 'next/server'

// Google Sheets configuration
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || ''

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Debug logging
    console.log('Google Sheets Webhook URL:', GOOGLE_SHEETS_WEBHOOK_URL ? 'Configured' : 'Not configured')
    if (GOOGLE_SHEETS_WEBHOOK_URL) {
      console.log('URL starts with:', GOOGLE_SHEETS_WEBHOOK_URL.substring(0, 50) + '...')
    }
    
    // Format data for Google Sheets
    const sheetData = {
      timestamp: new Date().toISOString(),
      email: data.email || '',
      contactName: data.contactName || '',
      companyName: data.companyName || '',
      phone: data.phone || '',
      role: data.role || '',
      projectsPerYear: data.projectsPerYear || '',
      typicalDelayCost: data.typicalDelayCost || '',
      delaysLastYear: data.delaysLastYear || '',
      constructionTypes: Array.isArray(data.constructionTypes) ? data.constructionTypes.join(', ') : '',
      biggestChallenges: Array.isArray(data.biggestChallenges) ? data.biggestChallenges.join(', ') : '',
      filedClaim: Array.isArray(data.filedClaim) ? data.filedClaim.join(', ') : '',
      currentDocumentation: Array.isArray(data.currentDocumentation) ? data.currentDocumentation.join(', ') : '',
      valuableFeatures: Array.isArray(data.valuableFeatures) ? data.valuableFeatures.join(', ') : '',
      willingToPay: data.willingToPay || '',
      wantsNotification: data.wantsNotification || '',
      qualified: true // Always qualified since we removed qualification logic
    }
    
    // Option 1: Send to Google Sheets via webhook (e.g., Zapier, Make, or Google Apps Script)
    if (GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
      try {
        const webhookResponse = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData)
        })
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('Failed to send to Google Sheets webhook:', {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
            error: errorText
          })
        } else {
          console.log('Successfully sent to Google Sheets')
        }
      } catch (fetchError) {
        console.error('Error sending to Google Sheets:', fetchError)
      }
    } else {
      console.log('Google Sheets webhook not configured or using placeholder URL')
    }
    
    // Supabase backup removed - using Google Sheets only
    // If you want to add Supabase backup later, you'll need to:
    // 1. Update the database schema to match the field names
    // 2. Add the Supabase insertion code here
    
    // Send confirmation email if provided
    if (data.email && data.wantsNotification !== 'No thanks') {
      // You can integrate with your email service here
      // For now, we'll just log it
      console.log('Would send confirmation email to:', data.email)
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Survey response recorded successfully'
    })
    
  } catch (error) {
    console.error('Survey submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit survey' },
      { status: 500 }
    )
  }
}