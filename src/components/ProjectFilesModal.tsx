import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useProjectFiles, ProjectFile } from '@/hooks/useProjectFiles';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectFilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

interface FileUpload {
  file: File;
  progress: number;
  category: string;
  filename: string;
}

const FILE_CATEGORIES = [
  'MEP set',
  'Architectural', 
  'Electrical',
  'Sprinkler/Plumbing',
  'Fire Alarm',
  'Low Voltage',
  'Other'
];

const ProjectFilesModal = ({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: ProjectFilesModalProps) => {
  const { files, loading, error, uploadFile, updateFileName, deleteFile, getDownloadUrl } = useProjectFiles(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<FileUpload[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFileCategory, setNewFileCategory] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.category && file.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewFileName(file.name);
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newFileName || !newFileCategory) return;

    const uploadProgress: FileUpload = {
      file: selectedFile,
      progress: 0,
      category: newFileCategory,
      filename: newFileName
    };

    setUploadingFiles(prev => [...prev, uploadProgress]);
    setShowUploadForm(false);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadingFiles(prev => 
        prev.map(upload => 
          upload.file === selectedFile 
            ? { ...upload, progress: Math.min(upload.progress + 15, 90) }
            : upload
        )
      );
    }, 300);

    const result = await uploadFile(selectedFile, newFileName, newFileCategory);
    
    clearInterval(progressInterval);
    setUploadingFiles(prev => prev.filter(upload => upload.file !== selectedFile));

    if (result) {
      setSelectedFile(null);
      setNewFileName('');
      setNewFileCategory('');
    }
  };

  const handleDownload = async (file: ProjectFile) => {
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

  const handleEdit = (file: ProjectFile) => {
    setEditingFileId(file.id);
    setEditingFileName(file.filename);
  };

  const handleSaveEdit = async () => {
    if (!editingFileId || !editingFileName) return;
    
    const success = await updateFileName(editingFileId, editingFileName);
    if (success) {
      setEditingFileId(null);
      setEditingFileName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingFileId(null);
    setEditingFileName('');
  };

  const handleDelete = async (file: ProjectFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      await deleteFile(file.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Files - {projectName}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Manage files and documents for this project
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Search and Upload Section */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
              />
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload File
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-sm mb-3">Uploading Files</h4>
                <div className="space-y-3">
                  {uploadingFiles.map((upload, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{upload.filename}</span>
                        <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                      </div>
                      <Progress value={upload.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Files List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading files...</div>
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
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
                                onClick={handleSaveEdit}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-medium text-sm truncate">{file.filename}</h4>
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(file)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(file)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No files uploaded</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your first file to get started managing project documents.
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
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Form Dialog */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="mt-1"
                placeholder="Enter file name"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newFileCategory} onValueChange={setNewFileCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!newFileName || !newFileCategory}
                className="flex-1"
              >
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectFilesModal;