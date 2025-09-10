-- Fix storage RLS policies to check correct folder position for user ID
-- Drop and recreate the upload policy with correct folder index
DROP POLICY IF EXISTS "Users can upload to temp folders" ON storage.objects;
CREATE POLICY "Users can upload to temp folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[2] != ''
  AND name ~ '^temp/'
);

-- Drop and recreate the delete policy with correct folder index
DROP POLICY IF EXISTS "Users can delete from temp folders" ON storage.objects;
CREATE POLICY "Users can delete from temp folders"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND name ~ '^temp/'
);