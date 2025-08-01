'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  UserPlus, 
  UserMinus,
  DollarSign,
  Award,
  Building2,
  Calendar,
  AlertCircle
} from "lucide-react"
import { format } from 'date-fns/format'

interface CrewAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  onUpdate?: () => void
}

export default function CrewAssignmentsModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  onUpdate
}: CrewAssignmentsModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availableCrew, setAvailableCrew] = useState<any[]>([])
  const [assignedCrew, setAssignedCrew] = useState<any[]>([])
  const [selectedCrewId, setSelectedCrewId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCrewData()
    }
  }, [open, projectId])

  const fetchCrewData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all crew members
      const { data: allCrew } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name')

      // Fetch current assignments for this project
      const { data: assignments } = await supabase
        .from('project_crew_assignments')
        .select(`
          *,
          crew_members (
            id,
            name,
            role,
            hourly_rate,
            phone,
            email
          )
        `)
        .eq('project_id', projectId)
        .is('unassigned_date', null)

      // Fetch all active assignments to show where crew are assigned
      const { data: allAssignments } = await supabase
        .from('project_crew_assignments')
        .select(`
          crew_member_id,
          project_id,
          projects (
            id,
            name
          )
        `)
        .is('unassigned_date', null)

      // Create a map of crew member to their current projects
      const crewProjectMap = new Map()
      allAssignments?.forEach(assignment => {
        if (!crewProjectMap.has(assignment.crew_member_id)) {
          crewProjectMap.set(assignment.crew_member_id, [])
        }
        crewProjectMap.get(assignment.crew_member_id).push(assignment.projects)
      })

      // Filter out already assigned crew from available list
      const assignedIds = assignments?.map(a => a.crew_member_id) || []
      const available = allCrew?.filter(c => !assignedIds.includes(c.id)) || []
      
      // Add current project info to available crew
      const availableWithProjects = available.map(crew => ({
        ...crew,
        currentProjects: crewProjectMap.get(crew.id) || []
      }))

      setAvailableCrew(availableWithProjects)
      setAssignedCrew(assignments || [])
    } catch (error) {
      console.error('Error fetching crew data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCrew = async () => {
    if (!selectedCrewId) return

    setIsAssigning(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('project_crew_assignments')
        .insert({
          project_id: projectId,
          crew_member_id: selectedCrewId,
          assigned_date: new Date().toISOString()
        })

      if (error) {
        console.error('Crew assignment insert error:', error)
        throw new Error(`Failed to assign crew member: ${error.message || JSON.stringify(error)}`)
      }

      await fetchCrewData()
      setSelectedCrewId("")
      if (onUpdate) onUpdate()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign crew member'
      console.error('Crew assignment error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        projectId,
        selectedCrewId
      })
      alert(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignCrew = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('project_crew_assignments')
        .update({ unassigned_date: new Date().toISOString() })
        .eq('id', assignmentId)

      if (error) {
        console.error('Crew unassignment update error:', error)
        throw new Error(`Failed to unassign crew member: ${error.message || JSON.stringify(error)}`)
      }

      await fetchCrewData()
      if (onUpdate) onUpdate()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unassign crew member'
      console.error('Crew unassignment error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        assignmentId
      })
      alert(errorMessage)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Foreman': 'bg-purple-100 text-purple-700',
      'Superintendent': 'bg-blue-100 text-blue-700',
      'Project Manager': 'bg-green-100 text-green-700',
      'Carpenter': 'bg-orange-100 text-orange-700',
      'Electrician': 'bg-yellow-100 text-yellow-700',
      'Plumber': 'bg-cyan-100 text-cyan-700',
      'Mason': 'bg-red-100 text-red-700',
      'Laborer': 'bg-gray-100 text-gray-700',
    }
    return roleColors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Crew Assignments
          </DialogTitle>
          <DialogDescription>
            Assign crew members to {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Add Crew Member Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Crew Member</h3>
            <div className="flex gap-3">
              <Select value={selectedCrewId} onValueChange={setSelectedCrewId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a crew member to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableCrew.length > 0 ? (
                    availableCrew.map((crew) => (
                      <SelectItem key={crew.id} value={crew.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{crew.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({crew.role})</span>
                          </div>
                          {crew.currentProjects.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {crew.currentProjects.length} projects
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 p-2">
                      No available crew members
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssignCrew} 
                disabled={!selectedCrewId || isAssigning}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign
              </Button>
            </div>
            
            {/* Show where selected crew member is currently assigned */}
            {selectedCrewId && (() => {
              const selectedCrew = availableCrew.find(c => c.id === selectedCrewId)
              return selectedCrew?.currentProjects.length > 0 ? (
                <div className="mt-3 p-3 bg-amber-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Currently assigned to:</p>
                      <ul className="mt-1 space-y-0.5">
                        {selectedCrew.currentProjects.map((project: any) => (
                          <li key={project.id} className="text-amber-700">
                            • {project.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null
            })()}
          </div>

          {/* Assigned Crew Members */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Assigned Crew ({assignedCrew.length})
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : assignedCrew.length > 0 ? (
              <div className="space-y-3">
                {assignedCrew.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {assignment.crew_members.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {assignment.crew_members.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={getRoleBadgeColor(assignment.crew_members.role)}>
                                <Award className="mr-1 h-3 w-3" />
                                {assignment.crew_members.role}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                ${assignment.crew_members.hourly_rate}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          {assignment.crew_members.phone && (
                            <span>{assignment.crew_members.phone}</span>
                          )}
                          {assignment.crew_members.email && (
                            <span>{assignment.crew_members.email}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Assigned {format(new Date(assignment.assigned_date), 'PP')}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassignCrew(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 mt-2">No crew assigned to this project yet</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {assignedCrew.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Total Crew</p>
                  <p className="font-medium text-blue-900">{assignedCrew.length} members</p>
                </div>
                <div>
                  <p className="text-blue-600">Total Hourly Cost</p>
                  <p className="font-medium text-blue-900">
                    ${assignedCrew.reduce((sum, a) => sum + (a.crew_members.hourly_rate || 0), 0)}/hr
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}