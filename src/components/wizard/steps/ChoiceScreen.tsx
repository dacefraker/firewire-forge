import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Clock, CheckCircle } from 'lucide-react';

interface ChoiceScreenProps {
  onBookMeeting: () => void;
  onMoreDetail: () => void;
  isLoading: boolean;
}

const ChoiceScreen = ({ onBookMeeting, onMoreDetail, isLoading }: ChoiceScreenProps) => {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Great! We have your basic project information.</h2>
        <p className="text-muted-foreground text-lg">
          Choose how you'd like to proceed with your fire alarm system project.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Book Meeting Option */}
        <div className="border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Book a Meeting</h3>
          <p className="text-muted-foreground">
            Schedule a consultation with our engineering team to discuss your project requirements and get a detailed quote.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              30-minute consultation
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Custom project assessment
            </li>
          </ul>
          <Button
            onClick={onBookMeeting}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Submitting...' : 'Book Meeting & Submit Project'}
          </Button>
        </div>

        {/* More Detail Option */}
        <div className="border border-border rounded-lg p-6 space-y-4 hover:border-accent/50 transition-colors">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Provide More Details</h3>
          <p className="text-muted-foreground">
            Answer additional questions about sprinklers, elevators, occupancy types, and equipment specifications for a more accurate quote.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              More accurate pricing
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Faster project turnaround
            </li>
          </ul>
          <Button
            onClick={onMoreDetail}
            variant="outline"
            className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            Continue with Detailed Questions
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
        <p>
          <strong>Note:</strong> You can always add more details later or schedule a meeting after completing the detailed questions.
        </p>
      </div>
    </div>
  );
};

export default ChoiceScreen;