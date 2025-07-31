// Reusable form input components with built-in guidance

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface GuidedInputProps {
  label: string
  tooltip: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  step?: string
  placeholder?: string
  required?: boolean
  validation?: (value: any) => { valid: boolean; message: string }
  suffix?: string
  showValidation?: boolean
  className?: string
}

export function GuidedInput({
  label,
  tooltip,
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
  required = false,
  validation,
  suffix,
  showValidation = true,
  className
}: GuidedInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null)

  useEffect(() => {
    if (validation && value && showValidation) {
      setValidationResult(validation(value))
    }
  }, [value, validation, showValidation])

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <InfoTooltip content={tooltip} />
      </div>
      
      <div className="relative">
        <div className="flex items-center gap-2">
          <Input
            type={type}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              validationResult && !validationResult.valid && "border-red-500",
              validationResult && validationResult.valid && showValidation && "border-green-500"
            )}
          />
          {suffix && <span className="text-sm text-gray-600">{suffix}</span>}
        </div>
        
        {validationResult && showValidation && (
          <div className={cn(
            "absolute right-2 top-2.5",
            suffix && "right-12"
          )}>
            {validationResult.valid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {validationResult && !validationResult.valid && showValidation && (
        <p className="text-sm text-red-600">{validationResult.message}</p>
      )}
      
      {isFocused && tooltip && (
        <p className="text-xs text-gray-600 italic">{tooltip}</p>
      )}
    </div>
  )
}

// Specialized inputs with built-in validation

export function BurdenRateInput({ value, onChange, showBreakdown = false }: any) {
  return (
    <div className="space-y-2">
      <GuidedInput
        label="Burden Rate"
        tooltip="Multiplier for taxes, insurance, benefits. Industry standard is 1.35 (35%)"
        value={value}
        onChange={onChange}
        type="number"
        step="0.01"
        suffix="×"
        validation={(val) => {
          const num = parseFloat(val)
          if (num < 1.25) return { valid: false, message: "Seems low. Typical is 1.35 (35%)" }
          if (num > 1.50) return { valid: false, message: "Seems high. Typical is 1.35 (35%)" }
          return { valid: true, message: "" }
        }}
      />
      
      {showBreakdown && (
        <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
          <p className="font-medium">Typical Burden Rate Breakdown:</p>
          <div className="grid grid-cols-2 gap-1">
            <span>• Payroll Taxes: 7.65%</span>
            <span>• Workers Comp: 8%</span>
            <span>• Liability Ins: 3%</span>
            <span>• Health Benefits: 12%</span>
            <span>• Other Benefits: 4.35%</span>
            <span className="font-medium">• Total: 35%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function StandbyRateInput({ value, onChange, isRented = false, operationalRate = 100 }: any) {
  const suggestedRate = isRented ? operationalRate : operationalRate * 0.5
  
  return (
    <GuidedInput
      label="Standby Rate"
      tooltip={isRented 
        ? "Rented equipment typically charges 100% even when idle" 
        : "Owned equipment standby is typically 50-70% of operational rate"
      }
      value={value}
      onChange={onChange}
      type="number"
      step="0.01"
      suffix="/hr"
      placeholder={`Suggested: $${suggestedRate.toFixed(2)}`}
      validation={(val) => {
        const num = parseFloat(val)
        if (isRented && num < operationalRate * 0.9) {
          return { valid: false, message: "Rented equipment usually charges full rate when idle" }
        }
        if (!isRented && num > operationalRate * 0.7) {
          return { valid: false, message: "Owned equipment standby typically 50-70% of operational" }
        }
        return { valid: true, message: "" }
      }}
    />
  )
}

export function WeatherStationDistance({ stationName, distance }: any) {
  const isValid = distance <= 10
  const isOptimal = distance <= 5
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label>Weather Station</Label>
        <InfoTooltip content="Must be within 10 miles for insurance acceptance. Closer is better." />
      </div>
      
      <div className="p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{stationName}</p>
            <p className="text-sm text-gray-600">{distance.toFixed(1)} miles away</p>
          </div>
          <div>
            {isOptimal ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Optimal</span>
              </div>
            ) : isValid ? (
              <div className="flex items-center gap-2 text-yellow-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Acceptable</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Too Far!</span>
              </div>
            )}
          </div>
        </div>
        
        {!isValid && (
          <p className="text-sm text-red-600 mt-2">
            Insurance requires weather station within 10 miles. This claim may be rejected.
          </p>
        )}
      </div>
    </div>
  )
}