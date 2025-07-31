'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Image, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { photoService } from '@/services/photo-service'

interface PhotoUploadProps {
  delayEventId: string
  projectId: string
  userId: string
  onUploadComplete?: (photo: any) => void
  maxPhotos?: number
}

export function PhotoUpload({
  delayEventId,
  projectId,
  userId,
  onUploadComplete,
  maxPhotos = 10
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [captions, setCaptions] = useState<{ [key: string]: string }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({})

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length + selectedFiles.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setSelectedFiles(prev => [...prev, ...imageFiles])
    setError(null)
  }, [selectedFiles, maxPhotos])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setCaptions(prev => {
      const updated = { ...prev }
      delete updated[index.toString()]
      return updated
    })
  }, [])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const caption = captions[i.toString()] || ''

        setUploadProgress(prev => ({ ...prev, [i]: true }))

        const result = await photoService.uploadPhoto(
          file,
          delayEventId,
          projectId,
          userId,
          caption
        )

        if (result.success) {
          onUploadComplete?.(result.photo)
        } else {
          throw new Error(`Failed to upload ${file.name}`)
        }

        setUploadProgress(prev => ({ ...prev, [i]: false }))
      }

      // Clear after successful upload
      setSelectedFiles([])
      setCaptions({})
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      console.error('Photo upload error:', {
        error: err,
        message: errorMessage,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2),
        fileCount: selectedFiles.length,
        delayEventId,
        projectId
      })
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            Click to upload photos or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, HEIC up to 10MB each (max {maxPhotos} photos)
          </p>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Selected Photos</h4>
          {selectedFiles.map((file, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-16 w-16 object-cover rounded"
                  />
                  {uploadProgress[index] && (
                    <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Add caption (optional)"
                    value={captions[index] || ''}
                    onChange={(e) => setCaptions(prev => ({
                      ...prev,
                      [index]: e.target.value
                    }))}
                    disabled={uploading}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}