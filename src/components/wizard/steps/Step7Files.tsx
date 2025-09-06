import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WizardData } from '../ProjectWizard';

interface Step7Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

interface UploadedFile {
  id: number;
  name: string;
  label: string;
  classification: string;
  friendly_name: string;
  url: string;
}

interface FileBeingSaved {
  file: File;
  label: string;
  classification: string;
  friendly_name: string;
  progress: number;
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

const Step7Files = ({ data, updateData }: Step7Props) => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [filesBeingSaved, setFilesBeingSaved] = useState<FileBeingSaved[]>([]);
  const [showPreSaveDialog, setShowPreSaveDialog] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState('');
  const [otherLabelText, setOtherLabelText] = useState('');
  const [friendlyName, setFriendlyName] = useState('');
  const [classification, setClassification] = useState<'new' | 'existing'>('new');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      setCurrentFile(file);
      setFriendlyName(file.name);
      setFileLabel('');
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
    if (!currentFile) return;

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
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('label', finalLabel);
      formData.append('classification', classification);
      formData.append('friendly_name', friendlyName);

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
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

      const response = await fetch('/api/wizard/files', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken || ''
        },
        credentials: 'same-origin',
        body: formData
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        const newFile: UploadedFile = result[0];
        
        setUploadedFiles(prev => [...prev, newFile]);
        updateData({ 
          uploaded_file_ids: [...data.uploaded_file_ids, newFile.id] 
        });

        setFilesBeingSaved(prev => prev.filter(f => f.file !== currentFile));
        
        toast({
          title: "File Uploaded",
          description: `${friendlyName} has been uploaded successfully.`
        });
      } else {
        throw new Error('Upload failed');
      }
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

  const removeFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    updateData({
      uploaded_file_ids: data.uploaded_file_ids.filter(id => id !== fileId)
    });
  };

  const editFile = (file: UploadedFile) => {
    // TODO: Implement file editing functionality
    console.log('Edit file:', file);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Files</h2>
        <p className="text-muted-foreground">Upload project files, plans, and documentation</p>
      </div>

      <div className="space-y-6">
        {/* Upload Area */}
        <Card className="p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload Files</h3>
            <p className="text-muted-foreground mb-6">
              Floor plans, equipment lists, images, videos, PDFs, DWG, ZIP files
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
            >
              <Upload className="h-4 w-4" />
              Choose Files
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Drag and drop files here or click to browse
            </p>
          </div>
        </Card>

        {/* Files Being Saved */}
        {filesBeingSaved.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Uploading Files</h3>
            <div className="space-y-4">
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

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.friendly_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {file.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          file.classification === 'new' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {file.classification}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editFile(file)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

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
    </div>
  );
};

export default Step7Files;