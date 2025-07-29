export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind CSS v4 Test</h1>
        <p className="text-gray-700 mb-4">If you can see these styles, Tailwind is working!</p>
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-red-500 rounded"></div>
          <div className="w-20 h-20 bg-green-500 rounded"></div>
          <div className="w-20 h-20 bg-blue-500 rounded"></div>
        </div>
        <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}