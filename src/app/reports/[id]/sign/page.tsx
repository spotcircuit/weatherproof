import { redirect } from "next/navigation"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Download, Calendar, DollarSign, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { SignaturePad } from "@/components/signature-pad"
import { SignReportAction } from "./sign-report-action"

export default async function SignReportPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch report with project details
  const { data: report } = await supabase
    .from("reports")
    .select(`
      *,
      projects (
        name,
        address,
        project_type
      ),
      users (
        name,
        company,
        email
      )
    `)
    .eq("id", params.id)
    .single()

  if (!report || report.user_id !== user.id) {
    redirect("/dashboard")
  }

  // Check if already signed
  if (report.signed_by) {
    redirect(`/reports/${params.id}`)
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
            <h1 className="text-2xl font-bold text-gray-900">Sign Report</h1>
            <p className="text-gray-600 mt-1">Certify and sign your weather delay report</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>
                Review the report details before signing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Report Type</p>
                <p className="font-medium">{reportTypeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium">{report.projects.name}</p>
                <p className="text-sm text-gray-600">{report.projects.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Report Period</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(report.period_start), 'PP')} - {format(new Date(report.period_end), 'PP')}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Hours Lost</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {report.total_delay_hours?.toFixed(0) || 0} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${(report.total_cost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              {report.claim_amount && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Claim Amount</p>
                  <p className="text-lg font-bold text-orange-600">
                    ${report.claim_amount.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                By signing this report, you are legally certifying that all information 
                is accurate and truthful to the best of your knowledge.
              </p>
              <p>
                False statements may result in:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Denial of insurance claims</li>
                <li>Legal prosecution for insurance fraud</li>
                <li>Civil penalties and damages</li>
                <li>Loss of contractor license</li>
              </ul>
              <p className="font-medium">
                Please review all report details carefully before signing.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Signature Section */}
        <div>
          <SignReportAction
            reportId={params.id}
            signerName={report.users.name || 'Unknown'}
            signerTitle="Project Manager"
            companyName={report.users.company || 'Unknown Company'}
            reportType={reportTypeName}
          />
        </div>
      </div>
    </div>
  )
}