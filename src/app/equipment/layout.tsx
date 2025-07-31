import AuthenticatedLayout from '@/components/authenticated-layout'

export default function EquipmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}