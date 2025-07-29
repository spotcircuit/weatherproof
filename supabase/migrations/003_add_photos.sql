-- Add photos table for delay event documentation
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delay_event_id UUID NOT NULL REFERENCES delay_events(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File information
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- EXIF metadata
  taken_at TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  device_make TEXT,
  device_model TEXT,
  
  -- Additional metadata
  caption TEXT,
  weather_condition TEXT,
  uploaded_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_photos_delay_event ON photos(delay_event_id);
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_user ON photos(user_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies for photos
CREATE POLICY "Users can view photos for their projects"
  ON photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload photos to their delay events"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (auth.uid() = user_id);

-- Add photo_count to delay_events for quick reference
ALTER TABLE delay_events ADD COLUMN photo_count INTEGER DEFAULT 0;

-- Function to update photo count
CREATE OR REPLACE FUNCTION update_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE delay_events 
    SET photo_count = photo_count + 1
    WHERE id = NEW.delay_event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE delay_events 
    SET photo_count = photo_count - 1
    WHERE id = OLD.delay_event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain photo count
CREATE TRIGGER maintain_photo_count
AFTER INSERT OR DELETE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_photo_count();

-- Add signature support to reports table
ALTER TABLE reports ADD COLUMN signed_by UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN signed_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN signature_data TEXT;
ALTER TABLE reports ADD COLUMN affidavit_text TEXT;