-- Create a storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the recordings bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'recordings');

CREATE POLICY "Authenticated users can upload recordings" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'recordings');

CREATE POLICY "Users can update their own recordings" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own recordings" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
