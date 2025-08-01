'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"

interface EquipmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId?: string
  equipmentData?: any
  onSuccess?: () => void
}

export default function EquipmentFormModal({
  open,
  onOpenChange,
  equipmentId,
  equipmentData,
  onSuccess
}: EquipmentFormModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    dailyRate: "",
    notes: "",
    projectId: ""
  })

  useEffect(() => {
    if (equipmentData) {
      setFormData({
        name: equipmentData.name || "",
        type: equipmentData.type || "",
        dailyRate: equipmentData.daily_rate?.toString() || "",
        notes: equipmentData.notes || "",
        projectId: ""
      })
    } else {
      // Reset form when creating new
      setFormData({
        name: "",
        type: "",
        dailyRate: "",
        notes: "",
        projectId: ""
      })
    }
    
    // Fetch projects and current assignment
    if (open) {
      fetchProjects()
      if (equipmentId) {
        fetchCurrentAssignment()
      }
    }
  }, [equipmentData, open, equipmentId])

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('id, name, location')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('name')

    setProjects(data || [])
  }

  const fetchCurrentAssignment = async () => {
    const { data } = await supabase
      .from('project_equipment_assignments')
      .select('project_id')
      .eq('equipment_id', equipmentId)
      .is('unassigned_date', null)
      .single()

    if (data) {
      setCurrentProjectId(data.project_id)
      setFormData(prev => ({ ...prev, projectId: data.project_id }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const payload = {
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        daily_rate: parseFloat(formData.dailyRate) || null,
        notes: formData.notes || null,
        active: true
      }

      let equipmentIdToUse = equipmentId

      if (equipmentId) {
        // Update existing equipment
        const { error: updateError } = await supabase
          .from("equipment")
          .update(payload)
          .eq("id", equipmentId)
          .eq("user_id", user.id)

        if (updateError) {
          console.error('Equipment update error:', updateError)
          throw new Error(`Failed to update equipment: ${updateError.message}`)
        }

        // Handle project assignment change
        if (formData.projectId !== currentProjectId) {
          // Remove old assignment if exists
          if (currentProjectId) {
            await supabase
              .from('project_equipment_assignments')
              .update({ unassigned_date: new Date().toISOString() })
              .eq('equipment_id', equipmentId)
              .eq('project_id', currentProjectId)
              .is('unassigned_date', null)
          }

          // Add new assignment if selected
          if (formData.projectId) {
            await supabase
              .from('project_equipment_assignments')
              .insert({
                equipment_id: equipmentId,
                project_id: formData.projectId,
                assigned_date: new Date().toISOString()
              })
          }
        }
      } else {
        // Create new equipment
        const { data: insertData, error: insertError } = await supabase
          .from("equipment")
          .insert(payload)
          .select()
          .single()

        if (insertError) {
          console.error('Equipment insert error:', insertError)
          throw new Error(`Failed to create equipment: ${insertError.message}`)
        }

        equipmentIdToUse = insertData.id

        // Assign to project if selected
        if (formData.projectId) {
          await supabase
            .from('project_equipment_assignments')
            .insert({
              equipment_id: equipmentIdToUse,
              project_id: formData.projectId,
              assigned_date: new Date().toISOString()
            })
        }
      }

      toast.success(equipmentId ? 'Equipment updated' : 'Equipment added')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error('Equipment form submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{equipmentId ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
          <DialogDescription>
            {equipmentId ? "Update equipment details" : "Add new equipment to your inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Excavator #1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type*</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excavator">Excavator</SelectItem>
                  <SelectItem value="Bulldozer">Bulldozer</SelectItem>
                  <SelectItem value="Crane">Crane</SelectItem>
                  <SelectItem value="Forklift">Forklift</SelectItem>
                  <SelectItem value="Backhoe">Backhoe</SelectItem>
                  <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                  <SelectItem value="Concrete Mixer">Concrete Mixer</SelectItem>
                  <SelectItem value="Generator">Generator</SelectItem>
                  <SelectItem value="Compressor">Compressor</SelectItem>
                  <SelectItem value="Scaffolding">Scaffolding</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyRate">Daily Rate ($)</Label>
              <Input
                id="dailyRate"
                name="dailyRate"
                type="number"
                step="0.01"
                value={formData.dailyRate}
                onChange={handleChange}
                placeholder="500.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Assigned Project</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : equipmentId ? "Update Equipment" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}