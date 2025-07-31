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
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "available",
    dailyRate: "",
    notes: ""
  })

  useEffect(() => {
    if (equipmentData) {
      setFormData({
        name: equipmentData.name || "",
        type: equipmentData.type || "",
        status: equipmentData.status || "available",
        dailyRate: equipmentData.daily_rate?.toString() || "",
        notes: equipmentData.notes || ""
      })
    } else {
      // Reset form when creating new
      setFormData({
        name: "",
        type: "",
        status: "available",
        dailyRate: "",
        notes: ""
      })
    }
  }, [equipmentData, open])

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
        status: formData.status,
        daily_rate: parseFloat(formData.dailyRate) || null,
        notes: formData.notes || null
      }

      if (equipmentId) {
        const { error: updateError } = await supabase
          .from("equipment")
          .update(payload)
          .eq("id", equipmentId)
          .eq("user_id", user.id)

        if (updateError) {
          console.error('Equipment update error:', updateError)
          throw new Error(`Failed to update equipment: ${updateError.message || JSON.stringify(updateError)}`)
        }
      } else {
        const { error: insertError } = await supabase
          .from("equipment")
          .insert(payload)

        if (insertError) {
          console.error('Equipment insert error:', insertError)
          throw new Error(`Failed to create equipment: ${insertError.message || JSON.stringify(insertError)}`)
        }
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error('Equipment form submit error:', {
        error: err,
        message: errorMessage,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2),
        operation: equipmentId ? 'update' : 'create',
        equipmentId
      })
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
                placeholder="CAT 320 Excavator"
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
                  <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                  <SelectItem value="Backhoe">Backhoe</SelectItem>
                  <SelectItem value="Forklift">Forklift</SelectItem>
                  <SelectItem value="Concrete Mixer">Concrete Mixer</SelectItem>
                  <SelectItem value="Generator">Generator</SelectItem>
                  <SelectItem value="Compressor">Compressor</SelectItem>
                  <SelectItem value="Scaffolding">Scaffolding</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status*</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information, maintenance schedule, etc..."
                rows={3}
              />
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