import TopHeader from "@/components/top-header"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopHeader />
      {children}
    </>
  )
}