-- Create meeting_metadata table
CREATE TABLE IF NOT EXISTS meeting_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  participants TEXT[],
  host_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add meeting_id foreign key to recordings table
ALTER TABLE recordings
ADD COLUMN IF NOT EXISTS meeting_metadata_id UUID REFERENCES meeting_metadata(id);

-- Enable realtime for meeting_metadata
alter publication supabase_realtime add table meeting_metadata;
