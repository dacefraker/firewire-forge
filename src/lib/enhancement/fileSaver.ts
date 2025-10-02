import { supabase } from '@/integrations/supabase/client';
import { FileRecord } from '@/components/FileUploader';

// Get the next version number for an enhanced file
export async function getNextVersionNumber(
  originalFilename: string,
  projectId: string
): Promise<number> {
  try {
    // Remove extension from original filename
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
    
    // Query existing files to find highest version
    const { data, error } = await supabase
      .from('files')
      .select('filename')
      .eq('project_id', projectId)
      .like('filename', `${nameWithoutExt}%_enhanced_v%`);
    
    if (error) throw error;
    if (!data || data.length === 0) return 1;
    
    // Extract version numbers
    const versions = data.map(file => {
      const match = file.filename.match(/_v(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    return Math.max(...versions) + 1;
  } catch (error) {
    console.error('Error getting next version number:', error);
    return 1;
  }
}

// Generate enhanced filename with version
export function generateEnhancedFilename(
  originalFilename: string,
  version: number,
  pageNumber?: number
): string {
  // Remove original extension
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
  
  // Add page number for multi-page PDFs
  const pageSuffix = pageNumber ? `_page${pageNumber}` : '';
  
  return `${nameWithoutExt}${pageSuffix}_enhanced_v${version}.png`;
}

// Save enhanced image to storage and database
export async function saveEnhancedImage(
  canvas: HTMLCanvasElement,
  originalFile: FileRecord,
  projectId: string,
  userId: string,
  pageNumber?: number
): Promise<FileRecord | null> {
  try {
    // Get next version number
    const version = await getNextVersionNumber(originalFile.filename, projectId);
    
    // Generate new filename
    const newFilename = generateEnhancedFilename(
      originalFile.filename,
      version,
      pageNumber
    );
    
    // Convert canvas to Blob (PNG format for quality)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob from canvas'));
        },
        'image/png',
        1.0
      );
    });
    
    // Generate unique storage path
    const uniquePath = `${projectId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(uniquePath, blob);
    
    if (uploadError) throw uploadError;
    
    // Save to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        filename: newFilename,
        storage_path: uniquePath,
        storage_bucket: 'project-files',
        mime_type: 'image/png',
        size_bytes: blob.size,
        category: originalFile.category || 'Enhanced',
        owner_id: userId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    return fileRecord as FileRecord;
  } catch (error) {
    console.error('Error saving enhanced file:', error);
    throw error;
  }
}
