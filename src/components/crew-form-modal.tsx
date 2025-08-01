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

interface CrewFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId?: string
  memberData?: any
  onSuccess?: () => void
}

export default function CrewFormModal({
  open,
  onOpenChange,
  memberId,
  memberData,
  onSuccess
}: CrewFormModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    hourlyRate: "",
    notes: "",
    projectId: ""
  })

  useEffect(() => {
    if (memberData) {
      setFormData({
        name: memberData.name || "",
        role: memberData.role || "",
        phone: memberData.phone || "",
        email: memberData.email || "",
        hourlyRate: memberData.hourly_rate?.toString() || "",
        notes: memberData.notes || "",
        projectId: ""
      })
    } else {
      // Reset form when creating new
      setFormData({
        name: "",
        role: "",
        phone: "",
        email: "",
        hourlyRate: "",
        notes: "",
        projectId: ""
      })
    }
    
    // Fetch projects and current assignment
    if (open) {
      fetchProjects()
      if (memberId) {
        fetchCurrentAssignment()
      }
    }
  }, [memberData, open, memberId])

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
      .from('project_crew_assignments')
      .select('project_id')
      .eq('crew_member_id', memberId)
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
        role: formData.role,
        phone: formData.phone || null,
        email: formData.email || null,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        notes: formData.notes || null
      }

      let crewMemberId = memberId

      if (memberId) {
        // Update existing member
        const { error: updateError } = await supabase
          .from("crew_members")
          .update(payload)
          .eq("id", memberId)
          .eq("user_id", user.id)

        if (updateError) {
          console.error('Crew member update error:', updateError)
          throw new Error(`Failed to update crew member: ${updateError.message}`)
        }

        // Handle project assignment change
        if (formData.projectId !== currentProjectId) {
          // Remove old assignment if exists
          if (currentProjectId) {
            await supabase
              .from('project_crew_assignments')
              .update({ unassigned_date: new Date().toISOString() })
              .eq('crew_member_id', memberId)
              .eq('project_id', currentProjectId)
              .is('unassigned_date', null)
          }

          // Add new assignment if selected
          if (formData.projectId) {
            await supabase
              .from('project_crew_assignments')
              .insert({
                crew_member_id: memberId,
                project_id: formData.projectId,
                assigned_date: new Date().toISOString()
              })
          }
        }
      } else {
        // Create new member
        const { data: insertData, error: insertError } = await supabase
          .from("crew_members")
          .insert(payload)
          .select()
          .single()

        if (insertError) {
          console.error('Crew member insert error:', insertError)
          throw new Error(`Failed to create crew member: ${insertError.message}`)
        }

        crewMemberId = insertData.id

        // Assign to project if selected
        if (formData.projectId) {
          await supabase
            .from('project_crew_assignments')
            .insert({
              crew_member_id: crewMemberId,
              project_id: formData.projectId,
              assigned_date: new Date().toISOString()
            })
        }
      }

      toast.success(memberId ? 'Crew member updated' : 'Crew member added')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error('Crew form submit error:', err)
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
          <DialogTitle>{memberId ? "Edit Crew Member" : "Add Crew Member"}</DialogTitle>
          <DialogDescription>
            {memberId ? "Update crew member details" : "Add a new crew member to your team"}
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
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role*</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Foreman">Foreman</SelectItem>
                  <SelectItem value="Superintendent">Superintendent</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Carpenter">Carpenter</SelectItem>
                  <SelectItem value="Electrician">Electrician</SelectItem>
                  <SelectItem value="Plumber">Plumber</SelectItem>
                  <SelectItem value="Mason">Mason</SelectItem>
                  <SelectItem value="Laborer">Laborer</SelectItem>
                  <SelectItem value="Equipment Operator">Equipment Operator</SelectItem>
                  <SelectItem value="Safety Manager">Safety Manager</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)*</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="45.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
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
              {loading ? "Saving..." : memberId ? "Update Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}