'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Users, Phone, Mail, Calendar, X } from "lucide-react"
import { format } from 'date-fns/format'

interface CrewMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
  hourly_rate: number
}

interface Assignment {
  id: string
  crew_member_id: string
  assigned_date: string
  unassigned_date: string | null
  role: string | null
  notes: string | null
  crew_member?: CrewMember
}

export default function ProjectCrewAssignment({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableCrew, setAvailableCrew] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedCrew, setSelectedCrew] = useState<string>("")
  const [assignmentRole, setAssignmentRole] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [assignmentDate, setAssignmentDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchAssignments()
    fetchAvailableCrew()
  }, [projectId])

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('project_crew_assignments')
      .select(`
        *,
        crew_members (
          id,
          name,
          role,
          phone,
          email,
          hourly_rate
        )
      `)
      .eq('project_id', projectId)
      .is('unassigned_date', null)
      .order('assigned_date', { ascending: false })

    if (!error && data) {
      setAssignments(data.map(a => ({
        ...a,
        crew_member: a.crew_members
      })))
    }
    setLoading(false)
  }

  const fetchAvailableCrew = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('name')

    if (!error && data) {
      setAvailableCrew(data)
    }
  }

  const handleAssign = async () => {
    if (!selectedCrew) return

    const { error } = await supabase
      .from('project_crew_assignments')
      .insert({
        project_id: projectId,
        crew_member_id: selectedCrew,
        assigned_date: assignmentDate,
        role: assignmentRole || null,
        notes: assignmentNotes || null
      })

    if (!error) {
      setOpen(false)
      setSelectedCrew("")
      setAssignmentRole("")
      setAssignmentNotes("")
      setAssignmentDate(format(new Date(), 'yyyy-MM-dd'))
      fetchAssignments()
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    const { error } = await supabase
      .from('project_crew_assignments')
      .update({ unassigned_date: new Date().toISOString() })
      .eq('id', assignmentId)

    if (!error) {
      fetchAssignments()
    }
  }

  const assignedCrewIds = assignments.map(a => a.crew_member_id)
  const unassignedCrew = availableCrew.filter(c => !assignedCrewIds.includes(c.id))

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Crew Assignments
            </CardTitle>
            <CardDescription>Manage team members assigned to this project</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Crew
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Crew Member</DialogTitle>
                <DialogDescription>
                  Select a crew member to assign to this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Crew Member</Label>
                  <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crew member" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedCrew.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignment Date</Label>
                  <Input
                    type="date"
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Role (Optional)</Label>
                  <Input
                    placeholder="e.g., Team Lead, Safety Officer"
                    value={assignmentRole}
                    onChange={(e) => setAssignmentRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign} disabled={!selectedCrew}>
                  Assign to Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading crew assignments...</div>
        ) : assignments.length > 0 ? (
          <div className="divide-y">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                      {assignment.crew_member?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{assignment.crew_member?.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {assignment.crew_member?.role}
                        </Badge>
                        {assignment.role && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {assignment.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {assignment.crew_member?.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {assignment.crew_member?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Since {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-gray-500 mt-2">{assignment.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(assignment.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No crew members assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Assign Crew" to add team members</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}