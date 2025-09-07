import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-primary font-bold text-sm">FIRE WIRE</div>
              <div className="text-foreground font-bold text-sm -mt-1">DESIGNS</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/projects" className="text-foreground hover:text-primary transition-colors">
              My Projects
            </Link>
            <a href="#peace-of-mind" className="text-foreground hover:text-primary transition-colors">
              Peace Of Mind
            </a>
            <a href="#our-process" className="text-foreground hover:text-primary transition-colors">
              Our Process
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
          </div>

          {/* Client Login Button */}
          <Button 
            variant="outline" 
            className="border-border hover:bg-secondary text-foreground"
          >
            Client Log in
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;