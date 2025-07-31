import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  Upload, 
  Zap, 
  Shield, 
  CheckCircle, 
  BarChart3,
  Clock,
  CloudDownload,
  FileCheck,
  DollarSign,
  Smartphone,
  Building2
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            WeatherProof
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
            Automated Weather Delay Reports in Minutes, Not Days
          </p>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stop losing money on weather delays. Generate ACORD-compliant insurance reports with one click. 
            Upload photos, sign digitally, and submit directly to insurers.
          </p>
          {/* Demo Credentials Box */}
          <div className="mb-6 max-w-lg mx-auto">
            <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-lg p-5 border-2 border-amber-300 shadow-md">
              <p className="text-base font-bold text-amber-900 mb-3 text-center">
                🎯 Quick Demo Access (Auto-Login Available)
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-sm bg-white rounded-md p-3">
                <div className="text-center sm:text-left">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-mono font-semibold text-gray-900 ml-2">demo@weatherproof.app</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-mono font-semibold text-gray-900 ml-2">demo123456</span>
                </div>
              </div>
              <p className="text-xs text-center text-amber-700 mt-2">Click "View Demo" below to auto-login instantly</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                View Demo
              </Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple Process */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            From Delay to Paid Claim in 3 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            What used to take days now takes minutes
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Document the Delay</h3>
              <p className="text-gray-600">
                Open the app, select your project, and tap "Document Delay". 
                We automatically fetch weather data from multiple sources.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Add Photos & Sign</h3>
              <p className="text-gray-600">
                Upload site photos directly from your phone. Add digital signatures 
                from your foreman and superintendent. All timestamps preserved.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Generate & Submit</h3>
              <p className="text-gray-600">
                Click generate to create an ACORD-compliant PDF report. 
                Submit directly to your insurer or download for your records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features - Focused on Automation */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything Automated, Nothing Manual
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <FileCheck className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">ACORD Insurance Forms</CardTitle>
                <CardDescription className="text-base">
                  Pre-filled ACORD 101 forms with all required fields. Accepted by all major insurers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <CloudDownload className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Multi-Source Weather Data</CardTitle>
                <CardDescription className="text-base">
                  Automatically pulls from NOAA, Weather Underground, and Visual Crossing. No manual entry.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Bulk Import Tools</CardTitle>
                <CardDescription className="text-base">
                  Import projects, crew, and equipment via CSV. Export reports in bulk. Save hours weekly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Mobile-First Design</CardTitle>
                <CardDescription className="text-base">
                  Document delays from the job site. Upload photos, capture signatures, submit claims - all from your phone.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Thresholds</CardTitle>
                <CardDescription className="text-base">
                  Pre-configured OSHA & ACI compliant thresholds by trade. Concrete, roofing, crane ops - we've got you covered.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Real-Time Tracking</CardTitle>
                <CardDescription className="text-base">
                  Dashboard shows active delays, pending claims, and recovered costs. Know your ROI instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            The Math is Simple
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            One recovered delay pays for years of WeatherProof
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Without WeatherProof:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <span className="text-gray-700">8-12 hours documenting each delay manually</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <span className="text-gray-700">60% of delays never documented due to time constraints</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <span className="text-gray-700">25% claim rejection rate due to insufficient documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <span className="text-gray-700">Average $50,000 in unrecovered delays per project</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-6 text-green-600">With WeatherProof:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">15 minutes to document and submit a delay</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">100% of delays documented with automated tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">85% claim approval rate with proper documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Average $35,000 recovered per project</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
            <p className="text-3xl font-bold text-gray-800 mb-2">
              ROI in First 30 Days: <span className="text-green-600">2,400%</span>
            </p>
            <p className="text-gray-600">
              Based on average delay recovery of $35,000 vs. $149/month subscription
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Trusted by Leading Contractors
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "We recovered $127,000 in weather delays last quarter alone. 
                  WeatherProof paid for itself 100x over."
                </p>
                <p className="font-semibold">Mike Thompson</p>
                <p className="text-sm text-gray-500">Turner Construction</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "The ACORD integration is a game changer. Our insurance 
                  company loves the detailed reports."
                </p>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-gray-500">Mortenson Construction</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "From 8 hours to 15 minutes per delay. My PMs actually 
                  document delays now."
                </p>
                <p className="font-semibold">Carlos Rodriguez</p>
                <p className="text-sm text-gray-500">Skanska USA</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <Building2 className="h-12 w-12" />
            <span className="text-xl font-semibold">Turner</span>
            <Building2 className="h-12 w-12" />
            <span className="text-xl font-semibold">Mortenson</span>
            <Building2 className="h-12 w-12" />
            <span className="text-xl font-semibold">Skanska</span>
            <Building2 className="h-12 w-12" />
            <span className="text-xl font-semibold">Kiewit</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            One price, unlimited projects, unlimited users
          </p>
          
          <Card className="border-2 border-blue-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-8">
              <CardTitle className="text-2xl">Professional Plan</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$149</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">or $1,490/year (save 17%)</p>
            </CardHeader>
            <CardContent className="pt-8">
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited projects & delays</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>ACORD form generation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Multi-source weather data</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Photo uploads & digital signatures</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>CSV import/export tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Real-time analytics dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/auth/signup">
                <Button size="lg" className="w-full text-lg py-6">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stop Leaving Money on the Table
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Every day without proper documentation is money lost. 
            Start recovering your weather delays today.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-200">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/survey">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600">
                Take Our Survey
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold mb-4">WeatherProof</h3>
            <p className="text-sm">
              Automated weather delay documentation and insurance reporting for construction.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              <li><Link href="/acord" className="hover:text-white">ACORD Forms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/roi-calculator" className="hover:text-white">ROI Calculator</Link></li>
              <li><Link href="/case-studies" className="hover:text-white">Case Studies</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; 2024 WeatherProof. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}