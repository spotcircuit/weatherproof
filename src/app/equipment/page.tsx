import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import EquipmentClient from "./equipment-client"

export default async function EquipmentPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch equipment
  const { data: equipment } = await supabase
    .from("equipment")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  // Fetch assignments count for each equipment
  const equipmentWithAssignments = await Promise.all(
    (equipment || []).map(async (item) => {
      const { count } = await supabase
        .from("project_equipment_assignments")
        .select("*", { count: 'exact', head: true })
        .eq("equipment_id", item.id)
        .is("unassigned_date", null)
      
      return { ...item, activeProjects: count || 0 }
    })
  )

  const availableCount = equipment?.filter(e => e.status === 'available').length || 0
  const inUseCount = equipment?.filter(e => e.status === 'in_use').length || 0
  const totalValue = equipment?.reduce((sum, e) => sum + (e.daily_rate || 0), 0) || 0

  const stats = {
    total: equipment?.length || 0,
    availableCount,
    totalValue,
    inUseCount
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-red-50/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EquipmentClient equipment={equipmentWithAssignments} stats={stats} />
      </div>
    </div>
  )
}