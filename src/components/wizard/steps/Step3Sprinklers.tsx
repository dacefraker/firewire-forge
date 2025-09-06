import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { WizardData } from '../ProjectWizard';

interface Step3Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const Step3Sprinklers = ({ data, updateData }: Step3Props) => {
  const updateSprinklers = (key: keyof WizardData['sprinklers'], value: any) => {
    updateData({
      sprinklers: {
        ...data.sprinklers,
        [key]: value
      }
    });
  };

  const openGetFromPlansModal = () => {
    // TODO: Implement modal to select from uploaded files
    console.log('Open Get from Plans modal');
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Sprinklers</h2>
        <p className="text-muted-foreground">Tell us about the sprinkler system in the building</p>
      </div>

      <div className="space-y-6">
        {/* Has Sprinklers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-medium">
              Does the building have sprinklers? <span className="text-destructive">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={openGetFromPlansModal}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Get from plans
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant={data.sprinklers.has_sprinklers === true ? "default" : "outline"}
              onClick={() => updateSprinklers('has_sprinklers', true)}
              className="flex-1"
            >
              Yes
            </Button>
            <Button
              variant={data.sprinklers.has_sprinklers === false ? "default" : "outline"}
              onClick={() => updateSprinklers('has_sprinklers', false)}
              className="flex-1"
            >
              No
            </Button>
          </div>
        </Card>

        {/* Riser Location - Only show if has sprinklers */}
        {data.sprinklers.has_sprinklers === true && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="riser-location" className="text-sm font-medium">
                Riser Location <span className="text-destructive">*</span>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={openGetFromPlansModal}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Get from plans
              </Button>
            </div>
            <Input
              id="riser-location"
              value={data.sprinklers.riser_location}
              onChange={(e) => updateSprinklers('riser_location', e.target.value)}
              placeholder="Describe the location of the fire sprinkler riser"
              className="mt-1"
              required={data.sprinklers.has_sprinklers === true}
            />
          </div>
        )}

        {/* Sprinkler Narrative */}
        {data.sprinklers.has_sprinklers === true && (
          <div>
            <Label htmlFor="sprinkler-narrative" className="text-sm font-medium">
              Sprinkler Narrative
            </Label>
            <Textarea
              id="sprinkler-narrative"
              value={data.sprinklers.narrative}
              onChange={(e) => updateSprinklers('narrative', e.target.value)}
              placeholder="Any additional information about the sprinkler system..."
              className="mt-1"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3Sprinklers;