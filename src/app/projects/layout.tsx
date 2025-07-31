import AuthenticatedLayout from '@/components/authenticated-layout'

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}