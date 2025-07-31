'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { DEFAULT_THRESHOLDS } from "@/types"
import { MapPin } from "lucide-react"

interface ProjectFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  projectData?: any
  onSuccess?: () => void
}

export default function ProjectFormModal({
  open,
  onOpenChange,
  projectId,
  projectData,
  onSuccess
}: ProjectFormModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    startDate: "",
    endDate: "",
    projectType: "general",
    crewSize: "5",
    hourlyRate: "75",
    dailyOverhead: "500",
    windSpeed: "25",
    precipitation: "0.25",
    temperatureMin: "32",
    temperatureMax: "95",
    // Insurance fields
    contractNumber: "",
    generalContractor: "",
    insurancePolicyNumber: "",
  })

  useEffect(() => {
    if (projectData) {
      setFormData({
        name: projectData.name || "",
        description: projectData.description || "",
        address: projectData.address || "",
        latitude: projectData.latitude?.toString() || "",
        longitude: projectData.longitude?.toString() || "",
        startDate: projectData.start_date || "",
        endDate: projectData.end_date || "",
        projectType: projectData.project_type || "general",
        crewSize: projectData.crew_size?.toString() || "5",
        hourlyRate: projectData.hourly_rate?.toString() || "75",
        dailyOverhead: projectData.daily_overhead?.toString() || "500",
        windSpeed: projectData.weather_thresholds?.wind_speed?.toString() || "25",
        precipitation: projectData.weather_thresholds?.precipitation?.toString() || "0.25",
        temperatureMin: projectData.weather_thresholds?.temperature_min?.toString() || "32",
        temperatureMax: projectData.weather_thresholds?.temperature_max?.toString() || "95",
        // Insurance fields
        contractNumber: projectData.contract_number || "",
        generalContractor: projectData.general_contractor || "",
        insurancePolicyNumber: projectData.insurance_policy_number || "",
      })
    }
  }, [projectData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const projectPayload = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        project_type: formData.projectType,
        crew_size: parseInt(formData.crewSize),
        hourly_rate: parseFloat(formData.hourlyRate),
        daily_overhead: parseFloat(formData.dailyOverhead),
        weather_thresholds: {
          wind_speed: parseFloat(formData.windSpeed),
          precipitation: parseFloat(formData.precipitation),
          temperature_min: parseFloat(formData.temperatureMin),
          temperature_max: parseFloat(formData.temperatureMax),
        },
        // Insurance fields
        contract_number: formData.contractNumber || null,
        general_contractor: formData.generalContractor || null,
        insurance_policy_number: formData.insurancePolicyNumber || null,
      }

      if (projectId) {
        const { error: updateError } = await supabase
          .from("projects")
          .update(projectPayload)
          .eq("id", projectId)
          .eq("user_id", user.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("projects")
          .insert(projectPayload)

        if (insertError) throw insertError
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/projects")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
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

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
        },
        (error) => {
          setError("Could not get your location. Please enter manually.")
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projectId ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {projectId ? "Update project details and settings" : "Set up weather monitoring for your construction project"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Project Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Downtown Office Complex"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="20-story office building with underground parking"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Construction</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Location</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Project Address*</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, State 12345"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude*</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="40.7128"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude*</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="-74.0060"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date*</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Project Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crewSize">Crew Size</Label>
                  <Input
                    id="crewSize"
                    name="crewSize"
                    type="number"
                    value={formData.crewSize}
                    onChange={handleChange}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="75"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyOverhead">Daily Overhead ($)</Label>
                <Input
                  id="dailyOverhead"
                  name="dailyOverhead"
                  type="number"
                  step="0.01"
                  value={formData.dailyOverhead}
                  onChange={handleChange}
                  placeholder="500"
                />
              </div>
            </div>

            {/* Weather Thresholds */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Weather Thresholds</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="windSpeed">Wind Speed (mph)</Label>
                  <Input
                    id="windSpeed"
                    name="windSpeed"
                    type="number"
                    step="0.1"
                    value={formData.windSpeed}
                    onChange={handleChange}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precipitation">Precipitation (inches)</Label>
                  <Input
                    id="precipitation"
                    name="precipitation"
                    type="number"
                    step="0.01"
                    value={formData.precipitation}
                    onChange={handleChange}
                    placeholder="0.25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperatureMin">Min Temperature (°F)</Label>
                  <Input
                    id="temperatureMin"
                    name="temperatureMin"
                    type="number"
                    value={formData.temperatureMin}
                    onChange={handleChange}
                    placeholder="32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperatureMax">Max Temperature (°F)</Label>
                  <Input
                    id="temperatureMax"
                    name="temperatureMax"
                    type="number"
                    value={formData.temperatureMax}
                    onChange={handleChange}
                    placeholder="95"
                  />
                </div>
              </div>
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
              {loading ? "Saving..." : projectId ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}