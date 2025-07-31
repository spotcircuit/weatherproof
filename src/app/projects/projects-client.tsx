'use client'

import { useState } from "react"
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
  Upload,
  Download
} from "lucide-react"
import Link from "next/link"
import { format } from 'date-fns/format'
import ProjectFormModal from "@/components/project-form-modal"
import CSVImportModal from "@/components/csv-import-modal"
import { CSVExporter } from "@/services/csv-import-export"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProjectsClientProps {
  projects: any[]
  stats: {
    totalProjects: number
    activeProjects: number
    totalValue: number
    totalDelays: number
  }
}

export default function ProjectsClient({ projects: initialProjects, stats }: ProjectsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState(initialProjects)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProject, setDeletingProject] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterActive, setFilterActive] = useState(false)
  const [filterDelays, setFilterDelays] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const handleEditProject = (project: any) => {
    setSelectedProject(project)
    setShowProjectModal(true)
  }

  const handleDeleteProject = async () => {
    if (!deletingProject) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deletingProject.id)

      if (error) throw error

      setProjects(projects.filter(p => p.id !== deletingProject.id))
      setShowDeleteDialog(false)
      setDeletingProject(null)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleProjectSuccess = () => {
    router.refresh()
  }

  const handleExportCSV = () => {
    const csv = CSVExporter.exportToCSV(projects, 'projects')
    CSVExporter.downloadCSV(csv, `projects_export_${new Date().toISOString().split('T')[0]}.csv`)
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = !filterActive || project.active
    const matchesDelays = !filterDelays || (project.delay_events && project.delay_events.length > 0)
    
    return matchesSearch && matchesActive && matchesDelays
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your construction projects and weather monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => {
            setSelectedProject(null)
            setShowProjectModal(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-blue-900">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{stats.totalProjects}</div>
            <p className="text-sm text-blue-700 mt-1">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-orange-900">Total Delays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{stats.totalDelays}</div>
            <p className="text-sm text-orange-700 mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-green-900">Documented Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">${stats.totalValue.toLocaleString()}</div>
            <p className="text-sm text-green-700 mt-1">
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
            className="pl-10 bg-white shadow-sm border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant={filterActive ? "default" : "outline"} 
          className={filterActive ? "" : "bg-white shadow-sm hover:bg-gray-50"}
          onClick={() => setFilterActive(!filterActive)}
        >
          Active Only
        </Button>
        <Button 
          variant={filterDelays ? "default" : "outline"} 
          className={filterDelays ? "" : "bg-white shadow-sm hover:bg-gray-50"}
          onClick={() => setFilterDelays(!filterDelays)}
        >
          Has Delays
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const activeDelay = project.delay_events?.find((d: any) => !d.end_time)
            const totalDelays = project.delay_events?.length || 0
            const delayCost = project.delay_events?.reduce((sum: number, d: any) => sum + (d.total_cost || 0), 0) || 0
            
            return (
              <Card key={project.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <Link href={`/projects/${project.id}`} className="hover:text-blue-600">
                          {project.name}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {project.address}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setDeletingProject(project)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {activeDelay && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
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
                        <Button variant="outline" size="sm" className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300">
                          View Details
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="hover:bg-gray-50">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterActive || filterDelays ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm || filterActive || filterDelays 
                ? "Try adjusting your search or filters" 
                : "Get started by creating your first project or importing existing projects from a CSV file."}
            </p>
            {!searchTerm && !filterActive && !filterDelays && (
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button onClick={() => {
                  setSelectedProject(null)
                  setShowProjectModal(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        projectId={selectedProject?.id}
        projectData={selectedProject}
        onSuccess={handleProjectSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone.
              All associated data including weather readings, delay events, and reports will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        type="projects"
        onSuccess={handleProjectSuccess}
      />
    </div>
  )
}