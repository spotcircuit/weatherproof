'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, PenTool, RotateCcw, Check } from 'lucide-react'
import { format } from 'date-fns/format'

interface SignaturePadProps {
  onSign: (signature: string, affidavitAccepted: boolean) => void
  signerName: string
  signerTitle?: string
  companyName: string
  reportType?: string
}

export function SignaturePad({
  onSign,
  signerName,
  signerTitle,
  companyName,
  reportType = 'Weather Delay Report'
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [affidavitAccepted, setAffidavitAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClear = () => {
    sigCanvas.current?.clear()
    setIsDrawing(false)
    setError(null)
  }

  const handleSign = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty() && affidavitAccepted) {
      const signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      onSign(signature, affidavitAccepted)
    } else {
      if (sigCanvas.current?.isEmpty()) {
        setError('Please provide your signature')
      } else if (!affidavitAccepted) {
        setError('Please accept the affidavit statement')
      }
    }
  }

  const affidavitText = `I, ${signerName}${signerTitle ? `, ${signerTitle}` : ''} of ${companyName}, hereby certify under penalty of perjury that:

1. The information contained in this ${reportType} is true and accurate to the best of my knowledge and belief.

2. All weather data has been obtained from official sources (NOAA/NWS) and accurately represents the conditions at the project site during the claim period.

3. The delays and associated costs documented herein were directly caused by weather conditions exceeding the contractual thresholds.

4. All photographic evidence, if included, was taken at the project site during the documented delay periods and has not been altered.

5. The calculations of labor costs, equipment costs, and overhead costs are based on actual project records and industry-standard practices.

6. I understand that false statements made herein are punishable by law and may result in criminal prosecution and/or civil penalties.`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digital Signature & Affidavit</CardTitle>
        <CardDescription>
          Sign below to certify the accuracy of this report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Affidavit Text */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Affidavit Statement
          </h4>
          <p className="text-sm whitespace-pre-line text-gray-700">
            {affidavitText}
          </p>
        </div>

        {/* Acceptance Checkbox */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="affidavit"
            checked={affidavitAccepted}
            onCheckedChange={(checked) => {
              setAffidavitAccepted(checked as boolean)
              setError(null)
            }}
          />
          <div className="space-y-1">
            <Label htmlFor="affidavit" className="text-sm font-medium cursor-pointer">
              I have read and accept the above affidavit statement
            </Label>
            <p className="text-xs text-gray-500">
              By checking this box, you acknowledge that you understand the legal implications of this certification.
            </p>
          </div>
        </div>

        {/* Signature Canvas */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Signature
          </Label>
          <div className="border-2 border-gray-300 rounded-lg relative">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-40 cursor-crosshair',
                style: { width: '100%', height: '160px' }
              }}
              onBegin={() => setIsDrawing(true)}
              backgroundColor="white"
            />
            {!isDrawing && sigCanvas.current?.isEmpty() && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-gray-400 flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  <span className="text-sm">Sign here</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <div className="text-xs text-gray-500">
              {signerName} • {format(new Date(), 'PPP p')}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Sign Button */}
        <Button
          onClick={handleSign}
          className="w-full"
          disabled={!affidavitAccepted || sigCanvas.current?.isEmpty()}
        >
          <Check className="mr-2 h-4 w-4" />
          Sign & Certify Report
        </Button>

        {/* Legal Notice */}
        <p className="text-xs text-gray-500 text-center">
          This electronic signature is legally binding and equivalent to a handwritten signature 
          under the Electronic Signatures in Global and National Commerce Act (E-Sign Act) and 
          the Uniform Electronic Transactions Act (UETA).
        </p>
      </CardContent>
    </Card>
  )
}