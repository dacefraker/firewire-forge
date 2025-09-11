import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FileText, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  filename: string;
  category: string | null;
  size_bytes: number | null;
  storage_path: string;
}

interface FileBeingSaved {
  file: File;
  label: string;
  classification: string;
  friendly_name: string;
  progress: number;
}

interface PlansSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: UploadedFile[]) => void;
  title: string;
  description: string;
  projectId?: string | null;
  updateData?: (data: { uploaded_file_ids: string[] }) => void;
  uploadedFileIds?: string[];
}

const FILE_LABELS = [
  'MEP set',
  'Architectural', 
  'Electrical',
  'Sprinkler/Plumbing',
  'Fire Alarm',
  'Low Voltage',
  'Other'
];

const PlansSelectionModal = ({ 
  open, 
  onOpenChange, 
  onFilesSelected, 
  title, 
  description,
  projectId,
  updateData,
  uploadedFileIds = []
}: PlansSelectionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesBeingSaved, setFilesBeingSaved] = useState<FileBeingSaved[]>([]);
  const [showPreSaveDialog, setShowPreSaveDialog] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState('Sprinkler/Plumbing');
  const [otherLabelText, setOtherLabelText] = useState('');
  const [friendlyName, setFriendlyName] = useState('');
  const [classification, setClassification] = useState<'new' | 'existing'>('new');

  useEffect(() => {
    if (open && user) {
      fetchFiles();
    }
  }, [open, user, projectId]);

  const fetchFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('files')
        .select('id, filename, category, size_bytes, storage_path');

      if (projectId) {
        // If we have a project ID, get files associated with this project
        query = query.eq('project_id', projectId);
      } else {
        // In wizard mode, get temporary files uploaded by current user
        query = query.eq('owner_id', user.id).is('project_id', null);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectFiles = () => {
    const selected = files.filter(file => selectedFiles.includes(file.id));
    onFilesSelected(selected);
    onOpenChange(false);
    setSelectedFiles([]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      setCurrentFile(file);
      setFriendlyName(file.name);
      setFileLabel('Sprinkler/Plumbing'); // Pre-select sprinkler category
      setOtherLabelText('');
      setClassification('new');
      setShowPreSaveDialog(true);
    });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => onDrop([file]));
  };

  const saveFile = async () => {
    if (!currentFile || !user) return;

    const finalLabel = fileLabel === 'Other' ? otherLabelText : fileLabel;
    const fileBeingSaved: FileBeingSaved = {
      file: currentFile,
      label: finalLabel,
      classification,
      friendly_name: friendlyName,
      progress: 0
    };

    setFilesBeingSaved(prev => [...prev, fileBeingSaved]);
    setShowPreSaveDialog(false);

    try {
      // Create temporary file path for wizard uploads
      const fileExt = currentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `temp/${user.id}/${fileName}`;
      
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
          filename: friendlyName,
          storage_path: uploadData.path,
          storage_bucket: 'project-files',
          mime_type: currentFile.type,
          size_bytes: currentFile.size,
          category: finalLabel,
          owner_id: user.id,
          project_id: projectId || null
        }])
        .select()
        .single();

      if (fileError) throw fileError;

      clearInterval(progressInterval);

      const newFile: UploadedFile = {
        id: fileRecord.id,
        filename: friendlyName,
        category: finalLabel,
        size_bytes: currentFile.size,
        storage_path: uploadData.path
      };
      
      setFiles(prev => [...prev, newFile]);
      
      // Update wizard data if updateData function is provided
      if (updateData) {
        updateData({ 
          uploaded_file_ids: [...uploadedFileIds, fileRecord.id] 
        });
      }

      setFilesBeingSaved(prev => prev.filter(f => f.file !== currentFile));
      setSelectedFiles(prev => [...prev, fileRecord.id]); // Auto-select the newly uploaded file
      
      toast({
        title: "File Uploaded",
        description: `${friendlyName} has been uploaded successfully.`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setFilesBeingSaved(prev => prev.filter(f => f.file !== currentFile));
      toast({
        title: "Upload Failed", 
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    }

    setCurrentFile(null);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getSprinklerGuidance = () => {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              What to look for in plans:
            </h4>
            <ul className="text-blue-700 dark:text-blue-200 space-y-1">
              <li>• <strong>Sprinkler coverage areas</strong> - Areas protected by sprinklers</li>
              <li>• <strong>Riser locations</strong> - Main water supply connections</li>
              <li>• <strong>Pipe routing</strong> - Sprinkler system piping layout</li>
              <li>• <strong>Fire department connections</strong> - External connections for firefighters</li>
              <li>• <strong>Control valves</strong> - System isolation and control points</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {getSprinklerGuidance()}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading files...</div>
            </div>
          ) : (
            <>
              {/* Files Being Uploaded */}
              {filesBeingSaved.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-3">Uploading Files</h4>
                  <div className="space-y-3">
                    {filesBeingSaved.map((file, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{file.friendly_name}</span>
                          <span className="text-xs text-muted-foreground">{file.progress}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Existing Files */}
              {files.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">
                    Select files that contain sprinkler information:
                  </h4>
                  
                  {files.map((file) => (
                    <Card key={file.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`file-${file.id}`}
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={() => handleFileToggle(file.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <label 
                              htmlFor={`file-${file.id}`}
                              className="font-medium text-sm cursor-pointer truncate"
                            >
                              {file.filename}
                            </label>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {file.category && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {file.category}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size_bytes)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h4 className="text-sm font-medium mb-1">No files uploaded yet</h4>
                  <p className="text-xs text-muted-foreground">
                    Upload sprinkler-related files below to get started.
                  </p>
                </div>
              )}

              {/* Upload Section */}
              <Card className="p-4 border-dashed">
                <div className="text-center">
                  <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-medium mb-1">Don't see your sprinkler file?</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload plans containing sprinkler information
                  </p>
                  
                  <input
                    type="file"
                    id="sprinkler-file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('sprinkler-file-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-3 w-3" />
                    Upload File
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        {(files.length > 0 || filesBeingSaved.length > 0) && (
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectFiles}
              disabled={selectedFiles.length === 0}
            >
              Select {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Files
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Pre-save Dialog */}
      <Dialog open={showPreSaveDialog} onOpenChange={setShowPreSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-label">File Type</Label>
              <Select value={fileLabel} onValueChange={setFileLabel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_LABELS.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fileLabel === 'Other' && (
              <div>
                <Label htmlFor="other-text">Specify Type</Label>
                <Input
                  id="other-text"
                  value={otherLabelText}
                  onChange={(e) => setOtherLabelText(e.target.value)}
                  placeholder="Enter file type"
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="friendly-name">Friendly Name</Label>
              <Input
                id="friendly-name"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                className="mt-1"
                required
              />
            </div>

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

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreSaveDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveFile}
                disabled={!fileLabel || (fileLabel === 'Other' && !otherLabelText) || !friendlyName}
                className="flex-1"
              >
                Save File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PlansSelectionModal;