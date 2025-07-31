'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronRight, 
  Home,
  CloudRain,
  Building2,
  FileText,
  BarChart3,
  Menu,
  X,
  Users,
  Wrench,
  ClipboardCheck
} from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: Building2 },
  { name: 'Document Delays', href: '/document', icon: ClipboardCheck },
  { name: 'Crew', href: '/crew', icon: Users },
  { name: 'Equipment', href: '/equipment', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export default function NavigationHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: { name: string; href: string }[] = []
    
    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      
      // Special handling for certain paths
      let name = path.charAt(0).toUpperCase() + path.slice(1)
      
      // Handle special cases
      if (path === 'new') name = 'New'
      if (path === 'import') name = 'Import'
      if (path === 'sign') name = 'Sign'
      if (path === 'edit') name = 'Edit'
      if (path.match(/^[0-9a-f-]+$/)) {
        // UUID pattern - likely an ID
        if (paths[index - 1] === 'projects') name = 'Project Details'
        else if (paths[index - 1] === 'reports') name = 'Report Details'
        else if (paths[index - 1] === 'delays') name = 'Delay Details'
      }
      
      breadcrumbs.push({ name, href: currentPath })
    })
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="bg-white border-b shadow-sm sticky top-10 z-40">
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation */}
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo and Company */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
                <CloudRain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  WeatherProof
                </h1>
                <p className="text-xs text-gray-500">Demo Construction Co</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="px-6 py-2 bg-gray-50 border-t">
            <nav className="flex items-center text-sm">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}