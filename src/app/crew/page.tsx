import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import CrewClient from "./crew-client"

export default async function CrewPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch crew members
  const { data: crewMembers } = await supabase
    .from("crew_members")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  // Fetch assignments count for each crew member
  const crewWithAssignments = await Promise.all(
    (crewMembers || []).map(async (member) => {
      const { count } = await supabase
        .from("project_crew_assignments")
        .select("*", { count: 'exact', head: true })
        .eq("crew_member_id", member.id)
        .is("unassigned_date", null)
      
      return { ...member, activeProjects: count || 0 }
    })
  )

  const activeCount = crewMembers?.filter(m => m.status === 'active').length || 0
  const totalPayroll = crewMembers?.reduce((sum, m) => sum + (m.hourly_rate || 0), 0) || 0
  const averageRate = crewMembers?.length ? totalPayroll / crewMembers.length : 0

  const stats = {
    total: crewMembers?.length || 0,
    activeCount,
    totalPayroll,
    averageRate
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <CrewClient crewMembers={crewWithAssignments} stats={stats} />
      </div>
    </div>
  )
}