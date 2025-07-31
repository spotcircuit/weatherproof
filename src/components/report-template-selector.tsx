'use client'

import { useState } from 'react'
import { reportTemplates, getTemplatesByCategory, ReportTemplate } from '@/services/report-templates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar,
  CalendarDays,
  DollarSign,
  FileCheck,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Building2,
  Scale,
  Building,
  AlertCircle,
  Users,
  Truck,
  Search,
  CheckCircle,
  ChevronRight,
  Download,
  Send,
  Eye
} from 'lucide-react'

// Map icon names to components
const iconMap: Record<string, any> = {
  Calendar,
  CalendarDays,
  DollarSign,
  FileCheck,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Building2,
  Scale,
  Building,
  AlertCircle,
  Users,
  Truck,
  Split: FileText,
  TrendingUp: Clock
}

interface ReportTemplateSelectorProps {
  onSelectTemplate: (template: ReportTemplate) => void
  projectId?: string
  preselectedType?: string
}

export function ReportTemplateSelector({ 
  onSelectTemplate, 
  projectId,
  preselectedType 
}: ReportTemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(
    preselectedType === 'insurance-claim' ? 'insurance' : 'all'
  )
  
  const categories = [
    { id: 'all', label: 'All Reports', count: reportTemplates.length },
    { id: 'contractor', label: 'Contractor', count: getTemplatesByCategory('contractor').length },
    { id: 'insurance', label: 'Insurance', count: getTemplatesByCategory('insurance').length },
    { id: 'client', label: 'Client', count: getTemplatesByCategory('client').length },
    { id: 'specialized', label: 'Specialized', count: getTemplatesByCategory('specialized').length }
  ]
  
  const filteredTemplates = reportTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contractor': return 'from-blue-500 to-indigo-500'
      case 'insurance': return 'from-red-500 to-orange-500'
      case 'client': return 'from-green-500 to-emerald-500'
      case 'specialized': return 'from-purple-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }
  
  const getCategoryBadgeVariant = (category: string): any => {
    switch (category) {
      case 'contractor': return 'default'
      case 'insurance': return 'destructive'
      case 'client': return 'secondary'
      case 'specialized': return 'outline'
      default: return 'default'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search reports by name, recipient, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="relative">
              {cat.label}
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 p-0 justify-center"
              >
                {cat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No reports found matching your criteria.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTemplates.map(template => {
                const Icon = iconMap[template.icon] || FileText
                
                return (
                  <Card 
                    key={template.id}
                    className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-gray-300"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getCategoryColor(template.category)} flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant={getCategoryBadgeVariant(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>For: {template.recipient}</span>
                        </div>
                        
                        <div className="space-y-1">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex gap-2">
                            {template.outputFormats.includes('pdf') && (
                              <Badge variant="outline" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Badge>
                            )}
                            {template.outputFormats.includes('email') && (
                              <Badge variant="outline" className="text-xs">
                                <Send className="h-3 w-3 mr-1" />
                                Email
                              </Badge>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="gap-1">
                            Select
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Quick info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Each report type automatically includes relevant data from your project. 
            Insurance reports include NOAA verification, client reports use simple language, and contractor 
            reports focus on operational details.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}