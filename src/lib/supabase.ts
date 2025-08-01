import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase configuration missing:', {
      url: url ? 'Set' : 'Missing',
      key: key ? 'Set' : 'Missing'
    })
  }
  
  return createBrowserClient(
    url!,
    key!
  )
}