import AuthenticatedLayout from '@/components/authenticated-layout'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}