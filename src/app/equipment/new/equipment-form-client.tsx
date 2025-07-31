'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import NavigationHeader from "@/components/navigation-header"
import { 
  Save, 
  Plus,
  ArrowLeft,
  DollarSign,
  Wrench,
  Calendar,
  FileText,
  Hash,
  Loader2,
  Package
} from "lucide-react"

export function EquipmentFormClient() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'General',
    daily_rate: 500,
    hourly_rate: 75,
    description: '',
    serial_number: '',
    purchase_date: '',
    active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('equipment')
        .insert({
          ...formData,
          user_id: user.id,
          purchase_date: formData.purchase_date || null
        })

      if (error) throw error

      router.push('/equipment')
    } catch (error) {
      console.error('Error creating equipment:', error)
      alert('Failed to create equipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/equipment')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Equipment
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Add New Equipment
            </h1>
            <p className="text-gray-600 mt-1">Add equipment to your inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Equipment Details
                </CardTitle>
                <CardDescription>Basic information about the equipment</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="CAT 336 Excavator"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Equipment Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General Equipment</SelectItem>
                        <SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem>
                        <SelectItem value="Light Equipment">Light Equipment</SelectItem>
                        <SelectItem value="Specialty Equipment">Specialty Equipment</SelectItem>
                        <SelectItem value="Tools">Tools</SelectItem>
                        <SelectItem value="Vehicles">Vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="36-ton hydraulic excavator with extended boom..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="active" className="text-base font-medium">Active Status</Label>
                    <p className="text-sm text-gray-500">Equipment is available for use</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Pricing & Rates
                </CardTitle>
                <CardDescription>Set rental rates for cost calculations</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Daily Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="daily_rate"
                        type="number"
                        value={formData.daily_rate}
                        onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                        className="pl-10"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500">Standard daily rental rate</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (Optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                        className="pl-10"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500">For short-term rentals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Information */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Asset Information
                </CardTitle>
                <CardDescription>Tracking and identification details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        className="pl-10"
                        placeholder="CAT336-2024-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/equipment')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Equipment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}