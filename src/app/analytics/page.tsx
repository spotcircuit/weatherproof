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
    .from("delay_events")
    .select(`
      *,
      projects!inner(
        name,
        user_id,
        project_type
      )
    `)
    .eq("projects.user_id", user.id)
    .gte("start_time", thirtyDaysAgo.toISOString())
    .order("start_time", { ascending: true })

  // Fetch all projects for the user
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)

  // Fetch weather readings for trend analysis
  const { data: weatherReadings } = await supabase
    .from("weather_readings")
    .select(`
      *,
      projects!inner(
        name,
        user_id
      )
    `)
    .eq("projects.user_id", user.id)
    .gte("timestamp", thirtyDaysAgo.toISOString())
    .order("timestamp", { ascending: true })

  return (
    <AnalyticsClient 
      delayEvents={delayEvents || []}
      projects={projects || []}
      weatherReadings={weatherReadings || []}
    />
  )
}