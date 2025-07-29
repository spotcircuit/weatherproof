import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Wind,
  Cloud,
  Thermometer,
  Droplets,
  Image
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { PhotoUpload } from "@/components/photo-upload"
import { PhotoGallery } from "@/components/photo-gallery"

export default async function DelayEventPage({
  params
}: {
  params: { id: string; delayId: string }
}) {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch delay event with project info
  const { data: delayEvent } = await supabase
    .from("delay_events")
    .select(`
      *,
      projects (
        id,
        name,
        address,
        project_type,
        hourly_rate,
        weather_thresholds
      )
    `)
    .eq("id", params.delayId)
    .single()

  if (!delayEvent) {
    redirect(`/projects/${params.id}`)
  }

  // Fetch weather readings during the delay
  const { data: weatherReadings } = await supabase
    .from("weather_readings")
    .select("*")
    .eq("project_id", params.id)
    .gte("timestamp", delayEvent.start_time)
    .lte("timestamp", delayEvent.end_time || new Date().toISOString())
    .order("timestamp", { ascending: true })

  // Fetch photos for this delay
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("delay_event_id", params.delayId)
    .order("taken_at", { ascending: false })

  const duration = delayEvent.duration_hours || 
    (delayEvent.end_time 
      ? (new Date(delayEvent.end_time).getTime() - new Date(delayEvent.start_time).getTime()) / (1000 * 60 * 60)
      : (new Date().getTime() - new Date(delayEvent.start_time).getTime()) / (1000 * 60 * 60)
    )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weather Delay Event</h1>
            <p className="text-gray-600 mt-1">{delayEvent.projects.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {delayEvent.verified ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Unverified
            </Badge>
          )}
          {!delayEvent.end_time && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">{duration.toFixed(1)}</span>
              <span className="text-gray-500">hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">
                {(delayEvent.total_cost || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Crew Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">{delayEvent.crew_size || 0}</span>
              <span className="text-gray-500">workers</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">{photos?.length || 0}</span>
              <span className="text-gray-500">uploaded</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="weather">Weather Data</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photos?.length || 0})</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Delay Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Timeline</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Started</dt>
                      <dd className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {format(new Date(delayEvent.start_time), 'PPP p')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Ended</dt>
                      <dd className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {delayEvent.end_time 
                          ? format(new Date(delayEvent.end_time), 'PPP p')
                          : 'Ongoing'
                        }
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Weather Conditions</h4>
                  <p className="text-sm mb-3">{delayEvent.weather_condition}</p>
                  {delayEvent.threshold_violated && (
                    <div className="space-y-2">
                      {delayEvent.threshold_violated.map((violation: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="mr-2">
                          {violation.type}: {violation.value}{violation.unit}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {delayEvent.affected_activities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Affected Activities</h4>
                  <div className="flex flex-wrap gap-2">
                    {delayEvent.affected_activities.map((activity: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {delayEvent.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm">{delayEvent.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Data Tab */}
        <TabsContent value="weather">
          <Card>
            <CardHeader>
              <CardTitle>Weather Readings During Delay</CardTitle>
              <CardDescription>
                Data from nearest NOAA weather station
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weatherReadings && weatherReadings.length > 0 ? (
                <div className="space-y-3">
                  {weatherReadings.map((reading) => (
                    <div key={reading.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">
                          {format(new Date(reading.timestamp), 'PPP p')}
                        </span>
                        <Badge variant="outline">{reading.conditions}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-gray-400" />
                          <span>{reading.temperature?.toFixed(0)}°F</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="h-4 w-4 text-gray-400" />
                          <span>{reading.wind_speed?.toFixed(0)} mph</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-gray-400" />
                          <span>{reading.precipitation?.toFixed(2)}"</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-gray-400" />
                          <span>{reading.humidity?.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No weather data available for this period</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photo Documentation</CardTitle>
              <CardDescription>
                Upload photos to document site conditions during the delay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PhotoUpload
                delayEventId={params.delayId}
                projectId={params.id}
                userId={user.id}
                onUploadComplete={() => {
                  // In a real app, we'd refresh the photos
                  window.location.reload()
                }}
              />
              
              {photos && photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-4">Uploaded Photos</h4>
                  <PhotoGallery
                    photos={photos}
                    onPhotoDeleted={() => {
                      // In a real app, we'd refresh the photos
                      window.location.reload()
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown Tab */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Labor Costs</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Crew Size</dt>
                        <dd className="text-sm font-medium">{delayEvent.crew_size} workers</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Hours Lost</dt>
                        <dd className="text-sm font-medium">{delayEvent.labor_hours_lost || 0} hours</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Hourly Rate</dt>
                        <dd className="text-sm font-medium">${delayEvent.projects.hourly_rate}/hr</dd>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <dt className="text-sm font-medium">Labor Cost</dt>
                        <dd className="text-sm font-medium">${(delayEvent.labor_cost || 0).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Additional Costs</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Equipment</dt>
                        <dd className="text-sm font-medium">${(delayEvent.equipment_cost || 0).toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Overhead</dt>
                        <dd className="text-sm font-medium">${(delayEvent.overhead_cost || 0).toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <dt className="text-sm font-medium">Total Cost</dt>
                        <dd className="text-lg font-bold text-orange-600">
                          ${(delayEvent.total_cost || 0).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This delay event has been {delayEvent.verified ? 'verified' : 'automatically generated'} 
                    {delayEvent.verified && delayEvent.verified_by && ` by ${delayEvent.verified_by}`}.
                    All costs are calculated based on project settings and actual delay duration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}