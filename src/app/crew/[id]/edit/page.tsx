import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { CrewEditClient } from "./crew-edit-client"

export default async function EditCrewMemberPage({
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

  // Fetch crew member details
  const { data: crewMember } = await supabase
    .from("crew_members")
    .select("*")
    .eq("id", id)
    .single()

  if (!crewMember || crewMember.user_id !== user.id) {
    redirect("/crew")
  }

  return <CrewEditClient crewMember={crewMember} />
}