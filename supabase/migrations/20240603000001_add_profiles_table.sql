-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add participants table for Google Meet
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id TEXT NOT NULL,
  participant_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  has_camera BOOLEAN DEFAULT TRUE,
  is_camera_on BOOLEAN DEFAULT FALSE,
  join_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leave_time TIMESTAMP WITH TIME ZONE,
  speaking_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for participants
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Add index on meeting_id for faster queries
CREATE INDEX IF NOT EXISTS participants_meeting_id_idx ON participants(meeting_id);
