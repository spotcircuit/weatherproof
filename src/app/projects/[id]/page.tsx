import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { ProjectDetailClient } from "./project-detail-client"

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (!project || project.user_id !== user.id) {
    redirect("/projects")
  }

  // Fetch delay events
  const { data: delayEvents } = await supabase
    .from("delay_events")
    .select("*")
    .eq("project_id", id)
    .order("start_time", { ascending: false })

  // Fetch recent weather readings
  const { data: recentWeather } = await supabase
    .from("weather_readings")
    .select("*")
    .eq("project_id", id)
    .order("timestamp", { ascending: false })
    .limit(1)

  // Fetch reports
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  return (
    <ProjectDetailClient
      project={project}
      delayEvents={delayEvents || []}
      recentWeather={recentWeather || []}
      reports={reports || []}
    />
  )
}