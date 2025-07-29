import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  DollarSign, 
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  MapPin,
  Building,
  User,
  Mail,
  Shield,
  Printer
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ReportViewPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch report with all details
  const { data: report } = await supabase
    .from("reports")
    .select(`
      *,
      projects (
        name,
        address,
        project_type,
        latitude,
        longitude
      ),
      users (
        name,
        company,
        email,
        phone
      )
    `)
    .eq("id", params.id)
    .single()

  if (!report || report.user_id !== user.id) {
    redirect("/dashboard")
  }

  // Fetch who signed it if signed
  let signer = null
  if (report.signed_by) {
    const { data } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", report.signed_by)
      .single()
    signer = data
  }

  const reportTypeName = report.report_type.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reportTypeName}</h1>
            <p className="text-gray-600 mt-1">{report.projects.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report.signed_by ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Signed
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsigned
            </Badge>
          )}
          {report.status === 'COMPLETED' && (
            <Badge variant="outline">{report.status}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Report ID</p>
                  <p className="font-mono text-sm">{report.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm">{format(new Date(report.created_at), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period Start</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.period_start), 'PP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period End</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.period_end), 'PP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Project Name</p>
                <p className="font-medium">{report.projects.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                  <span className="text-sm">{report.projects.address}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Type</p>
                <p className="text-sm capitalize">{report.projects.project_type || 'General Construction'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Coordinates</p>
                <p className="text-sm font-mono">
                  {report.projects.latitude?.toFixed(6)}, {report.projects.longitude?.toFixed(6)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium flex items-center gap-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  {report.users.company || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-400" />
                  {report.users.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${report.users.email}`} className="text-sm text-blue-600 hover:underline">
                    {report.users.email}
                  </a>
                </p>
              </div>
              {report.users.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm">{report.users.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Status */}
          {report.signed_by ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Digital Signature
                </CardTitle>
                <CardDescription>
                  This report has been digitally signed and certified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Signed By</p>
                  <p className="font-medium">{signer?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{signer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Signed At</p>
                  <p className="text-sm">{format(new Date(report.signed_at), 'PPP p')}</p>
                </div>
                {report.signature_data && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Signature</p>
                    <div className="border rounded p-2 bg-gray-50">
                      <img 
                        src={report.signature_data} 
                        alt="Digital Signature" 
                        className="h-20 mx-auto"
                      />
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  This electronic signature is legally binding under the E-Sign Act and UETA.
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  Signature Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  This report must be signed before it can be submitted for insurance claims.
                </p>
                <Link href={`/reports/${report.id}/sign`}>
                  <Button className="w-full">
                    Sign Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Delay Hours</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-5 w-5 text-gray-400" />
                  {report.total_delay_hours?.toFixed(0) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  {(report.total_cost || 0).toLocaleString()}
                </p>
              </div>
              {report.claim_amount && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Claim Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${report.claim_amount.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insurance Information */}
          {(report.policy_number || report.insurer_name) && (
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.policy_number && (
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p className="font-mono text-sm">{report.policy_number}</p>
                  </div>
                )}
                {report.insurer_name && (
                  <div>
                    <p className="text-sm text-gray-500">Insurance Company</p>
                    <p className="text-sm">{report.insurer_name}</p>
                  </div>
                )}
                {report.submitted_at && (
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="text-sm">{format(new Date(report.submitted_at), 'PP')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.document_url && (
                <Button className="w-full" asChild>
                  <a href={report.document_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              )}
              {report.csv_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={report.csv_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Download CSV
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/reports/acord`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        reportId: report.id,
                        format: 'xml'
                      })
                    })
                    
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ACORD125_${report.id}.xml`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch (error) {
                    console.error('Error downloading ACORD report:', error)
                    alert('Failed to generate ACORD report')
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export ACORD 125
              </Button>
              <Button variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}