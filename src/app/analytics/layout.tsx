import AuthenticatedLayout from '@/components/authenticated-layout'

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}