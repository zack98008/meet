-- Add Google Drive ID column to recordings table
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS google_drive_id TEXT;
