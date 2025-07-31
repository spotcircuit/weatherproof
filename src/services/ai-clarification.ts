import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export interface ClarificationRequest {
  originalDescription: string
  currentData: any
  userResponse: string
  question: string
}

export async function getClarification(request: ClarificationRequest) {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are helping clarify construction delay documentation. 
          The user provided an initial description and you asked a clarifying question.
          Now incorporate their answer to improve the parsed data.
          
          Return the same JSON format as before but with updated/improved information based on the clarification.`
        },
        {
          role: "user",
          content: `Original description: "${request.originalDescription}"
          
          Current parsed data: ${JSON.stringify(request.currentData, null, 2)}
          
          You asked: "${request.question}"
          User answered: "${request.userResponse}"
          
          Update the parsed data based on this clarification.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Error getting clarification:', error)
    throw error
  }
}

// Suggest what info is commonly needed for insurance claims
export function getRequiredFieldsChecklist() {
  return {
    critical: [
      { field: 'Start time', description: 'When did the delay begin?' },
      { field: 'End time', description: 'When did work resume?' },
      { field: 'Weather condition', description: 'What specific weather caused the delay?' },
      { field: 'Activities affected', description: 'What work had to stop?' },
      { field: 'Crew count', description: 'How many workers were affected?' }
    ],
    important: [
      { field: 'Equipment idle', description: 'What equipment couldn\'t be used?' },
      { field: 'Materials protected', description: 'Were materials covered/protected?' },
      { field: 'Safety concerns', description: 'What made it unsafe to continue?' },
      { field: 'Supervisor decision', description: 'Who made the call to stop work?' }
    ],
    helpful: [
      { field: 'Weather severity', description: 'Light, moderate, or severe conditions?' },
      { field: 'Alternative work', description: 'Could any work continue?' },
      { field: 'Subcontractor impact', description: 'Were subs affected?' },
      { field: 'Material damage', description: 'Was anything damaged by weather?' }
    ]
  }
}

// Generate smart follow-up questions based on what's missing
export function generateFollowUpQuestions(parsedData: any): string[] {
  const questions: string[] = []

  // Check for missing critical information
  if (!parsedData.times?.end) {
    questions.push("What time did work resume (or when did you send the crew home)?")
  }

  if (!parsedData.crew?.count && !parsedData.crew?.action) {
    questions.push("How many crew members were affected by this delay?")
  }

  if (parsedData.activities?.length === 0) {
    questions.push("What specific work activities had to stop (e.g., concrete pour, roofing)?")
  }

  if (!parsedData.equipment || parsedData.equipment.length === 0) {
    questions.push("Was any equipment sitting idle during the delay?")
  }

  if (!parsedData.materials?.protected && !parsedData.materials?.damaged) {
    questions.push("Did you need to protect any materials from the weather?")
  }

  if (parsedData.weather?.conditions?.length === 0) {
    questions.push("What were the specific weather conditions (rain, wind, temperature)?")
  }

  return questions.slice(0, 3) // Return top 3 most important questions
}