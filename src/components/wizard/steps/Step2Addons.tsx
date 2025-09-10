import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { WizardData } from '../ProjectWizard';

interface Step2Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const Step2Addons = ({ data, updateData }: Step2Props) => {
  const updateAddons = (key: keyof WizardData['addons'], value: any) => {
    updateData({
      addons: {
        ...data.addons,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Add-ons</h2>
        <p className="text-muted-foreground">Select additional services for your project</p>
      </div>

      <div className="space-y-6">
        {/* P.E. Stamp */}
        <Card className="p-6">
          <Label className="text-lg font-medium mb-4 block">
            Does this project require a P.E. Stamp? <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-3 mb-4">
            <Button
              variant={data.addons.needs_pe_stamp === 'yes' ? "default" : "outline"}
              onClick={() => updateAddons('needs_pe_stamp', 'yes')}
              className="flex-1"
            >
              Yes
            </Button>
            <Button
              variant={data.addons.needs_pe_stamp === 'no' ? "default" : "outline"}
              onClick={() => updateAddons('needs_pe_stamp', 'no')}
              className="flex-1"
            >
              No
            </Button>
            <Button
              variant={data.addons.needs_pe_stamp === 'not_sure' ? "default" : "outline"}
              onClick={() => updateAddons('needs_pe_stamp', 'not_sure')}
              className="flex-1"
            >
              Not Sure
            </Button>
          </div>
          
          {data.addons.needs_pe_stamp === 'yes' && (
            <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-foreground">
                  P.E. Stamping Fee
                </p>
                <p className="text-sm text-muted-foreground">
                  This will add $950 stamping fee to this project.
                </p>
              </div>
            </div>
          )}
          
          {data.addons.needs_pe_stamp === 'not_sure' && (
            <div className="mt-4 p-4 bg-muted/50 border border-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll discuss P.E. stamp requirements during project review. Fees will be determined based on project scope.
              </p>
            </div>
          )}
        </Card>

        {/* Data Sheets */}
        <Card className="p-6">
          <Label className="text-lg font-medium mb-4 block">
            Do you want Fire Wire Designs to prepare Data Sheets? <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-4">
            <Button
              variant={data.addons.needs_data_sheets === true ? "default" : "outline"}
              onClick={() => updateAddons('needs_data_sheets', true)}
              className="flex-1"
            >
              Yes
            </Button>
            <Button
              variant={data.addons.needs_data_sheets === false ? "default" : "outline"}
              onClick={() => updateAddons('needs_data_sheets', false)}
              className="flex-1"
            >
              No
            </Button>
          </div>
          
          {data.addons.needs_data_sheets && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-foreground">
                  Data Sheets Service - $60.00
                </p>
                <p className="text-sm text-muted-foreground">
                  Our team will prepare comprehensive cut sheets for all fire alarm devices and equipment in your project.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Add-on Notes */}
        <div>
          <Label htmlFor="addon-notes" className="text-sm font-medium">
            Add-on Notes
          </Label>
          <Textarea
            id="addon-notes"
            value={data.addons.notes}
            onChange={(e) => updateAddons('notes', e.target.value)}
            placeholder="Any additional notes about add-ons or special requirements..."
            className="mt-1"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default Step2Addons;