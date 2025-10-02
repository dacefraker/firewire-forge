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
  created_by?: string;
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
    let isMounted = true;

    const loadProfileAndCompany = async () => {
      if (!user) {
        if (!isMounted) return;
        setCompany(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!isMounted) return;

        setProfile(profileData ?? null);

        if (profileData?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .maybeSingle();

          if (companyError) {
            throw companyError;
          }

          if (!isMounted) return;
          setCompany(companyData ?? null);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        if (isMounted) {
          setCompany(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfileAndCompany();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const createCompany = async (companyData: Omit<Company, 'id'>) => {
    if (!user) return { error: new Error('No user found - please sign in again') };

    try {
      const payload = {
        ...companyData,
        created_by: user.id,
      };

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([payload])
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: newCompany.id })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      setCompany(newCompany);
      setProfile(prev => (prev ? { ...prev, company_id: newCompany.id } : prev));

      return { data: newCompany, error: null };
    } catch (error) {
      console.error('Error creating company:', error);
      return {
        error: error instanceof Error
          ? error
          : new Error('Failed to create company. Please try again.'),
      };
    }
  };

  const skipCompanySetup = async () => {
    if (!user) return { error: new Error('No user or profile') };

    const placeholderCompany = {
      name: profile?.email || 'My Company',
      email: profile?.email || '',
      phone: '',
      website: ''
    };

    return createCompany(placeholderCompany);
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
