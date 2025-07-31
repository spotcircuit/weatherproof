import { NextRequest, NextResponse } from 'next/server'
import { parseDelayDescription } from '@/services/n8n-delay-parser'

export async function POST(request: NextRequest) {
  try {
    const { description, date } = await request.json()
    
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const parsedData = await parseDelayDescription(
      description, 
      date ? new Date(date) : undefined
    )

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Error parsing delay description:', error)
    return NextResponse.json(
      { error: 'Failed to parse description' },
      { status: 500 }
    )
  }
}