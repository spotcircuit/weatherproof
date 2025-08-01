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
  Wrench, 
  Plus, 
  Trash2,
  DollarSign,
  Building2,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format } from 'date-fns/format'

interface EquipmentAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  onUpdate?: () => void
}

export default function EquipmentAssignmentsModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  onUpdate
}: EquipmentAssignmentsModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([])
  const [assignedEquipment, setAssignedEquipment] = useState<any[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      fetchEquipmentData()
    }
  }, [open, projectId])

  const fetchEquipmentData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all equipment
      const { data: allEquipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name')

      // Fetch current assignments for this project
      const { data: assignments } = await supabase
        .from('project_equipment_assignments')
        .select(`
          *,
          equipment (
            id,
            name,
            type,
            hourly_rate,
            model,
            year,
            status
          )
        `)
        .eq('project_id', projectId)
        .is('unassigned_date', null)

      // Fetch all active assignments to show where equipment is assigned
      const { data: allAssignments } = await supabase
        .from('project_equipment_assignments')
        .select(`
          equipment_id,
          project_id,
          projects (
            id,
            name
          )
        `)
        .is('unassigned_date', null)

      // Create a map of equipment to their current projects
      const equipmentProjectMap = new Map()
      allAssignments?.forEach(assignment => {
        if (!equipmentProjectMap.has(assignment.equipment_id)) {
          equipmentProjectMap.set(assignment.equipment_id, [])
        }
        equipmentProjectMap.get(assignment.equipment_id).push(assignment.projects)
      })

      // Filter out already assigned equipment from available list
      const assignedIds = assignments?.map(a => a.equipment_id) || []
      const available = allEquipment?.filter(e => !assignedIds.includes(e.id)) || []
      
      // Add current project info to available equipment
      const availableWithProjects = available.map(equipment => ({
        ...equipment,
        currentProjects: equipmentProjectMap.get(equipment.id) || []
      }))

      setAvailableEquipment(availableWithProjects)
      setAssignedEquipment(assignments || [])
    } catch (error) {
      console.error('Error fetching equipment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignEquipment = async () => {
    if (!selectedEquipmentId) return

    setIsAssigning(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('project_equipment_assignments')
        .insert({
          project_id: projectId,
          equipment_id: selectedEquipmentId,
          assigned_date: new Date().toISOString()
        })

      if (error) {
        console.error('Error assigning equipment:', error)
        return
      }

      // Refresh data
      await fetchEquipmentData()
      setSelectedEquipmentId("")
      
      // Call parent update if provided
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error assigning equipment:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignEquipment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('project_equipment_assignments')
        .update({ 
          unassigned_date: new Date().toISOString() 
        })
        .eq('id', assignmentId)

      if (error) {
        console.error('Error unassigning equipment:', error)
        return
      }

      // Refresh data
      await fetchEquipmentData()
      
      // Call parent update if provided
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error unassigning equipment:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Manage Equipment for {projectName}
          </DialogTitle>
          <DialogDescription>
            Assign or remove equipment from this project
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assign New Equipment */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Assign Equipment</h3>
              <div className="flex gap-2">
                <Select
                  value={selectedEquipmentId}
                  onValueChange={setSelectedEquipmentId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select equipment to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No available equipment
                      </div>
                    ) : (
                      availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-medium">{equipment.name}</span>
                              <span className="text-gray-500 ml-2">({equipment.type})</span>
                              {equipment.hourly_rate && (
                                <span className="text-green-600 ml-2">
                                  ${equipment.hourly_rate}/hr
                                </span>
                              )}
                            </div>
                            {equipment.currentProjects.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {equipment.currentProjects.length} project{equipment.currentProjects.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAssignEquipment}
                  disabled={!selectedEquipmentId || isAssigning}
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
              {selectedEquipmentId && (
                <div className="mt-2 text-sm text-gray-500">
                  {availableEquipment.find(e => e.id === selectedEquipmentId)?.currentProjects.map((p: any) => (
                    <span key={p.id} className="mr-2">
                      Also assigned to: {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Equipment List */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                Currently Assigned Equipment
                <Badge variant="secondary">{assignedEquipment.length}</Badge>
              </h3>
              
              {assignedEquipment.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No equipment assigned to this project yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedEquipment.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{assignment.equipment.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{assignment.equipment.type}</span>
                              {assignment.equipment.model && (
                                <span>{assignment.equipment.model}</span>
                              )}
                              {assignment.equipment.hourly_rate && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${assignment.equipment.hourly_rate}/hr
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Since {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUnassignEquipment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}