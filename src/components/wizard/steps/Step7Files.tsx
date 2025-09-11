import FileUploader, { FileRecord, ENHANCED_FILE_CATEGORIES } from '@/components/FileUploader';
import { WizardData } from '../ProjectWizard';

interface Step7Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const Step7Files = ({ data, updateData }: Step7Props) => {
  const handleFilesChange = (files: FileRecord[]) => {
    const fileIds = files.map(file => file.id);
    updateData({ uploaded_file_ids: fileIds });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Files</h2>
        <p className="text-muted-foreground">Upload project files, plans, and documentation</p>
      </div>

      <FileUploader
        mode="temporary"
        categories={ENHANCED_FILE_CATEGORIES}
        showClassification={true}
        onFilesChange={handleFilesChange}
      />
    </div>
  );
};

export default Step7Files;