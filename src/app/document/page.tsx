import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { SmartDelayDocumentation } from "@/components/smart-delay-documentation"

export default async function DocumentPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's active projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="container mx-auto px-4 py-8">
        <SmartDelayDocumentation 
          projects={projects || []}
          onComplete={() => {
            window.location.href = '/dashboard'
          }}
        />
      </div>
    </div>
  )
}