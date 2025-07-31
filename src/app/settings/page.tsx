import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClientNext } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import AuthenticatedLayout from "@/components/authenticated-layout"
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
  Plus
} from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createServerClientNext()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
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
              <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-50">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="weather" className="data-[state=active]:bg-blue-50">
                <Cloud className="h-4 w-4 mr-2" />
                Weather
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-blue-50">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-blue-50">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
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
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                        {profile?.name?.charAt(0) || 'D'}
                      </div>
                      <Button size="sm" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{profile?.name || 'Demo User'}</h3>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={profile?.name || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={user.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" defaultValue={profile?.phone || ''} placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue={profile?.role || 'Project Manager'} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company">
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
                      <Label htmlFor="company">Company Name</Label>
                      <Input id="company" defaultValue={profile?.company || 'Demo Construction Co'} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input id="license" placeholder="LIC-123456" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Company Address</Label>
                      <Input id="address" placeholder="123 Main St, Austin, TX 78701" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" type="url" placeholder="https://example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax">Tax ID</Label>
                      <Input id="tax" placeholder="XX-XXXXXXX" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Company Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Weather Alerts</p>
                          <p className="text-sm text-gray-500">Receive alerts when weather exceeds thresholds</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Daily Summary</p>
                          <p className="text-sm text-gray-500">Daily recap of weather conditions and delays</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Report Ready</p>
                          <p className="text-sm text-gray-500">Notification when reports are generated</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      SMS Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Critical Alerts Only</p>
                          <p className="text-sm text-gray-500">SMS for severe weather warnings</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Delay Start/Stop</p>
                          <p className="text-sm text-gray-500">Notify when delays begin or end</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  {/* Alert Timing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Alert Timing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Advance Warning (hours)</Label>
                        <Input type="number" defaultValue="4" min="1" max="24" />
                      </div>
                      <div className="space-y-2">
                        <Label>Quiet Hours</Label>
                        <div className="flex gap-2">
                          <Input type="time" defaultValue="22:00" />
                          <span className="self-center">to</span>
                          <Input type="time" defaultValue="06:00" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weather Tab */}
            <TabsContent value="weather">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Weather Thresholds</CardTitle>
                  <CardDescription>Set default thresholds for weather delay triggers</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wind">Wind Speed (mph)</Label>
                      <Input id="wind" type="number" defaultValue="25" />
                      <p className="text-sm text-gray-500">Typical: 25-35 mph for most work</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rain">Precipitation (inches/hr)</Label>
                      <Input id="rain" type="number" step="0.1" defaultValue="0.25" />
                      <p className="text-sm text-gray-500">Typical: 0.25" for concrete, 0.5" for general</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp-min">Min Temperature (°F)</Label>
                      <Input id="temp-min" type="number" defaultValue="40" />
                      <p className="text-sm text-gray-500">Typical: 40°F for concrete work</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp-max">Max Temperature (°F)</Label>
                      <Input id="temp-max" type="number" defaultValue="95" />
                      <p className="text-sm text-gray-500">OSHA guidelines: 95°F+ requires precautions</p>
                    </div>
                  </div>

                  {/* Weather Sources */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Weather Data Sources</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Cloud className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">NOAA</p>
                            <p className="text-sm text-gray-500">National Weather Service data</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Cloud className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Weather Underground</p>
                            <p className="text-sm text-gray-500">Hyperlocal station network</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Cloud className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Visual Crossing</p>
                            <p className="text-sm text-gray-500">Historical weather data</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Link href="/settings/thresholds">
                      <Button variant="outline">
                        <CloudRain className="h-4 w-4 mr-2" />
                        Manage Templates
                      </Button>
                    </Link>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Weather Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and access</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Change Password
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <Button variant="outline">Update Password</Button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">2FA Not Enabled</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>

                  {/* API Keys */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">API Keys</h3>
                    <p className="text-sm text-gray-500">Manage API keys for third-party integrations</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Production API Key</p>
                          <p className="text-sm text-gray-500 font-mono">wp_live_k3y_************</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Regenerate</Button>
                          <Button variant="outline" size="sm">Revoke</Button>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate New API Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>Manage your subscription and payment methods</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Current Plan */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-blue-900">Professional Plan</h4>
                          <p className="text-blue-700">$149/month • Billed monthly</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Projects</p>
                          <p className="font-semibold">Unlimited</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Team Members</p>
                          <p className="font-semibold">Up to 10</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Weather Sources</p>
                          <p className="font-semibold">All Premium</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Support</p>
                          <p className="font-semibold">Priority</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Method</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recent Invoices</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">November 2024</p>
                          <p className="text-sm text-gray-500">Professional Plan</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$149.00</p>
                          <Button variant="link" size="sm" className="h-auto p-0">Download</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">October 2024</p>
                          <p className="text-sm text-gray-500">Professional Plan</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$149.00</p>
                          <Button variant="link" size="sm" className="h-auto p-0">Download</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}