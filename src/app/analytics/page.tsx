import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { AnalyticsClient } from "./analytics-client"

export default async function AnalyticsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch analytics data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch delay events for the last 30 days
  const { data: delayEvents } = await supabase
    .from("task_daily_logs")
    .select(`
      *,
      project_tasks!inner(
        project_id,
        name,
        projects!inner(
          name,
          user_id,
          project_type
        )
      )
    `)
    .eq("project_tasks.projects.user_id", user.id)
    .eq("delayed", true)
    .gte("log_date", thirtyDaysAgo.toISOString().split('T')[0])
    .order("log_date", { ascending: true })

  // Fetch all projects for the user
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)

  // Fetch weather readings for trend analysis
  const { data: weatherReadings } = await supabase
    .from("project_weather")
    .select(`
      *,
      projects!inner(
        name,
        user_id
      )
    `)
    .eq("projects.user_id", user.id)
    .gte("collected_at", thirtyDaysAgo.toISOString())
    .order("collected_at", { ascending: true })

  return (
    <AnalyticsClient 
      delayEvents={delayEvents || []}
      projects={projects || []}
      weatherReadings={weatherReadings || []}
    />
  )
}