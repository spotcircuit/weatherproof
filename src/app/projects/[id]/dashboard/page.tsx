import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { ProjectTaskDashboard } from "@/components/project-task-dashboard"
import { TaskKanbanView } from "@/components/task-kanban-view"
import { WeatherAlertsPanel } from "@/components/weather-alerts-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  FileText, 
  Clock,
  Calendar,
  ListTodo,
  CloudRain,
  Users,
  Wrench,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDashboardPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch project details
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      companies (
        id,
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error || !project) {
    redirect("/projects")
  }

  // Check if user has access to this project
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (userProfile?.company_id !== project.company_id) {
    redirect("/projects")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Link href="/projects" className="hover:text-blue-600">
                  Projects
                </Link>
                <span>/</span>
                <span>{project.name}</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="text-gray-600 mt-1">{project.address}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/projects/${project.id}/tasks/generate`}>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Tasks
                </Button>
              </Link>
              <Link href={`/projects/${project.id}/daily-log`}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Daily Log
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Task Summary Dashboard */}
        <ProjectTaskDashboard projectId={project.id} />

        {/* Weather Alerts Panel */}
        <div className="mt-8">
          <WeatherAlertsPanel projectId={project.id} />
        </div>

        {/* Tabbed Content */}
        <div className="mt-8">
          <Tabs defaultValue="kanban" className="space-y-4">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="crew" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crew
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Equipment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban" className="space-y-4">
              <TaskKanbanView projectId={project.id} view="kanban" />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <TaskKanbanView projectId={project.id} view="timeline" />
            </TabsContent>

            <TabsContent value="crew" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Crew Assignments</h3>
                <p className="text-gray-600">Crew assignment view coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Equipment Assignments</h3>
                <p className="text-gray-600">Equipment assignment view coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/projects/${project.id}/daily-report`}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View Daily Report</h3>
                  <p className="text-sm text-gray-600">Today's delays and progress</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/projects/${project.id}/weather`}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <CloudRain className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Weather Forecast</h3>
                  <p className="text-sm text-gray-600">72-hour outlook</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/projects/${project.id}/claim-report`}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Generate Claim Report</h3>
                  <p className="text-sm text-gray-600">Export for insurance</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}