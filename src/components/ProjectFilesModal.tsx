import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FileUploader, { FileRecord } from '@/components/FileUploader';
import { useProjectFiles } from '@/hooks/useProjectFiles';

interface ProjectFilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const ProjectFilesModal = ({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: ProjectFilesModalProps) => {
  const { files, refetch } = useProjectFiles(projectId);

  const handleFilesChange = (updatedFiles: FileRecord[]) => {
    // Optionally refetch to ensure data consistency
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Files - {projectName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage files and documents for this project
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <FileUploader
            mode="project"
            projectId={projectId}
            projectName={projectName}
            existingFiles={files}
            onFilesChange={handleFilesChange}
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFilesModal;