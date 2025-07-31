'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import NavigationHeader from "@/components/navigation-header"
import { 
  Save, 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  ArrowLeft,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { format } from 'date-fns/format'

interface Project {
  id: string
  name: string
  address: string
  start_date: string
  end_date: string | null
  active: boolean
  crew_size: number
  hourly_rate: number
  project_type: string | null
  description: string | null
  weather_thresholds: {
    wind_speed_mph: number
    precipitation_inches: number
    min_temp: number
    max_temp: number
  }
  weather_preferences: {
    rain_delay: boolean
    wind_delay: boolean
    temp_delay: boolean
    lightning_delay: boolean
  }
}

interface ProjectEditClientProps {
  project: Project
}

export function ProjectEditClient({ project }: ProjectEditClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    address: project.address,
    start_date: project.start_date,
    end_date: project.end_date || '',
    active: project.active,
    crew_size: project.crew_size,
    hourly_rate: project.hourly_rate,
    project_type: project.project_type || 'General',
    description: project.description || '',
    weather_thresholds: project.weather_thresholds || {
      wind_speed_mph: 25,
      precipitation_inches: 0.25,
      min_temp: 40,
      max_temp: 95
    },
    weather_preferences: project.weather_preferences || {
      rain_delay: true,
      wind_delay: true,
      temp_delay: true,
      lightning_delay: true
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          address: formData.address,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          active: formData.active,
          crew_size: formData.crew_size,
          hourly_rate: formData.hourly_rate,
          project_type: formData.project_type,
          description: formData.description || null,
          weather_thresholds: formData.weather_thresholds,
          weather_preferences: formData.weather_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (error) throw error

      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/projects/${project.id}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Edit Project
            </h1>
            <p className="text-gray-600 mt-1">Update project details and weather thresholds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Essential project details</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Project Type</Label>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General Construction</SelectItem>
                        <SelectItem value="Concrete">Concrete</SelectItem>
                        <SelectItem value="Roofing">Roofing</SelectItem>
                        <SelectItem value="Framing">Framing</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Plumbing">Plumbing</SelectItem>
                        <SelectItem value="Landscaping">Landscaping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Project Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional project details..."
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="active" className="text-base font-medium">Project Active</Label>
                    <p className="text-sm text-gray-500">Enable weather monitoring for this project</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Labor & Cost */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Labor & Cost
                </CardTitle>
                <CardDescription>Crew size and hourly rates for delay calculations</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="crew_size">Crew Size</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="crew_size"
                        type="number"
                        value={formData.crew_size}
                        onChange={(e) => setFormData({ ...formData, crew_size: parseInt(e.target.value) || 0 })}
                        className="pl-10"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (per person)</Label>
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
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Thresholds */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  Weather Thresholds
                </CardTitle>
                <CardDescription>Conditions that trigger work delays</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="wind_speed">Wind Speed (mph)</Label>
                    <div className="relative">
                      <Wind className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                      <Input
                        id="wind_speed"
                        type="number"
                        value={formData.weather_thresholds.wind_speed_mph}
                        onChange={(e) => setFormData({
                          ...formData,
                          weather_thresholds: {
                            ...formData.weather_thresholds,
                            wind_speed_mph: parseInt(e.target.value) || 25
                          }
                        })}
                        className="pl-10"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Typical: 25-35 mph for most work</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precipitation">Precipitation (inches/hr)</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3 h-4 w-4 text-cyan-500" />
                      <Input
                        id="precipitation"
                        type="number"
                        value={formData.weather_thresholds.precipitation_inches}
                        onChange={(e) => setFormData({
                          ...formData,
                          weather_thresholds: {
                            ...formData.weather_thresholds,
                            precipitation_inches: parseFloat(e.target.value) || 0.25
                          }
                        })}
                        className="pl-10"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Typical: 0.25" for concrete work</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_temp">Minimum Temperature (°F)</Label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                      <Input
                        id="min_temp"
                        type="number"
                        value={formData.weather_thresholds.min_temp}
                        onChange={(e) => setFormData({
                          ...formData,
                          weather_thresholds: {
                            ...formData.weather_thresholds,
                            min_temp: parseInt(e.target.value) || 40
                          }
                        })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Typical: 40°F for concrete</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_temp">Maximum Temperature (°F)</Label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                      <Input
                        id="max_temp"
                        type="number"
                        value={formData.weather_thresholds.max_temp}
                        onChange={(e) => setFormData({
                          ...formData,
                          weather_thresholds: {
                            ...formData.weather_thresholds,
                            max_temp: parseInt(e.target.value) || 95
                          }
                        })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-gray-500">OSHA: 95°F+ requires precautions</p>
                  </div>
                </div>

                {/* Weather Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delay Triggers</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Droplets className="h-5 w-5 text-cyan-500" />
                        <div>
                          <p className="font-medium">Rain Delays</p>
                          <p className="text-sm text-gray-500">Stop work during precipitation</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.weather_preferences.rain_delay}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          weather_preferences: {
                            ...formData.weather_preferences,
                            rain_delay: checked
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wind className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Wind Delays</p>
                          <p className="text-sm text-gray-500">Stop work in high winds</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.weather_preferences.wind_delay}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          weather_preferences: {
                            ...formData.weather_preferences,
                            wind_delay: checked
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Temperature Delays</p>
                          <p className="text-sm text-gray-500">Stop work in extreme temperatures</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.weather_preferences.temp_delay}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          weather_preferences: {
                            ...formData.weather_preferences,
                            temp_delay: checked
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Lightning Delays</p>
                          <p className="text-sm text-gray-500">Stop work during lightning</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.weather_preferences.lightning_delay}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          weather_preferences: {
                            ...formData.weather_preferences,
                            lightning_delay: checked
                          }
                        })}
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
                onClick={() => router.push(`/projects/${project.id}`)}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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