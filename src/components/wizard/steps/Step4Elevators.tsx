import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';
import { WizardData } from '../ProjectWizard';

interface Step4Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const ELEVATOR_USE_CASES = [
  'Passenger',
  'Freight',
  'Service',
  'Firefighter',
  'Accessible/ADA',
  'Machine Room-less (MRL)',
  'Hydraulic',
  'Traction'
];

const Step4Elevators = ({ data, updateData }: Step4Props) => {
  const updateElevators = (key: keyof WizardData['elevators'], value: any) => {
    updateData({
      elevators: {
        ...data.elevators,
        [key]: value
      }
    });
  };

  const toggleUseCase = (useCase: string) => {
    const currentUseCases = data.elevators.use_cases;
    const newUseCases = currentUseCases.includes(useCase)
      ? currentUseCases.filter(uc => uc !== useCase)
      : [...currentUseCases, useCase];
    
    updateElevators('use_cases', newUseCases);
  };

  const openGetFromPlansModal = () => {
    // TODO: Implement modal to select from uploaded files
    console.log('Open Get from Plans modal');
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Elevators</h2>
        <p className="text-muted-foreground">Tell us about elevators in the building</p>
      </div>

      <div className="space-y-6">
        {/* Has Elevators */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-medium">
              Does the building have elevators?
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
              variant={data.elevators.has_elevators === true ? "default" : "outline"}
              onClick={() => updateElevators('has_elevators', true)}
              className="flex-1"
            >
              Yes
            </Button>
            <Button
              variant={data.elevators.has_elevators === false ? "default" : "outline"}
              onClick={() => updateElevators('has_elevators', false)}
              className="flex-1"
            >
              No
            </Button>
            <Button
              variant={data.elevators.not_sure ? "default" : "outline"}
              onClick={() => {
                updateElevators('not_sure', !data.elevators.not_sure);
                if (!data.elevators.not_sure) {
                  updateElevators('has_elevators', null);
                }
              }}
              className="flex-1"
            >
              Not sure
            </Button>
          </div>
        </Card>

        {/* Elevator Details - Only show if has elevators */}
        {data.elevators.has_elevators === true && (
          <>
            {/* Use Cases */}
            <Card className="p-6">
              <Label className="text-lg font-medium mb-4 block">
                Elevator Use Cases
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ELEVATOR_USE_CASES.map((useCase) => (
                  <div key={useCase} className="flex items-center space-x-2">
                    <Checkbox
                      id={`use-case-${useCase}`}
                      checked={data.elevators.use_cases.includes(useCase)}
                      onCheckedChange={() => toggleUseCase(useCase)}
                    />
                    <Label
                      htmlFor={`use-case-${useCase}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {useCase}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Elevator Count */}
            <div>
              <Label htmlFor="elevator-count" className="text-sm font-medium">
                Elevator Count <span className="text-destructive">*</span>
              </Label>
              <Input
                id="elevator-count"
                type="number"
                min="1"
                value={data.elevators.count}
                onChange={(e) => updateElevators('count', parseInt(e.target.value) || 1)}
                placeholder="Number of elevators"
                className="mt-1"
                required
              />
            </div>

            {/* Machine Room Location */}
            <div>
              <Label htmlFor="machine-room" className="text-sm font-medium">
                Elevator Machine Room Location
              </Label>
              <Input
                id="machine-room"
                value={data.elevators.machine_room_location}
                onChange={(e) => updateElevators('machine_room_location', e.target.value)}
                placeholder="Describe the location of the elevator machine room"
                className="mt-1"
              />
            </div>

            {/* Elevator Narrative */}
            <div>
              <Label htmlFor="elevator-narrative" className="text-sm font-medium">
                Elevator Narrative
              </Label>
              <Textarea
                id="elevator-narrative"
                value={data.elevators.narrative}
                onChange={(e) => updateElevators('narrative', e.target.value)}
                placeholder="Any additional information about the elevators..."
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Special Considerations */}
            <div>
              <Label htmlFor="special-considerations" className="text-sm font-medium">
                Special Considerations
              </Label>
              <Textarea
                id="special-considerations"
                value={data.elevators.special}
                onChange={(e) => updateElevators('special', e.target.value)}
                placeholder="Any special considerations for the elevator installation..."
                className="mt-1"
                rows={3}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Step4Elevators;