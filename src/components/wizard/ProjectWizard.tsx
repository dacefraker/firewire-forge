import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Step1ProjectLocation from './steps/Step1ProjectLocation';
import Step2Addons from './steps/Step2Addons';
import Step3Sprinklers from './steps/Step3Sprinklers';
import Step4Elevators from './steps/Step4Elevators';
import Step5OccupancyTypes from './steps/Step5OccupancyTypes';
import Step6PartsSpecifications from './steps/Step6PartsSpecifications';
import Step7Files from './steps/Step7Files';
import FinalCTAScreen from './steps/FinalCTAScreen';

export interface WizardData {
  // Step 1
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  
  // Step 2
  addons: {
    needs_pe_stamp: boolean;
    needs_data_sheets: boolean;
    notes: string;
  };
  
  // Step 3
  sprinklers: {
    has_sprinklers: boolean | null;
    riser_location: string;
    narrative: string;
  };
  
  // Step 4
  elevators: {
    has_elevators: boolean | null;
    not_sure: boolean;
    use_cases: string[];
    count: number;
    machine_room_location: string;
    narrative: string;
    special: string;
  };
  
  // Step 5
  occupancy_types: string[];
  
  // Step 6
  parts: {
    mode: 'upload_file' | 'specify' | null;
    equipment_file_id: number | null;
    narrative: string;
    specified: Array<{
      part: string;
      manufacturer: string;
      manufacturer_unknown: boolean;
      model: string;
      model_unknown: boolean;
      unknown_text: string;
      is_new: boolean;
      location: string;
    }>;
  };
  
  // Step 7
  uploaded_file_ids: number[];
}

const STEP_TITLES = [
  'Project Location',
  'Add-ons',
  'Sprinklers',
  'Elevators', 
  'Occupancy Types',
  'Parts Specifications',
  'Files',
  'Complete'
];

interface ProjectWizardProps {
  onBack?: () => void;
}

const ProjectWizard = ({ onBack }: ProjectWizardProps = {}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
    addons: {
      needs_pe_stamp: false,
      needs_data_sheets: false,
      notes: ''
    },
    sprinklers: {
      has_sprinklers: null,
      riser_location: '',
      narrative: ''
    },
    elevators: {
      has_elevators: null,
      not_sure: false,
      use_cases: [],
      count: 1,
      machine_room_location: '',
      narrative: '',
      special: ''
    },
    occupancy_types: [],
    parts: {
      mode: null,
      equipment_file_id: null,
      narrative: '',
      specified: []
    },
    uploaded_file_ids: []
  });

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Step 1
        return wizardData.name.trim() !== '' && wizardData.state.trim() !== '';
      case 1: // Step 2
        return true; // No required fields
      case 2: // Step 3
        if (wizardData.sprinklers.has_sprinklers === true) {
          return wizardData.sprinklers.riser_location.trim() !== '';
        }
        return wizardData.sprinklers.has_sprinklers !== null;
      case 3: // Step 4
        if (wizardData.elevators.has_elevators === true) {
          return wizardData.elevators.count >= 1;
        }
        return true;
      case 4: // Step 5
      case 5: // Step 6
      case 6: // Step 7
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    } else {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const submitProject = async (redirectTo: 'booking' | 'details') => {
    setIsLoading(true);
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken || ''
        },
        credentials: 'same-origin',
        body: JSON.stringify(wizardData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit project');
      }

      const result = await response.json();
      
      toast({
        title: "Project Created Successfully",
        description: "Your project has been submitted to our engineering team."
      });

      // Navigate based on CTA pressed
      if (redirectTo === 'booking') {
        window.location.href = `/projects/${result.id}/booking`;
      } else {
        window.location.href = `/projects/${result.id}/details`;
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: wizardData,
      updateData: updateWizardData,
      isLoading
    };

    switch (currentStep) {
      case 0:
        return <Step1ProjectLocation {...stepProps} />;
      case 1:
        return <Step2Addons {...stepProps} />;
      case 2:
        return <Step3Sprinklers {...stepProps} />;
      case 3:
        return <Step4Elevators {...stepProps} />;
      case 4:
        return <Step5OccupancyTypes {...stepProps} />;
      case 5:
        return <Step6PartsSpecifications {...stepProps} />;
      case 6:
        return <Step7Files {...stepProps} />;
      case 7:
        return <FinalCTAScreen onSubmit={submitProject} isLoading={isLoading} />;
      default:
        return <Step1ProjectLocation {...stepProps} />;
    }
  };

  const progress = ((currentStep + 1) / 8) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {onBack && (
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Homepage
              </Button>
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Creation Wizard</h1>
          <p className="text-muted-foreground">FireWire Designs - Professional Engineering Services</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of 8
            </span>
            <span className="text-sm font-medium text-primary">
              {STEP_TITLES[currentStep]}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="bg-card/50 backdrop-blur-sm border shadow-lg">
          <div className="p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep < 7 && (
            <div className="flex justify-between items-center p-6 border-t bg-muted/20">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep) || isLoading}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectWizard;