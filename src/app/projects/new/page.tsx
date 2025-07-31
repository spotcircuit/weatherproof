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
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
      
      <Tabs defaultValue="wizard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Setup Wizard
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
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