// Client-side PDF generation wrapper to handle dynamic imports

export async function generatePDF(data: any): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const { reportGenerator } = await import('@/services/report-generator')
  return reportGenerator.generateInsuranceReport(data)
}

export async function generateCSV(data: any): Promise<string> {
  const { reportGenerator } = await import('@/services/report-generator')
  return reportGenerator.generateCSVReport(data)
}