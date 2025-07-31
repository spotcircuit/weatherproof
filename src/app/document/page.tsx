import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { SmartDocumentationWizard } from "@/components/smart-documentation-wizard"

export default async function DocumentPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's data
  const [projectsResult, crewResult, equipmentResult] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    
    supabase
      .from("crew_members")
      .select("*, project_crew_assignments(*)")
      .eq("user_id", user.id)
      .eq("status", "active"),
    
    supabase
      .from("equipment")
      .select("*, project_equipment_assignments(*)")
      .eq("user_id", user.id)
      .eq("status", "available")
  ])

  const projects = projectsResult.data || []
  const crew = crewResult.data || []
  const equipment = equipmentResult.data || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Project Events
          </h1>
          <p className="text-gray-600 mt-2">
            Quickly document delays, incidents, and other events that impact your projects
          </p>
        </div>

        <SmartDocumentationWizard
          projects={projects}
          crew={crew}
          equipment={equipment}
        />
      </div>
    </div>
  )
}