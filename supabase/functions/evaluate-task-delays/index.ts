// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // This function evaluates all active project tasks for delays
    console.log('Starting task delay evaluation...')

    // Get all active projects
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, name')
      .eq('status', 'active')

    if (projectsError) {
      throw projectsError
    }

    console.log(`Found ${projects?.length || 0} active projects`)

    let totalTasksEvaluated = 0
    let totalTasksDelayed = 0
    let totalTasksAtRisk = 0

    for (const project of projects || []) {
      console.log(`Evaluating project: ${project.name}`)

      // Call the database function to evaluate all tasks for this project
      const { error: evalError } = await supabaseClient
        .rpc('evaluate_all_project_task_delays', { project_id: project.id })

      if (evalError) {
        console.error(`Error evaluating project ${project.id}:`, evalError)
        continue
      }

      // Get summary of tasks for this project
      const { data: taskSummary } = await supabaseClient
        .from('project_tasks')
        .select('status')
        .eq('project_id', project.id)

      if (taskSummary) {
        totalTasksEvaluated += taskSummary.length
        totalTasksDelayed += taskSummary.filter(t => t.status === 'delayed').length
        totalTasksAtRisk += taskSummary.filter(t => t.status === 'at_risk').length
      }
    }

    // Log the evaluation summary
    const summary = {
      timestamp: new Date().toISOString(),
      projectsEvaluated: projects?.length || 0,
      totalTasksEvaluated,
      totalTasksDelayed,
      totalTasksAtRisk,
    }

    console.log('Evaluation complete:', summary)

    // Optional: Store the summary in a logs table
    await supabaseClient
      .from('cron_logs')
      .insert({
        function_name: 'evaluate-task-delays',
        execution_time: new Date().toISOString(),
        status: 'success',
        summary: summary,
      })
      .select()

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in evaluate-task-delays:', error)

    // Log the error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    await supabaseClient
      .from('cron_logs')
      .insert({
        function_name: 'evaluate-task-delays',
        execution_time: new Date().toISOString(),
        status: 'error',
        error_message: error.message,
      })
      .select()

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})