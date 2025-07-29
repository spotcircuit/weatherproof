import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Upload
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ProjectsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch projects with delay counts
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      delay_events (
        id,
        total_cost,
        start_time,
        end_time
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.active).length || 0
  const totalValue = projects?.reduce((sum, p) => {
    const delays = p.delay_events || []
    return sum + delays.reduce((dSum: number, d: any) => dSum + (d.total_cost || 0), 0)
  }, 0) || 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your construction projects and weather monitoring</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Delays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects?.reduce((sum, p) => sum + (p.delay_events?.length || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Documented Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total delay costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Active Only
        </Button>
        <Button variant="outline">
          Has Delays
        </Button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const activeDelay = project.delay_events?.find((d: any) => !d.end_time)
            const totalDelays = project.delay_events?.length || 0
            const delayCost = project.delay_events?.reduce((sum: number, d: any) => sum + (d.total_cost || 0), 0) || 0
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <Link href={`/projects/${project.id}`} className="hover:text-blue-600">
                          {project.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.address}
                        </div>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {activeDelay && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Active Weather Delay
                      </span>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Project Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium capitalize">{project.project_type || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className={`font-medium ${project.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {project.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Crew Size</p>
                        <p className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.crew_size}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rate</p>
                        <p className="font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {project.hourly_rate}/hr
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        Started {format(new Date(project.start_date), 'MMM d, yyyy')}
                      </div>
                      {project.end_date && (
                        <div className="text-sm text-gray-500 mt-1">
                          Ended {format(new Date(project.end_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    {/* Delay Stats */}
                    {totalDelays > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Weather Delays</span>
                          <span className="font-medium">{totalDelays}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-500">Cost Impact</span>
                          <span className="font-medium text-orange-600">
                            ${delayCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/projects/${project.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get started by creating your first project or importing existing projects from a CSV file.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/projects/import">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              </Link>
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}