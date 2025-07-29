import { AuthLayout } from '@/components/layout/AuthLayout'

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
}