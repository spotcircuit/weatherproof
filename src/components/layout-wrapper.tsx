'use client'

import TopHeader from "./top-header"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopHeader />
      <div className="pt-10">
        {children}
      </div>
    </>
  )
}