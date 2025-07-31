import AuthenticatedLayout from '@/components/authenticated-layout'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}