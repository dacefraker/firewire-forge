-- Add data_sheets_required column to projects table
ALTER TABLE public.projects 
ADD COLUMN data_sheets_required boolean DEFAULT false;