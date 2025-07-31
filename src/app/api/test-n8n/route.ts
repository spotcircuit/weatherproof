import { NextRequest, NextResponse } from 'next/server'
import { testN8nConnection, n8nWebhooks } from '@/lib/n8n-helpers'

export async function GET() {
  const webhooks = {
    parseDelay: process.env.N8N_PARSE_DELAY_URL,
    generateReport: process.env.N8N_GENERATE_REPORT_URL,
    analyzePhotos: process.env.N8N_ANALYZE_PHOTOS_URL,
    weatherCheck: process.env.N8N_WEATHER_CHECK_URL
  }

  const tests: Record<string, boolean> = {}

  // Test each webhook
  for (const [name, url] of Object.entries(webhooks)) {
    if (url) {
      tests[name] = await testN8nConnection(url)
    } else {
      tests[name] = false
    }
  }

  return NextResponse.json({
    configured: Object.entries(webhooks).filter(([_, url]) => !!url).length,
    total: Object.keys(webhooks).length,
    tests,
    auth: !!process.env.N8N_WEBHOOK_AUTH
  })
}

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()
    
    if (!description) {
      return NextResponse.json(
        { error: 'Description required' },
        { status: 400 }
      )
    }

    // Test the parse delay webhook
    const result = await n8nWebhooks.parseDelay(description, new Date())

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      fallbackUsed: result.fallbackToLocal
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}