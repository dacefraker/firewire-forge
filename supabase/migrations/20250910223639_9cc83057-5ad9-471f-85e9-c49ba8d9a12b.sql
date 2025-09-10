-- Add created_by column to companies table to properly track ownership
ALTER TABLE public.companies 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create a security definer function to safely check authentication
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Create function to get current user ID safely
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Drop existing RLS policies for companies
DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their company" ON public.companies;

-- Create new RLS policies using security definer functions
CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_authenticated() AND 
  created_by = public.get_current_user_id()
);

CREATE POLICY "Users can view their created companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  created_by = public.get_current_user_id() OR
  id IN (
    SELECT profiles.company_id 
    FROM profiles 
    WHERE profiles.id = public.get_current_user_id()
  )
);

CREATE POLICY "Users can update their created companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  created_by = public.get_current_user_id() OR
  id IN (
    SELECT profiles.company_id 
    FROM profiles 
    WHERE profiles.id = public.get_current_user_id()
  )
);