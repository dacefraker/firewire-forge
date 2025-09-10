import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';

const CompanySetup = () => {
  const { createCompany, skipCompanySetup } = useCompany();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    phone: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyData.name.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter your company name.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await createCompany(companyData);
    
    if (error) {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Company Created!",
        description: "Your company has been set up successfully."
      });
    }
    
    setIsLoading(false);
  };

  const handleSkip = async () => {
    setIsLoading(true);
    
    const { error } = await skipCompanySetup();
    
    if (error) {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Company Setup Skipped",
        description: "You can update your company details later from your profile."
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Company Setup</CardTitle>
          <CardDescription>
            Before creating projects, please set up your company information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="company@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                type="tel"
                value={companyData.phone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                type="url"
                value={companyData.website}
                onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting Up...' : 'Create Company'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                disabled={isLoading}
                onClick={handleSkip}
              >
                Skip for Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySetup;