import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return <SettingsClient />
}