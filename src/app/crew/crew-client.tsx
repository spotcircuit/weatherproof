'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Users, 
  Phone, 
  Mail, 
  DollarSign,
  Award,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  UserPlus,
  Upload,
  Download
} from "lucide-react"
import CrewFormModal from "@/components/crew-form-modal"
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

interface CrewClientProps {
  crewMembers: any[]
  stats: {
    total: number
    activeCount: number
    totalPayroll: number
    averageRate: number
  }
}

export default function CrewClient({ crewMembers: initialMembers, stats }: CrewClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [crewMembers, setCrewMembers] = useState(initialMembers)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingMember, setDeletingMember] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showImportModal, setShowImportModal] = useState(false)

  const handleEditMember = (member: any) => {
    setSelectedMember(member)
    setShowFormModal(true)
  }

  const handleDeleteMember = async () => {
    if (!deletingMember) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', deletingMember.id)

      if (error) throw error

      setCrewMembers(crewMembers.filter(m => m.id !== deletingMember.id))
      setShowDeleteDialog(false)
      setDeletingMember(null)
    } catch (error) {
      console.error('Error deleting crew member:', error)
      alert('Failed to delete crew member')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleExportCSV = () => {
    const csv = CSVExporter.exportToCSV(crewMembers, 'crew')
    CSVExporter.downloadCSV(csv, `crew_export_${new Date().toISOString().split('T')[0]}.csv`)
  }

  // Filter crew members
  const filteredMembers = crewMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Foreman': 'bg-purple-100 text-purple-700',
      'Superintendent': 'bg-blue-100 text-blue-700',
      'Project Manager': 'bg-green-100 text-green-700',
      'Carpenter': 'bg-orange-100 text-orange-700',
      'Electrician': 'bg-yellow-100 text-yellow-700',
      'Plumber': 'bg-cyan-100 text-cyan-700',
      'Mason': 'bg-red-100 text-red-700',
      'Laborer': 'bg-gray-100 text-gray-700',
      'Equipment Operator': 'bg-indigo-100 text-indigo-700',
      'Safety Manager': 'bg-pink-100 text-pink-700',
    }
    return roleColors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Crew Management
          </h1>
          <p className="text-gray-700 mt-2 text-lg">Manage your team members and assignments</p>
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
              setSelectedMember(null)
              setShowFormModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Add Crew Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-blue-50">Total Crew</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-blue-100 mt-1">
              {stats.activeCount} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-purple-50">Average Rate</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">${stats.averageRate.toFixed(0)}</div>
            <p className="text-sm text-purple-100 mt-1">
              per hour
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden relative group hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-300"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-medium text-green-50">Total Payroll</CardTitle>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">${stats.totalPayroll.toLocaleString()}</div>
            <p className="text-sm text-green-100 mt-1">
              per hour combined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, role, or email..." 
            className="pl-10 bg-white shadow-lg border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Crew Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800">{member.name}</CardTitle>
                      <Badge variant="secondary" className={`mt-1 ${getRoleBadgeColor(member.role)}`}>
                        <Award className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditMember(member)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeletingMember(member)
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
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {member.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-gray-800">${member.hourly_rate}/hour</span>
                  </div>
                </div>
                
                {member.activeProjects > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Active Projects</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {member.activeProjects}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-0 shadow-xl bg-white">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchTerm ? "No crew members found" : "No crew members yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Get started by adding your first crew member to the team."}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setSelectedMember(null)
                setShowFormModal(true)
              }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Crew Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <CrewFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        memberId={selectedMember?.id}
        memberData={selectedMember}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crew Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingMember?.name}"? This action cannot be undone.
              All project assignments for this crew member will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMember}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        type="crew"
        onSuccess={handleSuccess}
      />
    </div>
  )
}