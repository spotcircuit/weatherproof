import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import WeatherDashboard from "./weather-dashboard"

export default async function WeatherPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all active projects with their latest weather
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      project_weather!left(
        *
      )
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .eq("weather_collection_enabled", true)
    .order("name")

  // Process to get only the latest weather for each project
  const projectsWithLatestWeather = projects?.map(project => ({
    ...project,
    latestWeather: project.project_weather
      ?.sort((a: any, b: any) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())[0]
  })) || []

  // Fetch weather alerts
  const { data: weatherAlerts } = await supabase
    .from("project_weather")
    .select(`
      *,
      projects!inner(
        id,
        name,
        latitude,
        longitude,
        timezone
      )
    `)
    .eq("projects.user_id", user.id)
    .eq("has_alerts", true)
    .gte("collected_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order("collected_at", { ascending: false })

  return (
    <WeatherDashboard 
      projects={projectsWithLatestWeather}
      weatherAlerts={weatherAlerts || []}
    />
  )
}