'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Wrench, 
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Package,
  Activity,
  Hammer,
  Truck,
  Upload,
  Download
} from "lucide-react"
import EquipmentFormModal from "@/components/equipment-form-modal"
import CSVImportModal from "@/components/csv-import-modal"
import { CSVExporter } from "@/services/csv-import-export"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from 'date-fns/format'

interface EquipmentClientProps {
  equipment: any[]
  stats: {
    total: number
    availableCount: number
    totalValue: number
    inUseCount: number
  }
}

export default function EquipmentClient({ equipment: initialEquipment, stats }: EquipmentClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [equipment, setEquipment] = useState(initialEquipment)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingEquipment, setDeletingEquipment] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showImportModal, setShowImportModal] = useState(false)

  const handleEditEquipment = (item: any) => {
    setSelectedEquipment(item)
    setShowFormModal(true)
  }

  const handleDeleteEquipment = async () => {
    if (!deletingEquipment) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', deletingEquipment.id)

      if (error) throw error

      setEquipment(equipment.filter(e => e.id !== deletingEquipment.id))
      setShowDeleteDialog(false)
      setDeletingEquipment(null)
    } catch (error) {
      console.error('Error deleting equipment:', error)
      alert('Failed to delete equipment')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleExportCSV = () => {
    const csv = CSVExporter.exportToCSV(equipment, 'equipment')
    CSVExporter.downloadCSV(csv, `equipment_export_${new Date().toISOString().split('T')[0]}.csv`)
  }

  // Filter equipment
  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-700">Available</Badge>
      case 'in_use':
        return <Badge className="bg-blue-100 text-blue-700">In Use</Badge>
      case 'maintenance':
        return <Badge className="bg-orange-100 text-orange-700">Maintenance</Badge>
      case 'out_of_service':
        return <Badge className="bg-red-100 text-red-700">Out of Service</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Excavator':
      case 'Bulldozer':
      case 'Backhoe':
        return <Truck className="h-4 w-4" />
      case 'Crane':
      case 'Forklift':
        return <Package className="h-4 w-4" />
      case 'Tools':
      case 'Scaffolding':
        return <Hammer className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent animate-gradient">
            Equipment Management
          </h1>
          <p className="text-gray-700 mt-2 text-lg">Track and manage your construction equipment</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="shadow-lg"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="shadow-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={() => {
              setSelectedEquipment(null)
              setShowFormModal(true)
            }}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-amber-50">Total Equipment</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-amber-100 mt-1">
              {stats.availableCount} available
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-blue-50">In Use</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{stats.inUseCount}</div>
            <p className="text-sm text-blue-100 mt-1">
              currently deployed
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-green-50">Total Value</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-sm text-green-100 mt-1">
              daily rate total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-purple-50">Utilization</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              {stats.total > 0 ? Math.round((stats.inUseCount / stats.total) * 100) : 0}%
            </div>
            <p className="text-sm text-purple-100 mt-1">
              equipment in use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search equipment by name or type..." 
            className="pl-10 bg-white shadow-lg border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800">{item.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {item.type}
                        </Badge>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditEquipment(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeletingEquipment(item)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {item.daily_rate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Daily Rate
                      </span>
                      <span className="font-medium text-gray-800">${item.daily_rate}/day</span>
                    </div>
                  )}
                  {item.last_maintenance && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last Service
                      </span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(item.last_maintenance), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
                
                {item.activeProjects > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Active Projects</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {item.activeProjects}
                      </Badge>
                    </div>
                  </div>
                )}

                {item.notes && (
                  <p className="text-sm text-gray-500 pt-2 border-t">{item.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-0 shadow-xl bg-white">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchTerm ? "No equipment found" : "No equipment yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Start tracking your construction equipment and machinery."}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setSelectedEquipment(null)
                setShowFormModal(true)
              }} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <EquipmentFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        equipmentId={selectedEquipment?.id}
        equipmentData={selectedEquipment}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingEquipment?.name}"? This action cannot be undone.
              All project assignments for this equipment will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEquipment}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Equipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        type="equipment"
        onSuccess={handleSuccess}
      />
    </div>
  )
}