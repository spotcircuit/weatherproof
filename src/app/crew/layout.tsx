import AuthenticatedLayout from '@/components/authenticated-layout'

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}