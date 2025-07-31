import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { CrewFormClient } from "./crew-form-client"

export default async function NewCrewMemberPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return <CrewFormClient />
}