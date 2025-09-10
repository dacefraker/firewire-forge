-- Add RLS policy for temporary file uploads in storage
CREATE POLICY "Users can upload to temp folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[1] != ''
  AND name ~ '^temp/'
);

-- Add RLS policy for temporary file metadata in files table
CREATE POLICY "Users can insert temporary files"
ON public.files
FOR INSERT
WITH CHECK (
  project_id IS NULL 
  AND owner_id = auth.uid()
  AND auth.uid() IS NOT NULL
);

-- Add RLS policy for users to view their temporary files
CREATE POLICY "Users can view their temporary files"
ON public.files
FOR SELECT
USING (
  project_id IS NULL 
  AND owner_id = auth.uid()
);

-- Add RLS policy for users to delete their temporary files
CREATE POLICY "Users can delete their temporary files"
ON public.files
FOR DELETE
USING (
  project_id IS NULL 
  AND owner_id = auth.uid()
);

-- Add RLS policy for users to delete from temp storage folders
CREATE POLICY "Users can delete from temp folders"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND name ~ '^temp/'
);