import { createClient } from '@supabase/supabase-js'
import exifr from 'exifr'

interface PhotoMetadata {
  takenAt?: Date
  latitude?: number
  longitude?: number
  deviceMake?: string
  deviceModel?: string
}

export class PhotoService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Extract EXIF metadata from image file
   */
  async extractMetadata(file: File): Promise<PhotoMetadata> {
    try {
      const exifData = await exifr.parse(file, {
        // Extract specific tags we need
        pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model']
      })

      return {
        takenAt: exifData?.DateTimeOriginal ? new Date(exifData.DateTimeOriginal) : undefined,
        latitude: exifData?.latitude,
        longitude: exifData?.longitude,
        deviceMake: exifData?.Make,
        deviceModel: exifData?.Model
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error)
      return {}
    }
  }

  /**
   * Upload photo to Supabase storage
   */
  async uploadPhoto(
    file: File,
    delayEventId: string,
    projectId: string,
    userId: string,
    caption?: string
  ) {
    try {
      // Extract EXIF metadata
      const metadata = await this.extractMetadata(file)

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${projectId}/${delayEventId}/${timestamp}-${file.name}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('delay-photos')
        .upload(filename, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('delay-photos')
        .getPublicUrl(filename)

      // Save photo record to database
      const { data: photo, error: dbError } = await this.supabase
        .from('photos')
        .insert({
          delay_event_id: delayEventId,
          project_id: projectId,
          user_id: userId,
          filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          taken_at: metadata.takenAt?.toISOString(),
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          device_make: metadata.deviceMake,
          device_model: metadata.deviceModel,
          caption: caption,
          uploaded_by: userId
        })
        .select()
        .single()

      if (dbError) throw dbError

      return { success: true, photo }
    } catch (error) {
      console.error('Error uploading photo:', error)
      return { success: false, error }
    }
  }

  /**
   * Get photos for a delay event
   */
  async getDelayEventPhotos(delayEventId: string) {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('delay_event_id', delayEventId)
      .order('taken_at', { ascending: false })

    return { data, error }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string, fileUrl: string) {
    try {
      // Extract path from URL
      const urlParts = fileUrl.split('/delay-photos/')
      const filePath = urlParts[1]

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('delay-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      return { success: true }
    } catch (error) {
      console.error('Error deleting photo:', error)
      return { success: false, error }
    }
  }

  /**
   * Generate photo evidence section for reports
   */
  formatPhotosForReport(photos: any[]) {
    return photos.map(photo => ({
      filename: photo.filename,
      takenAt: photo.taken_at ? new Date(photo.taken_at).toLocaleString() : 'Unknown',
      location: photo.latitude && photo.longitude 
        ? `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`
        : 'Not available',
      device: photo.device_make && photo.device_model
        ? `${photo.device_make} ${photo.device_model}`
        : 'Unknown device',
      caption: photo.caption || '',
      url: photo.file_url
    }))
  }
}

export const photoService = new PhotoService()