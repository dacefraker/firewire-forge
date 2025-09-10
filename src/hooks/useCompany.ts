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

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Company creation attempt ${attempt}/${MAX_RETRIES}`);
        
        // Enhanced session verification with multiple approaches
        const [sessionResult, userResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser()
        ]);

        const { data: { session }, error: sessionError } = sessionResult;
        const { data: { user: currentUser }, error: userError } = userResult;

        // Comprehensive authentication validation
        if (sessionError || userError) {
          console.error('Auth verification failed:', { sessionError, userError });
          if (attempt === MAX_RETRIES) {
            return { error: new Error('Authentication verification failed - please sign in again') };
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }

        if (!session?.access_token || !currentUser) {
          console.error('Missing session or user:', { 
            hasSession: !!session, 
            hasAccessToken: !!session?.access_token,
            hasUser: !!currentUser 
          });
          if (attempt === MAX_RETRIES) {
            return { error: new Error('Session expired - please refresh the page and sign in again') };
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }

        // Verify JWT token is valid and not expired
        const tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
        const now = new Date();
        
        if (tokenExpiry && tokenExpiry <= now) {
          console.log('Token expired, attempting refresh...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Token refresh failed:', refreshError);
            if (attempt === MAX_RETRIES) {
              return { error: new Error('Session expired and refresh failed - please sign in again') };
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            continue;
          }
        }

        console.log('Authentication verified successfully:', {
          userId: currentUser.id,
          tokenExpiry: tokenExpiry?.toISOString(),
          hasAccessToken: !!session.access_token
        });

        // Ensure proper session establishment before database operations
        await new Promise(resolve => setTimeout(resolve, 200));

        // Create company with enhanced error handling
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([companyData])
          .select()
          .single();

        if (companyError) {
          console.error('Company creation failed:', companyError);
          
          // Handle specific RLS errors with retry logic
          if (companyError.code === '42501' || companyError.message?.includes('row-level security')) {
            console.log('RLS policy violation detected, retrying with fresh session...');
            if (attempt < MAX_RETRIES) {
              // Force session refresh on RLS errors
              await supabase.auth.refreshSession();
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
              continue;
            }
            return { error: new Error('Unable to create company - authentication issue. Please refresh the page and try again.') };
          }
          
          return { error: companyError };
        }

        console.log('Company created successfully:', newCompany);

        // Update user profile with company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: newCompany.id })
          .eq('id', currentUser.id);

        if (profileError) {
          console.error('Profile update failed:', profileError);
          return { error: profileError };
        }

        // Update local state
        setCompany(newCompany);
        setProfile(prev => prev ? { ...prev, company_id: newCompany.id } : null);

        return { data: newCompany, error: null };

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          return { error: error as Error };
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }

    return { error: new Error('All attempts failed - please refresh the page and try again') };
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