'use client'

import { useState } from 'react'
import { Trash2, Download, MapPin, Calendar, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { photoService } from '@/services/photo-service'
import { format } from 'date-fns/format'

interface Photo {
  id: string
  filename: string
  file_url: string
  file_size: number
  taken_at?: string
  latitude?: number
  longitude?: number
  device_make?: string
  device_model?: string
  caption?: string
  created_at: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  onPhotoDeleted?: (photoId: string) => void
  canDelete?: boolean
}

export function PhotoGallery({ photos, onPhotoDeleted, canDelete = true }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    setDeleting(photo.id)
    try {
      const result = await photoService.deletePhoto(photo.id, photo.file_url)
      if (result.success) {
        onPhotoDeleted?.(photo.id)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden group relative">
            <div
              className="aspect-square cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.file_url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(photo.file_url, '_blank')
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(photo)
                    }}
                    disabled={deleting === photo.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-2 space-y-1">
              <p className="text-xs font-medium truncate">{photo.filename}</p>
              {photo.caption && (
                <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {photo.taken_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(photo.taken_at), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{selectedPhoto.filename}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3 bg-gray-100 flex items-center justify-center">
                <img
                  src={selectedPhoto.file_url}
                  alt={selectedPhoto.filename}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
              <div className="md:w-1/3 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Photo Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">File Size</dt>
                      <dd>{formatFileSize(selectedPhoto.file_size)}</dd>
                    </div>
                    {selectedPhoto.caption && (
                      <div>
                        <dt className="text-gray-500">Caption</dt>
                        <dd>{selectedPhoto.caption}</dd>
                      </div>
                    )}
                    {selectedPhoto.taken_at && (
                      <div>
                        <dt className="text-gray-500">Taken At</dt>
                        <dd>{format(new Date(selectedPhoto.taken_at), 'PPP p')}</dd>
                      </div>
                    )}
                    {selectedPhoto.latitude && selectedPhoto.longitude && (
                      <div>
                        <dt className="text-gray-500">Location</dt>
                        <dd className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                        </dd>
                      </div>
                    )}
                    {(selectedPhoto.device_make || selectedPhoto.device_model) && (
                      <div>
                        <dt className="text-gray-500">Device</dt>
                        <dd className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {selectedPhoto.device_make} {selectedPhoto.device_model}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Uploaded</dt>
                      <dd>{format(new Date(selectedPhoto.created_at), 'PPP p')}</dd>
                    </div>
                  </dl>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => window.open(selectedPhoto.file_url, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}