'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  CreditCard,
  Key,
  Mail,
  Phone,
  MapPin,
  Cloud,
  AlertTriangle,
  Save,
  Upload,
  Camera,
  CloudRain,
  Plus,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Globe,
  FileText,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react"
import type { Company, UserProfile, UserWithCompany } from '@/types/company'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SettingsClient() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [companyUsers, setCompanyUsers] = useState<UserWithCompany[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)

        // Load company if user has one
        if (profile.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()

          if (companyData) {
            setCompany(companyData)

            // Load company users
            const { data: users } = await supabase
              .from('users_with_company')
              .select('*')
              .eq('company_id', profile.company_id)
              .order('created_at')

            if (users) {
              setCompanyUsers(users)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          display_name: userProfile.display_name,
          phone: userProfile.phone,
          mobile_phone: userProfile.mobile_phone,
          job_title: userProfile.job_title,
          department: userProfile.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCompany = async () => {
    if (!company) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: company.name,
          legal_name: company.legal_name,
          tax_id: company.tax_id,
          email: company.email,
          phone: company.phone,
          website: company.website,
          address_line1: company.address_line1,
          address_line2: company.address_line2,
          city: company.city,
          state: company.state,
          zip_code: company.zip_code,
          license_number: company.license_number,
          insurance_carrier: company.insurance_carrier,
          insurance_policy_number: company.insurance_policy_number,
          timezone: company.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Company information updated successfully'
      })
    } catch (error) {
      console.error('Error saving company:', error)
      toast({
        title: 'Error',
        description: 'Failed to save company information',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCompany = async () => {
    setSaving(true)
    try {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'My Company',
          created_by: user.id,
          company_type: 'contractor'
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Update user profile with company
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          company_id: newCompany.id,
          role: 'owner'
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Create company_users entry
      const { error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: newCompany.id,
          user_id: user.id,
          role: 'owner'
        })

      if (userError) throw userError

      setCompany(newCompany)
      setUserProfile(prev => prev ? { ...prev, company_id: newCompany.id, role: 'owner' } : null)
      
      toast({
        title: 'Success',
        description: 'Company created successfully'
      })
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail || !company) return

    setInviting(true)
    try {
      // Here you would typically send an invitation email
      // For now, we'll just show a success message
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      })
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRole('user')
    } catch (error) {
      console.error('Error inviting user:', error)
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account, company, and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white shadow-md">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-50">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="data-[state=active]:bg-blue-50">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-50">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-50">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-50">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {userProfile && (
                  <>
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                          {userProfile.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <Button size="sm" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {userProfile.display_name || `${userProfile.first_name} ${userProfile.last_name}` || 'User'}
                        </h3>
                        <p className="text-gray-500">{user?.email}</p>
                        {userProfile.role && (
                          <Badge className="mt-1">{userProfile.role}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input 
                          id="first_name" 
                          value={userProfile.first_name || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input 
                          id="last_name" 
                          value={userProfile.last_name || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, last_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input 
                          id="display_name" 
                          value={userProfile.display_name || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, display_name: e.target.value })}
                          placeholder="How you want to be called"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user?.email || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          value={userProfile.phone || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile_phone">Mobile Phone</Label>
                        <Input 
                          id="mobile_phone" 
                          type="tel" 
                          value={userProfile.mobile_phone || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, mobile_phone: e.target.value })}
                          placeholder="+1 (555) 123-4567" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input 
                          id="job_title" 
                          value={userProfile.job_title || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, job_title: e.target.value })}
                          placeholder="Project Manager"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input 
                          id="department" 
                          value={userProfile.department || ''} 
                          onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                          placeholder="Construction"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            {!company ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Company Yet</h3>
                  <p className="text-gray-600 mb-6">Create a company to manage projects and team members</p>
                  <Button 
                    onClick={handleCreateCompany}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Company
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Manage your company details and branding</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Company Logo */}
                  <div className="space-y-4">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-dashed border-blue-300">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input 
                        id="company_name" 
                        value={company.name} 
                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_name">Legal Name</Label>
                      <Input 
                        id="legal_name" 
                        value={company.legal_name || ''} 
                        onChange={(e) => setCompany({ ...company, legal_name: e.target.value })}
                        placeholder="Company LLC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID / EIN</Label>
                      <Input 
                        id="tax_id" 
                        value={company.tax_id || ''} 
                        onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input 
                        id="license" 
                        value={company.license_number || ''} 
                        onChange={(e) => setCompany({ ...company, license_number: e.target.value })}
                        placeholder="LIC-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_email">Company Email</Label>
                      <Input 
                        id="company_email" 
                        type="email"
                        value={company.email || ''} 
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                        placeholder="info@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_phone">Company Phone</Label>
                      <Input 
                        id="company_phone" 
                        type="tel"
                        value={company.phone || ''} 
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        type="url" 
                        value={company.website || ''} 
                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={company.timezone || 'America/New_York'} 
                        onValueChange={(value) => setCompany({ ...company, timezone: value })}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address1">Street Address</Label>
                        <Input 
                          id="address1" 
                          value={company.address_line1 || ''} 
                          onChange={(e) => setCompany({ ...company, address_line1: e.target.value })}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address2">Address Line 2</Label>
                        <Input 
                          id="address2" 
                          value={company.address_line2 || ''} 
                          onChange={(e) => setCompany({ ...company, address_line2: e.target.value })}
                          placeholder="Suite 100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          value={company.city || ''} 
                          onChange={(e) => setCompany({ ...company, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          value={company.state || ''} 
                          onChange={(e) => setCompany({ ...company, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input 
                          id="zip" 
                          value={company.zip_code || ''} 
                          onChange={(e) => setCompany({ ...company, zip_code: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Insurance Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Insurance & Bonding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="insurance_carrier">Insurance Carrier</Label>
                        <Input 
                          id="insurance_carrier" 
                          value={company.insurance_carrier || ''} 
                          onChange={(e) => setCompany({ ...company, insurance_carrier: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="insurance_policy">Policy Number</Label>
                        <Input 
                          id="insurance_policy" 
                          value={company.insurance_policy_number || ''} 
                          onChange={(e) => setCompany({ ...company, insurance_policy_number: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveCompany}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Company Info
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage users in your company</CardDescription>
                  </div>
                  {company && userProfile?.role && ['owner', 'admin'].includes(userProfile.role) && (
                    <Button onClick={() => setShowInviteDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {companyUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.display_name || `${member.first_name} ${member.last_name}` || 'Unnamed User'}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{member.job_title || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={member.is_active ? 'default' : 'secondary'}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {member.id !== user?.id && userProfile?.role && ['owner', 'admin'].includes(userProfile.role) && (
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Team Members</h3>
                    <p className="text-gray-600">Invite team members to collaborate on projects</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain the same as in the original file */}
          <TabsContent value="notifications">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and access</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={inviting || !inviteEmail}>
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}