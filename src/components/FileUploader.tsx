import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  X, 
  Edit, 
  Download, 
  Search,
  Plus,
  AlertCircle,
  Check,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import FileViewer from './FileViewer';

// Enhanced file categories with more specific types
export const ENHANCED_FILE_CATEGORIES = [
  'Floor Plans',
  'Mechanical Drawings',
  'Electrical Drawings',
  'Plumbing/Fire Protection',
  'Structural Drawings',
  'Fire Alarm',
  'Low Voltage',
  'Specifications',
  'Equipment Sheets',
  'Photos/Images',
  'MEP Set',
  'Architectural',
  'Other'
];

export interface FileRecord {
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

interface FileBeingSaved {
  file: File;
  filename: string;
  category: string;
  classification?: string;
  progress: number;
}

interface FileUploaderProps {
  mode: 'temporary' | 'project';
  projectId?: string;
  projectName?: string;
  categories?: string[];
  showClassification?: boolean;
  maxFiles?: number;
  existingFiles?: FileRecord[];
  onFilesChange?: (files: FileRecord[]) => void;
  className?: string;
}

export const FileUploader = ({
  mode,
  projectId,
  projectName,
  categories = ENHANCED_FILE_CATEGORIES,
  showClassification = false,
  maxFiles,
  existingFiles = [],
  onFilesChange,
  className
}: FileUploaderProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [files, setFiles] = useState<FileRecord[]>(existingFiles);
  const [filesBeingSaved, setFilesBeingSaved] = useState<FileBeingSaved[]>([]);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [category, setCategory] = useState('');
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const [classification, setClassification] = useState<'new' | 'existing'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.category && file.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    selectedFiles.forEach(file => {
      if (maxFiles && files.length + filesBeingSaved.length >= maxFiles) {
        toast({
          title: "File Limit Reached",
          description: `Maximum of ${maxFiles} files allowed.`,
          variant: "destructive"
        });
        return;
      }
      
      setCurrentFile(file);
      setFilename(file.name);
      setCategory('');
      setOtherCategoryText('');
      setClassification('new');
      setShowFileDialog(true);
    });
  }, [files.length, filesBeingSaved.length, maxFiles, toast]);

  const saveFile = async () => {
    if (!currentFile || !user) return;

    const finalCategory = category === 'Other' ? otherCategoryText : category;
    const fileBeingSaved: FileBeingSaved = {
      file: currentFile,
      filename,
      category: finalCategory,
      classification: showClassification ? classification : undefined,
      progress: 0
    };

    setFilesBeingSaved(prev => [...prev, fileBeingSaved]);
    setShowFileDialog(false);
    setError(null);

    try {
      // Create file path based on mode
      const fileExt = currentFile.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = mode === 'temporary' 
        ? `temp/${user.id}/${uniqueName}`
        : `${projectId}/${uniqueName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFilesBeingSaved(prev => 
          prev.map(f => 
            f.file === currentFile 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, currentFile);

      if (uploadError) throw uploadError;

      // Insert file metadata into database
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert([{
          filename,
          storage_path: uploadData.path,
          storage_bucket: 'project-files',
          mime_type: currentFile.type,
          size_bytes: currentFile.size,
          category: finalCategory,
          owner_id: user.id,
          project_id: mode === 'project' ? projectId : null
        }])
        .select()
        .single();

      if (fileError) throw fileError;

      clearInterval(progressInterval);

      const newFile: FileRecord = fileRecord as FileRecord;
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      setFilesBeingSaved(prev => prev.filter(f => f.file !== currentFile));
      
      toast({
        title: "File Uploaded",
        description: `${filename} has been uploaded successfully.`
      });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setFilesBeingSaved(prev => prev.filter(f => f.file !== currentFile));
      setError(err.message || 'Failed to upload file');
      toast({
        title: "Upload Failed", 
        description: err.message || "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    }

    setCurrentFile(null);
  };

  const deleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) return;

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

      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      toast({
        title: "File Deleted",
        description: "File has been deleted successfully."
      });
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete file.",
        variant: "destructive"
      });
    }
  };

  const updateFileName = async (fileId: string, newFilename: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ filename: newFilename })
        .eq('id', fileId);

      if (error) throw error;

      const updatedFiles = files.map(file => 
        file.id === fileId ? { ...file, filename: newFilename } : file
      );
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      toast({
        title: "File Renamed",
        description: "File name has been updated successfully."
      });
    } catch (err: any) {
      console.error('Error updating file name:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update file name.",
        variant: "destructive"
      });
    }
  };

  const getDownloadUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, 3600);

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

  const handleDownload = async (file: FileRecord) => {
    const url = await getDownloadUrl(file.storage_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = async (file: FileRecord) => {
    const url = await getDownloadUrl(file.storage_path);
    if (url) {
      setViewingFile(file);
      setViewerUrl(url);
      setIsViewerOpen(true);
    }
  };

  const isViewableFile = (mimeType: string | null) => {
    if (!mimeType) return false;
    return (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('image/')
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={className}>
      {mode === 'project' && (
        <div className="flex gap-4 items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Upload Area */}
      <Card className="p-8 mb-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Files</h3>
          <p className="text-muted-foreground mb-6">
            {mode === 'project' && projectName && `Upload files for ${projectName}`}
            {mode === 'temporary' && 'Upload project files, plans, and documentation'}
          </p>
          
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="flex items-center gap-2"
            disabled={maxFiles ? files.length + filesBeingSaved.length >= maxFiles : false}
          >
            <Upload className="h-4 w-4" />
            Choose Files
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Drag and drop files here or click to browse
          </p>
          {maxFiles && (
            <p className="text-xs text-muted-foreground">
              {files.length + filesBeingSaved.length} of {maxFiles} files
            </p>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files Being Saved */}
      {filesBeingSaved.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Uploading Files</h3>
          <div className="space-y-4">
            {filesBeingSaved.map((file, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">{file.progress}%</span>
                </div>
                <Progress value={file.progress} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Uploaded Files */}
      {filteredFiles.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {mode === 'project' ? 'Project Files' : 'Uploaded Files'}
          </h3>
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingFileId === file.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await updateFileName(file.id, editingFileName);
                            setEditingFileId(null);
                            setEditingFileName('');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFileId(null);
                            setEditingFileName('');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium truncate">{file.filename}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {file.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {file.category}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size_bytes)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(file.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingFileId !== file.id && (
                  <div className="flex items-center gap-2">
                    {isViewableFile(file.mime_type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {mode === 'project' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingFileId(file.id);
                        setEditingFileName(file.filename);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
                          deleteFile(file.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : files.length === 0 && filteredFiles.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No files uploaded</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your first file to get started.
          </p>
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        </div>
      )}

      {/* File Details Dialog */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === 'Other' && (
              <div>
                <Label htmlFor="other-category">Specify Category</Label>
                <Input
                  id="other-category"
                  value={otherCategoryText}
                  onChange={(e) => setOtherCategoryText(e.target.value)}
                  placeholder="Enter category"
                  className="mt-1"
                  required
                />
              </div>
            )}

            {showClassification && (
              <div>
                <Label>Classification</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={classification === 'new' ? "default" : "outline"}
                    onClick={() => setClassification('new')}
                    size="sm"
                    className="flex-1"
                  >
                    New
                  </Button>
                  <Button
                    variant={classification === 'existing' ? "default" : "outline"}
                    onClick={() => setClassification('existing')}
                    size="sm"
                    className="flex-1"
                  >
                    Existing
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFileDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveFile}
                disabled={!filename || !category || (category === 'Other' && !otherCategoryText)}
                className="flex-1"
              >
                Save File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <FileViewer
        file={viewingFile}
        fileUrl={viewerUrl}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewingFile(null);
          setViewerUrl(null);
        }}
        onDownload={() => {
          if (viewingFile) {
            handleDownload(viewingFile);
          }
        }}
      />
    </div>
  );
};

export default FileUploader;