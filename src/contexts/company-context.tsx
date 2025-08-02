'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Company } from '@/types/company'
import { UserProfile } from '@/types/company'

interface CompanyContextType {
  company: Company | null
  userProfile: UserProfile | null
  loading: boolean
  refreshCompanyData: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  userProfile: null,
  loading: true,
  refreshCompanyData: async () => {}
})

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadCompanyData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading user profile:', profileError)
        setLoading(false)
        return
      }

      setUserProfile(profile)

      // Get company if user has one
      if (profile?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (companyError) {
          console.error('Error loading company:', companyError)
        } else {
          setCompany(companyData)
        }
      }
    } catch (error) {
      console.error('Error in loadCompanyData:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanyData()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadCompanyData()
      } else {
        setCompany(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <CompanyContext.Provider value={{ 
      company, 
      userProfile, 
      loading,
      refreshCompanyData: loadCompanyData
    }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}