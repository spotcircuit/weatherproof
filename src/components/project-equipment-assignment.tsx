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
import { Wrench, Plus, Calendar, X, AlertCircle } from "lucide-react"
import { format } from 'date-fns/format'

interface Equipment {
  id: string
  name: string
  type: string
  status: string
  daily_rate: number | null
}

interface Assignment {
  id: string
  equipment_id: string
  assigned_date: string
  unassigned_date: string | null
  quantity: number
  notes: string | null
  equipment?: Equipment
}

export default function ProjectEquipmentAssignment({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")
  const [quantity, setQuantity] = useState("1")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [assignmentDate, setAssignmentDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchAssignments()
    fetchAvailableEquipment()
  }, [projectId])

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('project_equipment_assignments')
      .select(`
        *,
        equipment (
          id,
          name,
          type,
          status,
          daily_rate
        )
      `)
      .eq('project_id', projectId)
      .is('unassigned_date', null)
      .order('assigned_date', { ascending: false })

    if (!error && data) {
      setAssignments(data.map(a => ({
        ...a,
        equipment: a.equipment
      })))
    }
    setLoading(false)
  }

  const fetchAvailableEquipment = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'available')
      .order('name')

    if (!error && data) {
      setAvailableEquipment(data)
    }
  }

  const handleAssign = async () => {
    if (!selectedEquipment) return

    const { error } = await supabase
      .from('project_equipment_assignments')
      .insert({
        project_id: projectId,
        equipment_id: selectedEquipment,
        assigned_date: assignmentDate,
        quantity: parseInt(quantity) || 1,
        notes: assignmentNotes || null
      })

    if (!error) {
      setOpen(false)
      setSelectedEquipment("")
      setQuantity("1")
      setAssignmentNotes("")
      setAssignmentDate(format(new Date(), 'yyyy-MM-dd'))
      fetchAssignments()
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    const { error } = await supabase
      .from('project_equipment_assignments')
      .update({ unassigned_date: new Date().toISOString() })
      .eq('id', assignmentId)

    if (!error) {
      fetchAssignments()
    }
  }

  const assignedEquipmentIds = assignments.map(a => a.equipment_id)
  const unassignedEquipment = availableEquipment.filter(e => !assignedEquipmentIds.includes(e.id))

  const totalDailyCost = assignments.reduce((sum, a) => 
    sum + ((a.equipment?.daily_rate || 0) * a.quantity), 0
  )

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-600" />
              Equipment Assignments
            </CardTitle>
            <CardDescription>Manage equipment assigned to this project</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="mr-2 h-4 w-4" />
                Assign Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Equipment</DialogTitle>
                <DialogDescription>
                  Select equipment to assign to this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedEquipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                            {item.daily_rate && (
                              <span className="text-xs text-gray-500">
                                ${item.daily_rate}/day
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignment Date</Label>
                    <Input
                      type="date"
                      value={assignmentDate}
                      onChange={(e) => setAssignmentDate(e.target.value)}
                    />
                  </div>
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
                <Button onClick={handleAssign} disabled={!selectedEquipment}>
                  Assign to Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {totalDailyCost > 0 && (
          <div className="p-4 bg-amber-50 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-amber-900">Total Daily Equipment Cost</span>
            <span className="text-lg font-bold text-amber-700">${totalDailyCost.toLocaleString()}/day</span>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading equipment assignments...</div>
        ) : assignments.length > 0 ? (
          <div className="divide-y">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{assignment.equipment?.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {assignment.equipment?.type}
                        </Badge>
                        {assignment.quantity > 1 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            Qty: {assignment.quantity}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Since {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {assignment.equipment?.daily_rate && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-medium text-amber-700">
                            ${(assignment.equipment.daily_rate * assignment.quantity).toLocaleString()}/day
                          </span>
                        </div>
                      )}
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
              <Wrench className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No equipment assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Assign Equipment" to add equipment</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}