import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Test endpoint to verify n8n authentication setup
  
  const authHeader = process.env.N8N_WEBHOOK_AUTH
  
  if (!authHeader) {
    return NextResponse.json({
      error: 'N8N_WEBHOOK_AUTH not configured in environment variables'
    }, { status: 500 })
  }

  // Test a simple webhook call
  const testUrl = process.env.N8N_PARSE_DELAY_URL
  
  if (!testUrl) {
    return NextResponse.json({
      error: 'N8N_PARSE_DELAY_URL not configured'
    }, { status: 500 })
  }

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        test: true,
        description: 'Test authentication',
        date: new Date().toISOString()
      })
    })

    const responseText = await response.text()
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type'),
        'X-N8n-Response-Code': response.headers.get('X-N8n-Response-Code')
      },
      authHeaderSent: `Authorization: ${authHeader.substring(0, 10)}...`,
      responsePreview: responseText.substring(0, 200),
      success: response.ok
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      type: error.name
    }, { status: 500 })
  }
}

export async function GET() {
  // Show current configuration (safely)
  const config = {
    hasAuth: !!process.env.N8N_WEBHOOK_AUTH,
    authPreview: process.env.N8N_WEBHOOK_AUTH 
      ? `${process.env.N8N_WEBHOOK_AUTH.substring(0, 10)}...` 
      : 'Not configured',
    webhooks: {
      parseDelay: !!process.env.N8N_PARSE_DELAY_URL,
      generateReport: !!process.env.N8N_GENERATE_REPORT_URL,
      analyzePhotos: !!process.env.N8N_ANALYZE_PHOTOS_URL,
      weatherCheck: !!process.env.N8N_WEATHER_CHECK_URL
    }
  }
  
  return NextResponse.json(config)
}