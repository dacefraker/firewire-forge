import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardData } from '../ProjectWizard';

interface Step1Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const Step1ProjectLocation = ({ data, updateData }: Step1Props) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Project Location</h2>
        <p className="text-muted-foreground">Tell us about your project location and basic details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Enter project name"
            className="mt-1"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address1" className="text-sm font-medium">
            Street Address
          </Label>
          <Input
            id="address1"
            value={data.address1}
            onChange={(e) => updateData({ address1: e.target.value })}
            placeholder="123 Main Street"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-medium">
            City
          </Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="City name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-sm font-medium">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            id="state"
            value={data.state}
            onChange={(e) => updateData({ state: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="CA"
            maxLength={2}
            className="mt-1"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">2-letter US state code</p>
        </div>

        <div>
          <Label htmlFor="zip" className="text-sm font-medium">
            Zip Code
          </Label>
          <Input
            id="zip"
            value={data.zip}
            onChange={(e) => updateData({ zip: e.target.value })}
            placeholder="12345"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1ProjectLocation;