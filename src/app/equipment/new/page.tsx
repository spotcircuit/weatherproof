import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { EquipmentFormClient } from "./equipment-form-client"

export default async function NewEquipmentPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return <EquipmentFormClient />
}