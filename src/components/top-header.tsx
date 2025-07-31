'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  AlertCircle,
  Info
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function TopHeader() {
  const router = useRouter()
  const supabase = createClient()
  const [hasAlerts] = useState(true) // This would come from actual data

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="bg-gray-900 text-gray-100 border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-10">
          {/* Left side - Announcements */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-yellow-400">
              <Info className="h-4 w-4" />
              <span>New weather API integration available! <Link href="/settings" className="underline hover:text-yellow-300">Learn more</Link></span>
            </div>
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center gap-2">
            {/* Alerts */}
            <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-100 hover:text-white hover:bg-gray-800 relative">
              <Bell className="h-4 w-4" />
              {hasAlerts && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
              <span className="ml-2 hidden sm:inline">Alerts</span>
            </Button>

            {/* Settings */}
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-100 hover:text-white hover:bg-gray-800">
                <Settings className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Settings</span>
              </Button>
            </Link>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-100 hover:text-white hover:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                      D
                    </div>
                    <span className="hidden sm:inline">Demo User</span>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}