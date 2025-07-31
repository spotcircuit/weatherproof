import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import AuthenticatedLayout from "@/components/authenticated-layout"
import ProjectsClient from "./projects-client"

export default async function ProjectsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch projects with delay counts
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      delay_events (
        id,
        total_cost,
        start_time,
        end_time
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.active).length || 0
  const totalValue = projects?.reduce((sum, p) => {
    const delays = p.delay_events || []
    return sum + delays.reduce((dSum: number, d: any) => dSum + (d.total_cost || 0), 0)
  }, 0) || 0
  const totalDelays = projects?.reduce((sum, p) => sum + (p.delay_events?.length || 0), 0) || 0

  const stats = {
    totalProjects,
    activeProjects,
    totalValue,
    totalDelays
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ProjectsClient projects={projects || []} stats={stats} />
      </div>
    </div>
  )
}