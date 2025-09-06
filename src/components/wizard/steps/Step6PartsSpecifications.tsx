import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Upload } from 'lucide-react';
import { WizardData } from '../ProjectWizard';

interface Step6Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const MANUFACTURERS = [
  'Edwards',
  'Fire-Lite',
  'Honeywell',
  'Johnson Controls',
  'Kidde',
  'Notifier',
  'Silent Knight',
  'System Sensor',
  'Wheelock',
  'I do not know/see'
];

const Step6PartsSpecifications = ({ data, updateData }: Step6Props) => {
  const [isUploading, setIsUploading] = useState(false);

  const updateParts = (key: keyof WizardData['parts'], value: any) => {
    updateData({
      parts: {
        ...data.parts,
        [key]: value
      }
    });
  };

  const addNewPart = () => {
    const newPart = {
      part: '',
      manufacturer: '',
      manufacturer_unknown: false,
      model: '',
      model_unknown: false,
      unknown_text: '',
      is_new: true,
      location: ''
    };
    
    updateParts('specified', [...data.parts.specified, newPart]);
  };

  const updatePart = (index: number, field: string, value: any) => {
    const updatedParts = data.parts.specified.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    );
    updateParts('specified', updatedParts);
  };

  const removePart = (index: number) => {
    const updatedParts = data.parts.specified.filter((_, i) => i !== index);
    updateParts('specified', updatedParts);
  };

  const handleEquipmentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', 'Equipment List');
      formData.append('classification', 'new');
      formData.append('friendly_name', file.name);

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/api/wizard/files', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken || ''
        },
        credentials: 'same-origin',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        updateParts('equipment_file_id', result[0].id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Parts Specifications</h2>
        <p className="text-muted-foreground">Tell us about the equipment for this project</p>
      </div>

      <div className="space-y-6">
        {/* Input Method Selection */}
        <Card className="p-6">
          <Label className="text-lg font-medium mb-4 block">
            How would you like to input the equipment for this project?
          </Label>
          <div className="space-y-4">
            <Button
              variant={data.parts.mode === 'upload_file' ? "default" : "outline"}
              onClick={() => updateParts('mode', 'upload_file')}
              className="w-full justify-start h-auto p-4"
            >
              <Upload className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Upload Equipment File</div>
                <div className="text-sm text-muted-foreground">Upload a file with your equipment list</div>
              </div>
            </Button>
            
            <Button
              variant={data.parts.mode === 'specify' ? "default" : "outline"}
              onClick={() => updateParts('mode', 'specify')}
              className="w-full justify-start h-auto p-4"
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Specify Parts</div>
                <div className="text-sm text-muted-foreground">Manually enter individual parts and equipment</div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Upload Equipment File */}
        {data.parts.mode === 'upload_file' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  Equipment File <span className="text-destructive">*</span>
                </Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={handleEquipmentFileUpload}
                  className="mt-1 block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                  disabled={isUploading}
                />
                {isUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
              </div>
              
              <div>
                <Label htmlFor="equipment-narrative" className="text-sm font-medium">
                  Narrative
                </Label>
                <Textarea
                  id="equipment-narrative"
                  value={data.parts.narrative}
                  onChange={(e) => updateParts('narrative', e.target.value)}
                  placeholder="Any additional information about the equipment..."
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Specify Parts */}
        {data.parts.mode === 'specify' && (
          <div className="space-y-6">
            {data.parts.specified.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No parts added yet</p>
                <Button onClick={addNewPart} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Part
                </Button>
              </Card>
            )}

            {data.parts.specified.map((part, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">Part {index + 1}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePart(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">
                      Part <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={part.part}
                      onChange={(e) => updatePart(index, 'part', e.target.value)}
                      placeholder="Enter part name/description"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Manufacturer <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={part.manufacturer}
                      onValueChange={(value) => {
                        updatePart(index, 'manufacturer', value);
                        updatePart(index, 'manufacturer_unknown', value === 'I do not know/see');
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUFACTURERS.map((manufacturer) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Model
                    </Label>
                    <div className="mt-1 space-y-2">
                      <Input
                        value={part.model}
                        onChange={(e) => updatePart(index, 'model', e.target.value)}
                        placeholder="Enter model number"
                        disabled={part.model_unknown}
                      />
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={part.model_unknown}
                          onChange={(e) => {
                            updatePart(index, 'model_unknown', e.target.checked);
                            if (e.target.checked) updatePart(index, 'model', '');
                          }}
                        />
                        <span>I do not know/see</span>
                      </label>
                    </div>
                  </div>

                  {(part.manufacturer_unknown || part.model_unknown) && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">
                        Enter info about the part/model <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        value={part.unknown_text}
                        onChange={(e) => updatePart(index, 'unknown_text', e.target.value)}
                        placeholder="Describe the part, its purpose, and any known details..."
                        className="mt-1"
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">
                      Condition <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={part.is_new ? "default" : "outline"}
                        onClick={() => updatePart(index, 'is_new', true)}
                        size="sm"
                        className="flex-1"
                      >
                        New
                      </Button>
                      <Button
                        variant={!part.is_new ? "default" : "outline"}
                        onClick={() => updatePart(index, 'is_new', false)}
                        size="sm"
                        className="flex-1"
                      >
                        Existing
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Location/Narrative
                    </Label>
                    <Input
                      value={part.location}
                      onChange={(e) => updatePart(index, 'location', e.target.value)}
                      placeholder="Where is this part located?"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            ))}

            {data.parts.specified.length > 0 && (
              <div className="text-center">
                <Button onClick={addNewPart} variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Another Part
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step6PartsSpecifications;