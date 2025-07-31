'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Zap,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Shield,
  Settings
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import NavigationHeader from "@/components/navigation-header"
import { Checkbox } from "@/components/ui/checkbox"

interface ThresholdTemplate {
  id: string
  name: string
  description: string | null
  project_type?: string | null
  work_types?: string[]
  thresholds: {
    wind_speed?: number
    wind_speed_mph?: number
    precipitation?: number
    precipitation_inches?: number
    temperature_min?: number
    min_temp?: number
    temperature_max?: number
    max_temp?: number
    humidity_max?: number
    lightning_distance?: number
    lightning_radius_miles?: number
  }
  is_default?: boolean
  user_id: string | null
}

interface ThresholdTemplatesClientProps {
  templates: ThresholdTemplate[]
}

const PROJECT_TYPES = [
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete/Foundation' },
  { value: 'framing', label: 'Framing' },
  { value: 'painting', label: 'Exterior Painting' },
  { value: 'masonry', label: 'Masonry/Brickwork' },
  { value: 'excavation', label: 'Excavation/Grading' },
  { value: 'general', label: 'General Construction' }
]

export function ThresholdTemplatesClient({ templates: initialTemplates }: ThresholdTemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ThresholdTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    thresholds: {
      wind_speed: 25,
      precipitation: 0.5,
      temperature_min: 32,
      temperature_max: 95,
      humidity_max: 90,
      lightning_distance: 10
    }
  })
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('weather_threshold_templates')
      .insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        thresholds: formData.thresholds
      })
      .select()
      .single()

    if (!error && data) {
      setTemplates([...templates, data])
      setIsCreateOpen(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!editingTemplate) return

    const { data, error } = await supabase
      .from('weather_threshold_templates')
      .update({
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        thresholds: formData.thresholds
      })
      .eq('id', editingTemplate.id)
      .select()
      .single()

    if (!error && data) {
      setTemplates(templates.map(t => t.id === data.id ? data : t))
      setIsEditOpen(false)
      setEditingTemplate(null)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    const { error } = await supabase
      .from('weather_threshold_templates')
      .delete()
      .eq('id', id)

    if (!error) {
      setTemplates(templates.filter(t => t.id !== id))
    }
  }

  const handleDuplicate = async (template: ThresholdTemplate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('weather_threshold_templates')
      .insert({
        user_id: user.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        project_type: template.project_type,
        thresholds: template.thresholds
      })
      .select()
      .single()

    if (!error && data) {
      setTemplates([...templates, data])
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      project_type: '',
      thresholds: {
        wind_speed: 25,
        precipitation: 0.5,
        temperature_min: 32,
        temperature_max: 95,
        humidity_max: 90,
        lightning_distance: 10
      }
    })
  }

  const openEditDialog = (template: ThresholdTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      project_type: template.project_type || '',
      thresholds: {
        wind_speed: template.thresholds.wind_speed || template.thresholds.wind_speed_mph || 25,
        precipitation: template.thresholds.precipitation || template.thresholds.precipitation_inches || 0.5,
        temperature_min: template.thresholds.temperature_min || template.thresholds.min_temp || 32,
        temperature_max: template.thresholds.temperature_max || template.thresholds.max_temp || 95,
        humidity_max: template.thresholds.humidity_max || 90,
        lightning_distance: template.thresholds.lightning_distance || template.thresholds.lightning_radius_miles || 10
      }
    })
    setIsEditOpen(true)
  }

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Weather Threshold Templates
                </h1>
                <p className="text-gray-600 mt-1">Manage weather thresholds for different project types</p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Weather Threshold Template</DialogTitle>
                    <DialogDescription>
                      Define custom weather thresholds for your projects
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., High Wind Roofing"
                        />
                      </div>
                      <div>
                        <Label htmlFor="project_type">Project Type</Label>
                        <Select
                          value={formData.project_type}
                          onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                        >
                          <SelectTrigger id="project_type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe when to use this template..."
                      />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Weather Thresholds</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="wind_speed">Max Wind Speed (mph)</Label>
                          <Input
                            id="wind_speed"
                            type="number"
                            value={formData.thresholds.wind_speed}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, wind_speed: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="precipitation">Max Precipitation (inches)</Label>
                          <Input
                            id="precipitation"
                            type="number"
                            step="0.1"
                            value={formData.thresholds.precipitation}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, precipitation: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="temp_min">Min Temperature (°F)</Label>
                          <Input
                            id="temp_min"
                            type="number"
                            value={formData.thresholds.temperature_min}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, temperature_min: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="temp_max">Max Temperature (°F)</Label>
                          <Input
                            id="temp_max"
                            type="number"
                            value={formData.thresholds.temperature_max}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, temperature_max: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="humidity_max">Max Humidity (%)</Label>
                          <Input
                            id="humidity_max"
                            type="number"
                            value={formData.thresholds.humidity_max}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, humidity_max: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lightning_distance">Lightning Distance (miles)</Label>
                          <Input
                            id="lightning_distance"
                            type="number"
                            value={formData.thresholds.lightning_distance}
                            onChange={(e) => setFormData({
                              ...formData,
                              thresholds: { ...formData.thresholds, lightning_distance: Number(e.target.value) }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreate}>
                        Create Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* System Templates Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              System Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.filter(t => !t.user_id).map((template) => (
                <Card key={template.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.work_types && template.work_types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.work_types.map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {(template.thresholds.wind_speed_mph !== undefined || template.thresholds.wind_speed !== undefined) && (
                        <div className="flex items-center gap-2">
                          <Wind className="h-4 w-4 text-blue-500" />
                          <span>Max: {template.thresholds.wind_speed_mph || template.thresholds.wind_speed} mph</span>
                        </div>
                      )}
                      {(template.thresholds.precipitation_inches !== undefined || template.thresholds.precipitation !== undefined) && (
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-cyan-500" />
                          <span>Max: {template.thresholds.precipitation_inches || template.thresholds.precipitation}"</span>
                        </div>
                      )}
                      {(template.thresholds.min_temp !== undefined || template.thresholds.temperature_min !== undefined) && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span>Min: {template.thresholds.min_temp || template.thresholds.temperature_min}°F</span>
                        </div>
                      )}
                      {(template.thresholds.max_temp !== undefined || template.thresholds.temperature_max !== undefined) && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span>Max: {template.thresholds.max_temp || template.thresholds.temperature_max}°F</span>
                        </div>
                      )}
                      {template.thresholds.humidity_max !== undefined && (
                        <div className="flex items-center gap-2">
                          <CloudRain className="h-4 w-4 text-gray-500" />
                          <span>Humidity: {template.thresholds.humidity_max}%</span>
                        </div>
                      )}
                      {(template.thresholds.lightning_radius_miles !== undefined || template.thresholds.lightning_distance !== undefined) && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>Lightning: {template.thresholds.lightning_radius_miles || template.thresholds.lightning_distance} mi</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Templates Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Custom Templates
            </h2>
            {templates.filter(t => t.user_id).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.filter(t => t.user_id).map((template) => (
                  <Card key={template.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.project_type && (
                            <Badge variant="secondary" className="mt-1">
                              {PROJECT_TYPES.find(t => t.value === template.project_type)?.label}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {template.description && (
                        <CardDescription className="mt-2">{template.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {template.thresholds.wind_speed !== undefined && (
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-blue-500" />
                            <span>Max: {template.thresholds.wind_speed} mph</span>
                          </div>
                        )}
                        {template.thresholds.precipitation !== undefined && (
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-cyan-500" />
                            <span>Max: {template.thresholds.precipitation}"</span>
                          </div>
                        )}
                        {template.thresholds.temperature_min !== undefined && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-orange-500" />
                            <span>Min: {template.thresholds.temperature_min}°F</span>
                          </div>
                        )}
                        {template.thresholds.temperature_max !== undefined && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <span>Max: {template.thresholds.temperature_max}°F</span>
                          </div>
                        )}
                        {template.thresholds.humidity_max !== undefined && (
                          <div className="flex items-center gap-2">
                            <CloudRain className="h-4 w-4 text-gray-500" />
                            <span>Humidity: {template.thresholds.humidity_max}%</span>
                          </div>
                        )}
                        {template.thresholds.lightning_distance !== undefined && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>Lightning: {template.thresholds.lightning_distance} mi</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                    <CloudRain className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No custom templates yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Create custom weather threshold templates for your specific project needs
                  </p>
                  <Button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Weather Threshold Template</DialogTitle>
              <DialogDescription>
                Update weather thresholds for this template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-project_type">Project Type</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                  >
                    <SelectTrigger id="edit-project_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Weather Thresholds</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-wind_speed">Max Wind Speed (mph)</Label>
                    <Input
                      id="edit-wind_speed"
                      type="number"
                      value={formData.thresholds.wind_speed}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, wind_speed: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-precipitation">Max Precipitation (inches)</Label>
                    <Input
                      id="edit-precipitation"
                      type="number"
                      step="0.1"
                      value={formData.thresholds.precipitation}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, precipitation: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-temp_min">Min Temperature (°F)</Label>
                    <Input
                      id="edit-temp_min"
                      type="number"
                      value={formData.thresholds.temperature_min}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, temperature_min: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-temp_max">Max Temperature (°F)</Label>
                    <Input
                      id="edit-temp_max"
                      type="number"
                      value={formData.thresholds.temperature_max}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, temperature_max: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-humidity_max">Max Humidity (%)</Label>
                    <Input
                      id="edit-humidity_max"
                      type="number"
                      value={formData.thresholds.humidity_max}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, humidity_max: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lightning_distance">Lightning Distance (miles)</Label>
                    <Input
                      id="edit-lightning_distance"
                      type="number"
                      value={formData.thresholds.lightning_distance}
                      onChange={(e) => setFormData({
                        ...formData,
                        thresholds: { ...formData.thresholds, lightning_distance: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setIsEditOpen(false)
                  setEditingTemplate(null)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>
                  Update Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}