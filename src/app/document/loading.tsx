export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading projects...</p>
      </div>
    </div>
  )
}