'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignaturePad } from '@/components/signature-pad'
import { createClient } from '@/lib/supabase'

interface SignReportActionProps {
  reportId: string
  signerName: string
  signerTitle?: string
  companyName: string
  reportType: string
}

export function SignReportAction({
  reportId,
  signerName,
  signerTitle,
  companyName,
  reportType
}: SignReportActionProps) {
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const supabase = createClient()

  const handleSign = async (signature: string, affidavitAccepted: boolean) => {
    setSigning(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate affidavit text
      const affidavitText = `I, ${signerName}${signerTitle ? `, ${signerTitle}` : ''} of ${companyName}, hereby certify under penalty of perjury that:

1. The information contained in this ${reportType} is true and accurate to the best of my knowledge and belief.

2. All weather data has been obtained from official sources (NOAA/NWS) and accurately represents the conditions at the project site during the claim period.

3. The delays and associated costs documented herein were directly caused by weather conditions exceeding the contractual thresholds.

4. All photographic evidence, if included, was taken at the project site during the documented delay periods and has not been altered.

5. The calculations of labor costs, equipment costs, and overhead costs are based on actual project records and industry-standard practices.

6. I understand that false statements made herein are punishable by law and may result in criminal prosecution and/or civil penalties.

Signed electronically on ${new Date().toLocaleString()}`

      // Update report with signature
      const { error } = await supabase
        .from('reports')
        .update({
          signed_by: user.id,
          signed_at: new Date().toISOString(),
          signature_data: signature,
          affidavit_text: affidavitText
        })
        .eq('id', reportId)

      if (error) {
        console.error('Report signing update error:', error)
        throw new Error(`Failed to sign report: ${error.message || JSON.stringify(error)}`)
      }

      // Redirect to report view
      router.push(`/reports/${reportId}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign report. Please try again.'
      console.error('Report signing error:', {
        error,
        message: errorMessage,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2),
        reportId,
        signerName,
        companyName
      })
      alert(errorMessage)
    } finally {
      setSigning(false)
    }
  }

  return (
    <SignaturePad
      onSign={handleSign}
      signerName={signerName}
      signerTitle={signerTitle}
      companyName={companyName}
      reportType={reportType}
    />
  )
}