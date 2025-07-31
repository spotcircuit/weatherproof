'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Wrench, DollarSign, CheckSquare, Square } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  projectId: string
  date: Date
  duration: number // hours
  onCrewChange: (crew: any[]) => void
  onEquipmentChange: (equipment: any[]) => void
  defaultSelectAll?: boolean
  cachedAssignments?: {
    crew: any[]
    equipment: any[]
  }
}

export function CrewEquipmentSelector({ 
  projectId, 
  date, 
  duration, 
  onCrewChange, 
  onEquipmentChange,
  defaultSelectAll = true,
  cachedAssignments
}: Props) {
  const supabase = createClient()
  const [crewAssignments, setCrewAssignments] = useState<any[]>([])
  const [equipmentAssignments, setEquipmentAssignments] = useState<any[]>([])
  const [selectedCrew, setSelectedCrew] = useState<Set<string>>(new Set())
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (cachedAssignments) {
      // Use cached data if available
      setCrewAssignments(cachedAssignments.crew)
      setEquipmentAssignments(cachedAssignments.equipment)
      
      // Default select all if specified
      if (defaultSelectAll) {
        setSelectedCrew(new Set(cachedAssignments.crew.map(c => c.crew_member_id)))
        setSelectedEquipment(new Set(cachedAssignments.equipment.map(e => e.equipment_id)))
      }
      
      setLoading(false)
    } else {
      // Load from database if no cache
      loadAssignments()
    }
  }, [projectId, cachedAssignments])
  
  const loadAssignments = async () => {
    console.log('CrewEquipmentSelector: Loading assignments for project:', projectId)
    try {
      // Load crew assignments with crew member details
      const { data: crew, error: crewError } = await supabase
        .from('project_crew_assignments')
        .select(`
          *,
          crew_members (
            id,
            name,
            role,
            hourly_rate,
            active
          )
        `)
        .eq('project_id', projectId)
      
      if (crewError) {
        console.error('Error loading crew:', crewError)
      } else {
        console.log('Loaded crew assignments:', crew?.length || 0, crew)
      }
      
      // Load equipment assignments with equipment details
      const { data: equipment, error: equipError } = await supabase
        .from('project_equipment_assignments')
        .select(`
          *,
          equipment (
            id,
            name,
            type,
            daily_rate,
            standby_rate,
            active
          )
        `)
        .eq('project_id', projectId)
      
      if (equipError) {
        console.error('Error loading equipment:', equipError)
      } else {
        console.log('Loaded equipment assignments:', equipment?.length || 0, equipment)
      }
      
      if (crew) {
        setCrewAssignments(crew)
        // Default select all if specified
        if (defaultSelectAll) {
          setSelectedCrew(new Set(crew.map(c => c.crew_member_id)))
        }
      }
      
      if (equipment) {
        setEquipmentAssignments(equipment)
        // Default select all if specified
        if (defaultSelectAll) {
          setSelectedEquipment(new Set(equipment.map(e => e.equipment_id)))
        }
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate costs whenever selection changes
  useEffect(() => {
    const crewData = crewAssignments
      .filter(c => selectedCrew.has(c.crew_member_id))
      .map(c => ({
        crew_member_id: c.crew_member_id,
        name: c.crew_members.name,
        role: c.crew_members.role,
        hours_idled: duration,
        hourly_rate: c.crew_members.hourly_rate,
        burden_rate: 1.35, // Standard burden rate
        total_cost: c.crew_members.hourly_rate * 1.35 * duration
      }))
    
    const equipmentData = equipmentAssignments
      .filter(e => selectedEquipment.has(e.equipment_id))
      .map(e => ({
        equipment_id: e.equipment_id,
        name: e.equipment.name,
        type: e.equipment.type,
        hours_idled: duration,
        rate_type: 'standby',
        hourly_rate: e.equipment.standby_rate || e.equipment.daily_rate / 8,
        total_cost: (e.equipment.standby_rate || e.equipment.daily_rate / 8) * duration
      }))
    
    onCrewChange(crewData)
    onEquipmentChange(equipmentData)
  }, [selectedCrew, selectedEquipment, duration])
  
  const toggleCrew = (id: string) => {
    const newSelected = new Set(selectedCrew)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCrew(newSelected)
  }
  
  const toggleEquipment = (id: string) => {
    const newSelected = new Set(selectedEquipment)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEquipment(newSelected)
  }
  
  const selectAllCrew = () => {
    setSelectedCrew(new Set(crewAssignments.map(c => c.crew_member_id)))
  }
  
  const selectNoCrew = () => {
    setSelectedCrew(new Set())
  }
  
  const selectAllEquipment = () => {
    setSelectedEquipment(new Set(equipmentAssignments.map(e => e.equipment_id)))
  }
  
  const selectNoEquipment = () => {
    setSelectedEquipment(new Set())
  }
  
  const totalCrewCost = crewAssignments
    .filter(c => selectedCrew.has(c.crew_member_id))
    .reduce((sum, c) => sum + (c.crew_members.hourly_rate * 1.35 * duration), 0)
  
  const totalEquipmentCost = equipmentAssignments
    .filter(e => selectedEquipment.has(e.equipment_id))
    .reduce((sum, e) => sum + ((e.equipment.standby_rate || e.equipment.daily_rate / 8) * duration), 0)
  
  if (loading) {
    return <div>Loading crew and equipment...</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Crew Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crew Affected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllCrew}>
                <CheckSquare className="h-4 w-4 mr-1" />
                All
              </Button>
              <Button size="sm" variant="outline" onClick={selectNoCrew}>
                <Square className="h-4 w-4 mr-1" />
                None
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Select crew members who were sent home or couldn't work ({duration} hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {crewAssignments.map(assignment => (
              <label 
                key={assignment.crew_member_id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedCrew.has(assignment.crew_member_id)}
                    onCheckedChange={() => toggleCrew(assignment.crew_member_id)}
                  />
                  <div>
                    <p className="font-medium">{assignment.crew_members.name}</p>
                    <p className="text-sm text-gray-500">{assignment.crew_members.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    ${assignment.crew_members.hourly_rate}/hr × 1.35 burden
                  </p>
                  <p className="font-medium">
                    ${(assignment.crew_members.hourly_rate * 1.35 * duration).toFixed(2)}
                  </p>
                </div>
              </label>
            ))}
            
            {crewAssignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No crew assigned to this project
              </p>
            )}
            
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-medium">Total Crew Cost:</span>
              <span className="text-lg font-bold">${totalCrewCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Equipment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment Idled
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllEquipment}>
                <CheckSquare className="h-4 w-4 mr-1" />
                All
              </Button>
              <Button size="sm" variant="outline" onClick={selectNoEquipment}>
                <Square className="h-4 w-4 mr-1" />
                None
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Select equipment that sat idle due to weather ({duration} hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {equipmentAssignments.map(assignment => (
              <label 
                key={assignment.equipment_id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedEquipment.has(assignment.equipment_id)}
                    onCheckedChange={() => toggleEquipment(assignment.equipment_id)}
                  />
                  <div>
                    <p className="font-medium">{assignment.equipment.name}</p>
                    <p className="text-sm text-gray-500">{assignment.equipment.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    Standby: ${assignment.equipment.standby_rate || (assignment.equipment.daily_rate / 8).toFixed(2)}/hr
                  </p>
                  <p className="font-medium">
                    ${((assignment.equipment.standby_rate || assignment.equipment.daily_rate / 8) * duration).toFixed(2)}
                  </p>
                </div>
              </label>
            ))}
            
            {equipmentAssignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No equipment assigned to this project
              </p>
            )}
            
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-medium">Total Equipment Cost:</span>
              <span className="text-lg font-bold">${totalEquipmentCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Total Impact */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Delay Cost:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${(totalCrewCost + totalEquipmentCost).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            For {duration} hours on {format(date, 'MMMM d, yyyy')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}