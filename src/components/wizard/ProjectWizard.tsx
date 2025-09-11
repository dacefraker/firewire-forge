import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import Step1ProjectLocation from './steps/Step1ProjectLocation';
import Step2Addons from './steps/Step2Addons';
import Step3Sprinklers from './steps/Step3Sprinklers';
import Step4Elevators from './steps/Step4Elevators';
import Step5OccupancyTypes from './steps/Step5OccupancyTypes';
import Step6PartsSpecifications from './steps/Step6PartsSpecifications';
import Step7Files from './steps/Step7Files';
import ChoiceScreen from './steps/ChoiceScreen';
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
    needs_pe_stamp: 'yes' | 'no' | 'not_sure' | null;
    needs_data_sheets: boolean;
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
  uploaded_file_ids: string[];
}

const STEP_TITLES = [
  'Project Location',
  'Add-ons',
  'Files',
  'Next Steps',
  'Sprinklers',
  'Elevators', 
  'Occupancy Types',
  'Parts Specifications',
  'Complete'
];

interface ProjectWizardProps {
  onBack?: () => void;
}

const ProjectWizard = ({ onBack }: ProjectWizardProps = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailedQuestions, setShowDetailedQuestions] = useState(false);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
    addons: {
      needs_pe_stamp: null,
      needs_data_sheets: false
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
    // Adjust step validation for new flow
    const actualStep = showDetailedQuestions && step >= 4 ? step : step;
    
    switch (actualStep) {
      case 0: // Step 1 - Project Location
        return wizardData.name.trim() !== '' && wizardData.state.trim() !== '';
      case 1: // Step 2 - Add-ons
        return true; // No required fields
      case 2: // Step 3 - Files
        return true; // Files are optional
      case 3: // Step 4 - Choice Screen
        return true; // Choice screen doesn't need validation
      case 4: // Step 5 - Sprinklers (if detailed)
        if (wizardData.sprinklers.has_sprinklers === true) {
          return wizardData.sprinklers.riser_location.trim() !== '';
        }
        return wizardData.sprinklers.has_sprinklers !== null;
      case 5: // Step 6 - Elevators (if detailed)
        if (wizardData.elevators.has_elevators === true) {
          return wizardData.elevators.count >= 1;
        }
        return true;
      case 6: // Step 7 - Occupancy Types (if detailed)
      case 7: // Step 8 - Parts (if detailed)
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const maxSteps = showDetailedQuestions ? 8 : 3;
      setCurrentStep(prev => Math.min(prev + 1, maxSteps));
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

  const handleMoreDetail = () => {
    setShowDetailedQuestions(true);
    setCurrentStep(4); // Move to sprinklers step
  };

  const handleBookMeeting = () => {
    submitProject('booking');
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    
    try {
      if (!user || !company) {
        toast({
          title: "Error",
          description: "Please sign in to save your project.",
          variant: "destructive",
        });
        return;
      }

      // Save project as draft with current wizard data
      await submitProject('draft');
      
      toast({
        title: "Draft Saved",
        description: "Your project has been saved as a draft. You can continue later.",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitProject = async (redirectTo: 'booking' | 'details' | 'draft') => {
    setIsLoading(true);
    
    if (!user || !company) {
      toast({
        title: "Error",
        description: "You must be logged in and have a company set up to create projects.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          company_id: company.id,
          name: wizardData.name,
          address_line1: wizardData.address1,
          city: wizardData.city,
          state: wizardData.state,
          postal_code: wizardData.zip,
          pe_stamp_required: wizardData.addons.needs_pe_stamp === 'yes',
          notes: null,
          created_by: user.id,
          status: redirectTo === 'draft' ? 'draft' : 'new'
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Create project building details
      if (wizardData.sprinklers.has_sprinklers !== null || wizardData.elevators.has_elevators !== null) {
        const { error: buildingError } = await supabase
          .from('project_building')
          .insert([{
            project_id: project.id,
            occupancy: wizardData.occupancy_types.join(', '),
            sprinklers: wizardData.sprinklers.has_sprinklers,
            sprinkler_notes: wizardData.sprinklers.narrative,
            elevators: wizardData.elevators.has_elevators,
            elevator_recall: wizardData.elevators.machine_room_location,
          }]);

        if (buildingError) throw buildingError;
      }

      // Handle file migration from temp to project folder
      if (wizardData.uploaded_file_ids.length > 0) {
        for (const fileId of wizardData.uploaded_file_ids) {
          // Get file record
          const { data: fileRecord, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

          if (fileError) continue;

          // Move file from temp to project folder
          const newPath = fileRecord.storage_path.replace(`temp/${user.id}/`, `${project.id}/`);
          
          const { error: moveError } = await supabase.storage
            .from('project-files')
            .move(fileRecord.storage_path, newPath);

          if (!moveError) {
            // Update file record with project_id and new path
            await supabase
              .from('files')
              .update({ 
                project_id: project.id,
                storage_path: newPath
              })
              .eq('id', fileId);
          }
        }
      }

      // Create project parts if any
      if (wizardData.parts.specified.length > 0) {
        for (const partSpec of wizardData.parts.specified) {
          if (partSpec.part && partSpec.manufacturer) {
            // Insert or get existing part
            const { data: part, error: partError } = await supabase
              .from('parts')
              .upsert([{
                manufacturer: partSpec.manufacturer,
                model: partSpec.model || 'Unknown',
                description: partSpec.part,
                category: 'fire_alarm'
              }], { onConflict: 'manufacturer,model' })
              .select()
              .single();

            if (partError) throw partError;

            // Link part to project
            const { error: projectPartError } = await supabase
              .from('project_parts')
              .insert([{
                project_id: project.id,
                part_id: part.id,
                qty: 1,
                notes: partSpec.is_new ? 'New' : 'Existing'
              }]);

            if (projectPartError) throw projectPartError;
          }
        }
      }

      // Log project creation event
      const { error: eventError } = await supabase
        .from('project_events')
        .insert([{
          project_id: project.id,
          actor_id: user.id,
          event_type: 'project_created',
          data: { wizard_completed: true }
        }]);

      if (eventError) console.error('Event logging error:', eventError);
      
      toast({
        title: "Success!",
        description: "Your project has been created successfully.",
      });

      // Handle redirect based on user choice
      if (redirectTo === 'booking') {
        window.location.href = '/booking'; // Replace with actual booking URL
      } else if (redirectTo === 'details') {
        // Navigate to project details or stay in wizard
        console.log('Project created:', project.id);
      } else if (redirectTo === 'draft') {
        // For draft, just stay on current page
        console.log('Project saved as draft:', project.id);
      }
      
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: "Error",
        description: "There was an error creating your project. Please try again.",
        variant: "destructive",
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
        return <Step7Files {...stepProps} />;
      case 3:
        return (
          <ChoiceScreen 
            onBookMeeting={handleBookMeeting}
            onMoreDetail={handleMoreDetail}
            onSaveDraft={handleSaveDraft}
            isLoading={isLoading}
          />
        );
      case 4:
        return <Step3Sprinklers {...stepProps} />;
      case 5:
        return <Step4Elevators {...stepProps} />;
      case 6:
        return <Step5OccupancyTypes {...stepProps} />;
      case 7:
        return <Step6PartsSpecifications {...stepProps} />;
      case 8:
        return <FinalCTAScreen onSubmit={submitProject} isLoading={isLoading} />;
      default:
        return <Step1ProjectLocation {...stepProps} />;
    }
  };

  const progress = showDetailedQuestions 
    ? ((currentStep + 1) / 9) * 100 
    : ((currentStep + 1) / 4) * 100;

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
              Step {currentStep + 1} of {showDetailedQuestions ? 9 : 4}
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
          {(currentStep < 3 || (showDetailedQuestions && currentStep < 8)) && currentStep !== 3 && (
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