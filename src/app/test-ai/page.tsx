'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SmartDelayDocumentation } from '@/components/smart-delay-documentation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function TestAIPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    loadProjects()
  }, [])
  
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setProjects(data)
      } else {
        // Create a test project if none exist
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name: 'Test Construction Site',
            address: '123 Test St, Test City',
            latitude: 40.7128,
            longitude: -74.0060,
            start_date: new Date().toISOString(),
            insurance_claim_number: 'TEST-' + Date.now(),
            insurance_company: 'Test Insurance Co',
            project_value: 1000000,
            deductible_amount: 50000,
            general_contractor: 'Test GC',
            contractor_type: 'General Contractor',
            status: 'Active'
          })
          .select()
          .single()
        
        if (createError) throw createError
        
        if (newProject) {
          // Create default activities for the test project
          const defaultActivities = [
            'Concrete Work', 
            'Framing', 
            'Excavation', 
            'Foundation Work',
            'Site Preparation',
            'Roofing',
            'Electrical',
            'Plumbing'
          ]
          
          const activitiesData = defaultActivities.map(activity => ({
            project_id: newProject.id,
            activity_name: activity,
            is_active: true,
            is_default: true
          }))
          
          const { error: activitiesError } = await supabase
            .from('project_activities')
            .insert(activitiesData)
          
          if (activitiesError) {
            console.error('Error creating test project activities:', activitiesError)
          }
          
          setProjects([newProject])
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test AI Delay Documentation</CardTitle>
          <CardDescription>
            Test the AI parsing flow with clarifying questions
            {projects.length > 0 && (
              <span className="block mt-2 text-sm text-blue-600">
                Using project: {projects[0].name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Test Scenarios:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Try: "Rain at 9am, stopped concrete" - Should ask for end time and crew details</li>
                <li>Try: "High winds all day" - Should ask for specific times and activities</li>
                <li>Try: "Sent everyone home" - Should ask how many and when</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Expected Flow:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter a vague description</li>
                <li>AI parses what it can and shows questions</li>
                <li>Click "Answer Questions" to improve description</li>
                <li>Description is pre-filled with prompts</li>
                <li>Fill in the blanks and resubmit</li>
                <li>AI parses the complete description</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {projects.length > 0 ? (
        <SmartDelayDocumentation 
          projects={projects}
          onComplete={() => {
            alert('Test completed! Check console for results.')
          }}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No projects found. Please create a project first.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}