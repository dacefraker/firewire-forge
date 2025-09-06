import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Navigation from './Navigation';
import ProjectWizard from './wizard/ProjectWizard';

const Homepage = () => {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <ProjectWizard onBack={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="text-primary font-bold text-lg">FIRE WIRE</div>
                  <div className="text-foreground font-bold text-lg">DESIGNS</div>
                </div>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Fire system plans<br />
                  <span className="text-foreground">with confidence</span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-lg">
                  On Demand, Code Compliant Fire Alarm System Plan Drawings
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setShowWizard(true)}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold"
                >
                  Create A New Project
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-border hover:bg-secondary px-8 py-3 text-lg font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Sample Plans
                </Button>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-foreground font-semibold text-lg">866-503-9556</span>
              </div>
            </div>

            {/* Right Content - Technical Drawing Overlay */}
            <div className="relative lg:block hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
              <div className="relative p-8">
                {/* Mock technical drawing elements */}
                <div className="border border-muted rounded-lg p-6 bg-card/10 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground font-mono">Project Name</div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                    
                    <div className="text-sm text-muted-foreground font-mono">Project Address</div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
                    
                    <div className="text-sm text-muted-foreground font-mono">Site Map</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 bg-muted-foreground/10 rounded border border-muted-foreground/20"></div>
                      <div className="h-16 bg-muted-foreground/10 rounded border border-muted-foreground/20"></div>
                      <div className="h-16 bg-muted-foreground/10 rounded border border-muted-foreground/20"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border border-muted rounded-lg p-6 bg-card/10 backdrop-blur-sm">
                  <div className="text-sm text-muted-foreground font-mono mb-4">General Notes</div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
                      <div key={line} className="h-2 bg-muted-foreground/15 rounded" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border border-muted rounded-lg p-6 bg-card/10 backdrop-blur-sm">
                  <div className="text-sm text-muted-foreground font-mono mb-4">Building Information</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {[1, 2, 3].map((line) => (
                        <div key={line} className="h-2 bg-muted-foreground/15 rounded"></div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((line) => (
                        <div key={line} className="h-2 bg-muted-foreground/15 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border border-muted rounded-lg p-6 bg-card/10 backdrop-blur-sm">
                  <div className="text-sm text-muted-foreground font-mono mb-4">Applicable Codes</div>
                  <div className="text-xs text-muted-foreground/60 font-mono">2018 NATIONAL FIRE PROTECTION ASSOCIATION</div>
                  <div className="mt-2 space-y-1">
                    {[1, 2, 3, 4].map((line) => (
                      <div key={line} className="h-1.5 bg-muted-foreground/10 rounded" style={{ width: `${Math.random() * 50 + 30}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;