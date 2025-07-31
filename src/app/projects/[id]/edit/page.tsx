import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { ProjectEditClient } from "./project-edit-client"

export default async function ProjectEditPage({
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

  // Fetch project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (!project || project.user_id !== user.id) {
    redirect("/projects")
  }

  return <ProjectEditClient project={project} />
}