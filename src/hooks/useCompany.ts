import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Company {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  billing_note?: string;
}

interface Profile {
  id: string;
  company_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: string;
}

export const useCompany = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          return;
        }

        setProfile(profileData);

        // If profile has company_id, fetch company
        if (profileData?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single();

          if (companyError) {
            console.error('Error fetching company:', companyError);
          } else {
            setCompany(companyData);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const createCompany = async (companyData: Omit<Company, 'id'>) => {
    if (!user) return { error: new Error('No user found - please sign in again') };

    try {
      // Wait a moment to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify current session and refresh if needed
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession?.access_token) {
        console.error('Session verification failed:', sessionError);
        return { error: new Error('Session expired - please refresh the page and sign in again') };
      }

      console.log('Session verified, access token present:', !!currentSession.access_token);

      // Create company with verified session
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (companyError) {
        console.error('Company creation failed:', companyError);
        return { error: companyError };
      }

      console.log('Company created successfully:', newCompany);

      // Update user profile with company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: newCompany.id })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update failed:', profileError);
        return { error: profileError };
      }

      setCompany(newCompany);
      setProfile(prev => prev ? { ...prev, company_id: newCompany.id } : null);

      return { data: newCompany, error: null };
    } catch (error) {
      console.error('Unexpected error in createCompany:', error);
      return { error: error as Error };
    }
  };

  const skipCompanySetup = async () => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    try {
      // Create a placeholder company with minimal data
      const placeholderCompany = {
        name: profile.email || 'My Company',
        email: profile.email || '',
        phone: '',
        website: ''
      };

      return await createCompany(placeholderCompany);
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    company,
    profile,
    loading,
    createCompany,
    skipCompanySetup,
    needsCompanySetup: !loading && !company
  };
};