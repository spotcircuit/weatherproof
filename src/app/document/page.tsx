'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SmartDelayDocumentation } from "@/components/smart-delay-documentation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CloudRain, 
  AlertTriangle, 
  FileText, 
  Clock,
  DollarSign,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Building2
} from "lucide-react"
import Link from "next/link"

export default function DocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    activeDelays: 0,
    totalDelaysThisMonth: 0,
    totalSaved: 0,
    projectsWithDelays: 0
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Fetch user's active projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false })

      // Fetch delay statistics
      const { data: delaysData } = await supabase
        .from("delay_events")
        .select("*, projects!inner(user_id)")
        .eq("projects.user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const activeDelays = delaysData?.filter(d => !d.end_time) || []
      const totalSaved = delaysData?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0
      const projectsWithDelays = new Set(delaysData?.map(d => d.project_id)).size

      setStats({
        activeDelays: activeDelays.length,
        totalDelaysThisMonth: delaysData?.length || 0,
        totalSaved: totalSaved,
        projectsWithDelays
      })

      setProjects(projectsData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  const handleComplete = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  // Check if coming from reports or quick action
  const action = searchParams.get('action')
  const projectId = searchParams.get('project')
  const date = searchParams.get('date')
  const delayAnnouncement = searchParams.get('announcement')
  const showWizardDirectly = action === 'document-delay' || projects.length === 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Hero Section with Enhanced Visuals */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"></div>
        
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6">
              <CloudRain className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-4">
              AI-Powered Delay Documentation
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Document weather delays in seconds with natural language. 
              Our AI extracts times, activities, and impacts automatically.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Badge className="px-4 py-2 text-sm bg-blue-100 text-blue-700 border-blue-200">
                <Zap className="mr-1 h-3 w-3" />
                Instant AI Processing
              </Badge>
              <Badge className="px-4 py-2 text-sm bg-green-100 text-green-700 border-green-200">
                <Shield className="mr-1 h-3 w-3" />
                Insurance Ready
              </Badge>
              <Badge className="px-4 py-2 text-sm bg-purple-100 text-purple-700 border-purple-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                NOAA Verified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats.totalDelaysThisMonth > 0 && (
        <div className="container mx-auto px-4 -mt-8 mb-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Delays</p>
                    <p className="text-2xl font-bold text-red-600">{stats.activeDelays}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalDelaysThisMonth}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Documented</p>
                    <p className="text-2xl font-bold text-green-600">${stats.totalSaved.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Projects</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.projectsWithDelays}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="max-w-2xl mx-auto border-0 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Active Projects</h2>
              <p className="text-gray-600 mb-8">
                You need to create a project before you can document weather delays.
              </p>
              <Link href="/projects/new">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Create Your First Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Natural Language AI</CardTitle>
                  <CardDescription>
                    Just describe what happened in your own words
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    "Heavy rain started at 10am, crew worked until noon then we sent everyone home"
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Automatic Calculations</CardTitle>
                  <CardDescription>
                    AI calculates hours lost and cost impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Instantly see labor costs, equipment costs, and total financial impact
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Smart Activity Detection</CardTitle>
                  <CardDescription>
                    AI identifies affected work activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Automatically detects roofing, concrete, framing, and other activities
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Documentation Form */}
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardContent className="p-0">
                <SmartDelayDocumentation 
                  projects={projects}
                  defaultProjectId={projectId}
                  defaultDate={date}
                  defaultAnnouncement={delayAnnouncement}
                  onComplete={handleComplete}
                />
              </CardContent>
            </Card>

            {/* Help Section */}
            <Alert className="mt-8 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Pro Tip:</strong> For insurance claims, document delays as soon as they happen. 
                Include specific times, weather conditions, and which activities were affected. 
                The AI will help extract all the details automatically.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  )
}