import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProjectFile {
  id: string;
  filename: string;
  category: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_at: string;
  owner_id: string | null;
  project_id: string | null;
}

export const useProjectFiles = (projectId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!projectId || !user) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setFiles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files');
      console.error('Error fetching project files:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (
    file: File, 
    filename: string, 
    category: string
  ): Promise<ProjectFile | null> => {
    if (!projectId || !user) return null;

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `projects/${projectId}/${uniqueName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert file metadata into database
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert([{
          filename,
          storage_path: uploadData.path,
          storage_bucket: 'project-files',
          mime_type: file.type,
          size_bytes: file.size,
          category,
          owner_id: user.id,
          project_id: projectId
        }])
        .select()
        .single();

      if (fileError) throw fileError;

      const newFile = fileRecord as ProjectFile;
      setFiles(prev => [newFile, ...prev]);
      
      toast({
        title: "File Uploaded",
        description: `${filename} has been uploaded successfully.`
      });

      return newFile;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateFileName = async (fileId: string, newFilename: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ filename: newFilename })
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, filename: newFilename } : file
      ));

      toast({
        title: "File Renamed",
        description: "File name has been updated successfully."
      });

      return true;
    } catch (err: any) {
      console.error('Error updating file name:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update file name.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) return false;

      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([fileToDelete.storage_path]);

      if (storageError) throw storageError;

      // Remove from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileId));

      toast({
        title: "File Deleted",
        description: "File has been deleted successfully."
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete file.",
        variant: "destructive"
      });
      return false;
    }
  };

  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      
      return data.signedUrl;
    } catch (err: any) {
      console.error('Error creating download URL:', err);
      toast({
        title: "Download Failed",
        description: "Failed to generate download link.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId, user]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
    uploadFile,
    updateFileName,
    deleteFile,
    getDownloadUrl
  };
};