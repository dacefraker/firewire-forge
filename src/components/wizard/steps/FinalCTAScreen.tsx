import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, FileText, CheckCircle } from 'lucide-react';

interface FinalCTAScreenProps {
  onSubmit: (redirectTo: 'booking' | 'details') => void;
  isLoading: boolean;
}

const FinalCTAScreen = ({ onSubmit, isLoading }: FinalCTAScreenProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-3xl font-semibold text-foreground mb-2">You're Almost Done!</h2>
        <p className="text-muted-foreground text-lg">
          Choose how you'd like to proceed with your FireWire Designs project
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Submit and Book Meeting */}
        <Card className="p-8 text-center hover:shadow-lg transition-shadow">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Schedule a Meeting</h3>
          <p className="text-muted-foreground mb-6">
            Submit your project and book a meeting with our engineering team to discuss your requirements in detail.
          </p>
          <ul className="text-sm text-left space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Direct consultation with PE-licensed engineers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Review project scope and requirements
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Get accurate timeline and pricing
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Address any technical questions
            </li>
          </ul>
          <Button
            onClick={() => onSubmit('booking')}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Submitting...' : 'Submit Project & Book Meeting'}
          </Button>
        </Card>

        {/* Submit and Add Details */}
        <Card className="p-8 text-center hover:shadow-lg transition-shadow">
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Add More Details</h3>
          <p className="text-muted-foreground mb-6">
            Submit your project and provide additional detailed information to help our engineers better understand your needs.
          </p>
          <ul className="text-sm text-left space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Add detailed project notes and specifications
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Upload additional supporting documents
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Specify custom requirements
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              Provide site-specific information
            </li>
          </ul>
          <Button
            onClick={() => onSubmit('details')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Submitting...' : 'Give Engineer More Details'}
          </Button>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Both options will submit your project to our engineering team for review. 
          You can always add more details or schedule a meeting later.
        </p>
      </div>
    </div>
  );
};

export default FinalCTAScreen;