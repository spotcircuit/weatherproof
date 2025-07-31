// Example of how delay documentation form fields should look with insurance guidance

import { InfoTooltip } from '@/components/ui/info-tooltip'
import { INSURANCE_GUIDANCE } from '@/lib/insurance-guidance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react'

// Example: Crew Selection with Guidance
export function CrewSelectionExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Select Affected Crew Members
          <InfoTooltip content={INSURANCE_GUIDANCE.crew.documentation} />
        </CardTitle>
        <CardDescription>
          Insurance requires individual crew documentation, not just totals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Crew member selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <div>
                <p className="font-medium">John Smith - Foreman</p>
                <p className="text-sm text-gray-600">
                  $85/hr × 1.35 burden = $114.75/hr
                  <InfoTooltip content={INSURANCE_GUIDANCE.crew.burdenRate.tooltip} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">$918.00</p>
              <p className="text-sm text-gray-600">8 hours</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <div>
                <p className="font-medium">Mike Jones - Carpenter</p>
                <p className="text-sm text-gray-600">
                  $45/hr × 1.35 burden = $60.75/hr
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">$486.00</p>
              <p className="text-sm text-gray-600">8 hours</p>
            </div>
          </div>
        </div>
        
        {/* Burden rate breakdown */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Burden Rate Breakdown (35%)
            <InfoTooltip content="Required by insurance for accurate cost calculation" />
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>• Payroll Taxes: 7.65%</div>
            <div>• Workers Comp: 8%</div>
            <div>• Liability Ins: 3%</div>
            <div>• Benefits: 16.35%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example: Equipment Selection with Standby Rates
export function EquipmentSelectionExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Select Idled Equipment
          <InfoTooltip content={INSURANCE_GUIDANCE.equipment.documentation} />
        </CardTitle>
        <CardDescription>
          Use standby rates (50-70% of operational) for owned equipment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <div>
                <p className="font-medium">CAT 320 Excavator</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Owned</Badge>
                  <p className="text-sm text-gray-600">
                    Standby: $75/hr (50% of $150/hr)
                    <InfoTooltip content="Owned equipment typically charges 50% standby rate" />
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">$600.00</p>
              <p className="text-sm text-gray-600">8 hours</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <div>
                <p className="font-medium">50-Ton Crane</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="destructive">Rented</Badge>
                  <p className="text-sm text-gray-600">
                    Daily: $2,000 (100% - paid regardless)
                    <InfoTooltip content="Rented equipment incurs full cost even when idle" />
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-red-600">$2,000.00</p>
              <p className="text-sm text-gray-600">1 day min</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example: Weather Thresholds with Guidelines
export function WeatherThresholdExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Weather Conditions
          <InfoTooltip content="Must match NOAA data within 10 miles" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wind Speed */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Wind Speed
            <InfoTooltip content={INSURANCE_GUIDANCE.weather.thresholds.wind.roofing.tooltip} />
          </label>
          <div className="flex items-center gap-4">
            <input type="number" className="border rounded px-3 py-2" value="28" />
            <span className="text-sm">mph</span>
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Exceeds roofing limit (25 mph)
            </Badge>
          </div>
        </div>
        
        {/* Station Distance */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Weather Station Distance
            <InfoTooltip content={INSURANCE_GUIDANCE.weather.stationDistance.tooltip} />
          </label>
          <div className="flex items-center gap-4">
            <input type="text" className="border rounded px-3 py-2" value="KJFK - 4.2 miles" disabled />
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Within 10 mile limit
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example: Cost Summary with Insurance Guidance
export function CostSummaryExample() {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Total Delay Cost Calculation
          <InfoTooltip content="Insurance requires detailed breakdown with burden rates and standby rates" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Labor (with 35% burden):</span>
            <span className="font-medium">$2,754.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Equipment (standby rates):</span>
            <span className="font-medium">$2,600.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Daily Overhead:
              <InfoTooltip content={INSURANCE_GUIDANCE.costs.overhead.tooltip} />
            </span>
            <span className="font-medium">$500.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Material Protection:
              <InfoTooltip content={INSURANCE_GUIDANCE.costs.materialProtection.tooltip} />
            </span>
            <span className="font-medium">$350.00</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-medium">Total Claimable:</span>
            <span className="text-xl font-bold text-blue-600">$6,204.00</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-sm font-medium text-yellow-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Common Rejection Reasons:
          </p>
          <ul className="text-sm text-yellow-800 mt-2 space-y-1">
            <li>• Generic crew counts instead of names</li>
            <li>• Missing equipment standby documentation</li>
            <li>• Weather station over 10 miles away</li>
            <li>• No photo evidence during delay</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}