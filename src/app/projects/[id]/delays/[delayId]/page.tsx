import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { DelayDetailClient } from "./delay-detail-client"

export default async function DelayDetailPage({
  params
}: {
  params: Promise<{ id: string; delayId: string }>
}) {
  const { id, delayId } = await params
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch delay details with project info
  const { data: delay } = await supabase
    .from("delay_events")
    .select(`
      *,
      projects\!inner(
        id,
        name,
        address,
        user_id
      )
    `)
    .eq("id", delayId)
    .single()

  if (!delay || delay.projects.user_id !== user.id) {
    redirect(`/projects/${id}`)
  }

  // Fetch weather readings around the delay time
  const { data: weatherData } = await supabase
    .from("project_weather")
    .select("*")
    .eq("project_id", id)
    .gte("collected_at", new Date(delay.start_time).toISOString())
    .lte("collected_at", delay.end_time || new Date().toISOString())
    .order("collected_at", { ascending: true })

  // Fetch photos if any
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("delay_event_id", delayId)
    .order("taken_at", { ascending: true })

  return (
    <DelayDetailClient
      delay={delay}
      project={delay.projects}
      weatherData={weatherData || []}
      photos={photos || []}
    />
  )
}
