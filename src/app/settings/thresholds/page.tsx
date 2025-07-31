import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { ThresholdTemplatesClient } from "./threshold-templates-client"

export default async function ThresholdTemplatesPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch threshold templates
  const { data: templates } = await supabase
    .from("weather_threshold_templates")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("user_id", { ascending: true, nullsFirst: true })
    .order("name")

  return <ThresholdTemplatesClient templates={templates || []} />
}