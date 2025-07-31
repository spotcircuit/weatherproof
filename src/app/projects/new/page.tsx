'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ProjectSetupWizard } from '@/components/project-setup-wizard'
import { ProjectBulkUpload } from '@/components/project-bulk-upload'
import { useRouter } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'

export default function NewProjectPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Create New Project</h1>
      
      <Tabs defaultValue="wizard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-md">
          <TabsTrigger value="wizard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Setup</span> Wizard
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="wizard">
          <ProjectSetupWizard 
            onComplete={(projectId) => router.push(`/projects/${projectId}`)}
          />
        </TabsContent>
        
        <TabsContent value="bulk">
          <ProjectBulkUpload 
            onComplete={() => router.push('/projects')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}