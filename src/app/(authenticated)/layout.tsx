import TopHeader from "@/components/top-header"
import { CompanyProvider } from "@/contexts/company-context"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CompanyProvider>
      <TopHeader />
      {children}
    </CompanyProvider>
  )
}