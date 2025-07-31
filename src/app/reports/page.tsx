import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import ReportsWizardClient from './reports-wizard-client'

export default async function ReportsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all necessary data for the wizard
  const [projectsResponse, delaysResponse] = await Promise.all([
    // Get all user projects
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("active", { ascending: false })
      .order("name"),
    
    // Get recent delay events (last 30 days)
    supabase
      .from("delay_events")
      .select(`
        *,
        projects!inner (
          id,
          name,
          user_id
        )
      `)
      .eq("projects.user_id", user.id)
      .gte("start_time", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: false })
  ])

  const projects = projectsResponse.data || []
  const allDelays = delaysResponse.data || []
  
  // Separate active delays (no end_time) from recent delays
  const activeDelays = allDelays.filter(d => !d.end_time)
  const recentDelays = allDelays

  return <ReportsWizardClient 
    projects={projects} 
    recentDelays={recentDelays}
    activeDelays={activeDelays}
  />
}