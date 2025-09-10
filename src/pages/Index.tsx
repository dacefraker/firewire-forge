import { useState } from 'react';
import Homepage from '@/components/Homepage';
import ProjectWizard from '@/components/wizard/ProjectWizard';
import CompanySetup from '@/components/CompanySetup';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);
  const { user } = useAuth();
  const { needsCompanySetup, loading } = useCompany();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsCompanySetup) {
    return <CompanySetup />;
  }

  if (showWizard) {
    return <ProjectWizard onBack={() => setShowWizard(false)} />;
  }

  return <Homepage />;
};

export default Index;
