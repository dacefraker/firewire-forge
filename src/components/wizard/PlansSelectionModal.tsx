import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  id: string;
  filename: string;
  category: string | null;
  size_bytes: number | null;
  storage_path: string;
}

interface PlansSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: UploadedFile[]) => void;
  title: string;
  description: string;
  projectId?: string | null;
}

const PlansSelectionModal = ({ 
  open, 
  onOpenChange, 
  onFilesSelected, 
  title, 
  description,
  projectId 
}: PlansSelectionModalProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

        <div className="flex-1 overflow-y-auto">
          {getSprinklerGuidance()}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading files...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No files uploaded yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload project files in the Files step to reference them here.
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
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
          )}
        </div>

        {files.length > 0 && (
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
    </Dialog>
  );
};

export default PlansSelectionModal;