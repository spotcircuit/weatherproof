'use client'

import TopHeader from "@/components/top-header"
import NavigationHeader from "@/components/navigation-header"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopHeader />
      <NavigationHeader />
      {children}
    </>
  )
}