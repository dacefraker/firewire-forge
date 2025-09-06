import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { WizardData } from '../ProjectWizard';

interface Step5Props {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  isLoading: boolean;
}

const OCCUPANCY_TYPES = [
  { code: 'A-1', description: 'Assembly - Fixed seating (theaters, auditoriums)' },
  { code: 'A-2', description: 'Assembly - Food/drink consumption (restaurants, bars)' },
  { code: 'A-3', description: 'Assembly - Worship, recreation (churches, gyms)' },
  { code: 'A-4', description: 'Assembly - Indoor sporting events' },
  { code: 'A-5', description: 'Assembly - Outdoor activities (stadiums, grandstands)' },
  { code: 'B', description: 'Business - Offices, professional services' },
  { code: 'E', description: 'Educational - Schools through 12th grade' },
  { code: 'F-1', description: 'Factory - Moderate hazard manufacturing' },
  { code: 'F-2', description: 'Factory - Low hazard manufacturing' },
  { code: 'H-1', description: 'High Hazard - Explosives' },
  { code: 'H-2', description: 'High Hazard - Accelerated burning items' },
  { code: 'H-3', description: 'High Hazard - Readily combustible materials' },
  { code: 'H-4', description: 'High Hazard - Health hazard materials' },
  { code: 'H-5', description: 'High Hazard - Semiconductor fabrication' },
  { code: 'I-1', description: 'Institutional - Assisted living facilities' },
  { code: 'I-2', description: 'Institutional - Hospitals, nursing homes' },
  { code: 'I-3', description: 'Institutional - Restrained individuals (jails, prisons)' },
  { code: 'I-4', description: 'Institutional - Day care facilities' },
  { code: 'M', description: 'Mercantile - Retail sales' },
  { code: 'R-1', description: 'Residential - Hotels, motels' },
  { code: 'R-2', description: 'Residential - Apartments, condos' },
  { code: 'R-3', description: 'Residential - Single/two-family homes' },
  { code: 'R-4', description: 'Residential - Assisted living (small)' },
  { code: 'S-1', description: 'Storage - Moderate hazard' },
  { code: 'S-2', description: 'Storage - Low hazard' },
  { code: 'U', description: 'Utility - Accessory structures' }
];

const Step5OccupancyTypes = ({ data, updateData }: Step5Props) => {
  const toggleOccupancyType = (code: string) => {
    const currentTypes = data.occupancy_types;
    const newTypes = currentTypes.includes(code)
      ? currentTypes.filter(type => type !== code)
      : [...currentTypes, code];
    
    updateData({ occupancy_types: newTypes });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Occupancy Types</h2>
        <p className="text-muted-foreground">Select all occupancy types that apply to this project</p>
      </div>

      <Card className="p-6">
        <Label className="text-lg font-medium mb-6 block">
          Select all occupancy types that apply
        </Label>
        
        <div className="grid gap-4 md:grid-cols-2">
          {OCCUPANCY_TYPES.map((type) => (
            <div 
              key={type.code} 
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`occupancy-${type.code}`}
                checked={data.occupancy_types.includes(type.code)}
                onCheckedChange={() => toggleOccupancyType(type.code)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`occupancy-${type.code}`}
                  className="text-sm font-medium cursor-pointer block"
                >
                  {type.code}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {data.occupancy_types.length > 0 && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">Selected Occupancy Types:</p>
            <div className="flex flex-wrap gap-2">
              {data.occupancy_types.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Step5OccupancyTypes;