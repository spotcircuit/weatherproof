import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, FileText, DollarSign, Shield, Bell, BarChart } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            WeatherProof
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Legal-grade weather documentation for construction delays. 
            Automatically track, document, and report weather-related delays to recover costs through insurance claims.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Document Weather Delays
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CloudRain className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Multi-Source Weather Data</CardTitle>
                <CardDescription>
                  Combines NOAA, Weather Underground, and Visual Crossing for court-admissible documentation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Industry-Standard Thresholds</CardTitle>
                <CardDescription>
                  Pre-configured OSHA and ACI compliant thresholds for concrete, roofing, crane operations, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>One-Click Reports</CardTitle>
                <CardDescription>
                  Generate insurance-ready PDF reports with timestamps, multiple data sources, and cost calculations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Proactive Alerts</CardTitle>
                <CardDescription>
                  Get notified 2-4 hours before weather conditions exceed thresholds to minimize delays
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>ROI Dashboard</CardTitle>
                <CardDescription>
                  Track delay costs, successful claims, and calculate your return on investment in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Historical Analytics</CardTitle>
                <CardDescription>
                  Analyze weather patterns and improve project bidding with historical delay data
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            One Successful Claim Pays for Years of Service
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">$4-6B</p>
              <p className="text-gray-600">Annual weather delays cost to construction industry</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">72hrs</p>
              <p className="text-gray-600">Average delay documentation time saved per month</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">85%</p>
              <p className="text-gray-600">Success rate for claims with proper documentation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Documenting Weather Delays Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join contractors who are successfully recovering weather delay costs
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold mb-4">WeatherProof</h3>
            <p className="text-sm">
              Legal-grade weather documentation for construction professionals.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
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