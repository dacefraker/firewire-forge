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

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 800;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Company creation attempt ${attempt}/${MAX_RETRIES}`);
        
        // Step 1: Force session refresh to ensure latest JWT token
        console.log('🔐 Refreshing session to ensure valid JWT...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ Session refresh failed:', refreshError);
        } else {
          console.log('✅ Session refreshed successfully');
        }

        // Step 2: Wait for session to propagate
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 3: Verify authentication state with detailed logging
        const [sessionResult, userResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser()
        ]);

        const { data: { session }, error: sessionError } = sessionResult;
        const { data: { user: currentUser }, error: userError } = userResult;

        console.log('🔍 Auth state check:', {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          hasUser: !!currentUser,
          userId: currentUser?.id,
          tokenLength: session?.access_token?.length,
          sessionError: sessionError?.message,
          userError: userError?.message
        });

        if (sessionError || userError || !session?.access_token || !currentUser) {
          console.error('❌ Auth verification failed');
          if (attempt === MAX_RETRIES) {
            return { error: new Error('Authentication failed - please sign out and sign back in') };
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }

        // Step 4: Test database connection with auth context
        console.log('🔍 Testing database auth context...');
        try {
          const { data: authTest, error: authTestError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentUser.id)
            .single();
          
          if (authTestError) {
            console.error('❌ Database auth test failed:', authTestError);
            if (attempt < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
              continue;
            }
          } else {
            console.log('✅ Database auth context verified');
          }
        } catch (dbError) {
          console.error('❌ Database connection test failed:', dbError);
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            continue;
          }
        }

        // Step 5: Attempt company creation with proper error handling
        console.log('🏢 Creating company...');
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{
            ...companyData,
            // Ensure we're explicitly setting any required fields
          }])
          .select()
          .single();

        if (companyError) {
          console.error('❌ Company creation failed:', {
            error: companyError,
            code: companyError.code,
            message: companyError.message,
            details: companyError.details,
            hint: companyError.hint
          });
          
          // Handle RLS policy violations specifically
          if (companyError.code === '42501' || 
              companyError.message?.includes('row-level security') ||
              companyError.message?.includes('violates row-level security policy')) {
            
            console.log('🚨 RLS policy violation - auth.uid() likely null at database level');
            
            if (attempt < MAX_RETRIES) {
              console.log(`⏳ Retrying with extended wait time (attempt ${attempt + 1})...`);
              // Longer wait for RLS issues to allow auth context to establish
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt * 2));
              continue;
            }
            
            return { 
              error: new Error('Authentication context failed to establish. Please sign out, sign back in, and try again.') 
            };
          }
          
          return { error: companyError };
        }

        console.log('✅ Company created successfully:', newCompany.id);

        // Step 6: Update profile with company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: newCompany.id })
          .eq('id', currentUser.id);

        if (profileError) {
          console.error('❌ Profile update failed:', profileError);
          return { error: profileError };
        }

        console.log('✅ Profile updated with company_id');

        // Update local state
        setCompany(newCompany);
        setProfile(prev => prev ? { ...prev, company_id: newCompany.id } : null);

        return { data: newCompany, error: null };

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          return { 
            error: new Error('Company creation failed after multiple attempts. Please refresh the page and try again.') 
          };
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }

    return { error: new Error('All attempts failed - please refresh the page and try again') };
  };

  const skipCompanySetup = async () => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    try {
      console.log('⏭️ Skipping company setup - creating placeholder company...');
      
      // Create a placeholder company with minimal data
      const placeholderCompany = {
        name: profile.email || 'My Company',
        email: profile.email || '',
        phone: '',
        website: ''
      };

      console.log('📝 Placeholder company data:', placeholderCompany);
      return await createCompany(placeholderCompany);
    } catch (error) {
      console.error('❌ Skip company setup failed:', error);
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