import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  number?: string;
  status: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  notes?: string;
  pe_stamp_required?: boolean;
  due_at?: string;
  opened_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  client_id?: string;
  company_id?: string;
  created_by?: string;
  latitude?: number;
  longitude?: number;
  project_building?: {
    id: string;
    project_id: string;
    sprinklers?: boolean;
    elevators?: boolean;
    elevator_recall?: string;
    area_sqft?: number;
    stories?: number;
    occupancy?: string;
    fsae?: boolean;
    two_way_comm?: boolean;
    oee?: boolean;
    sprinkler_notes?: string;
  };
}

interface ProjectBuildingUpdate {
  sprinklers?: boolean;
  elevators?: boolean;
  elevator_recall?: string;
  area_sqft?: number;
  stories?: number;
  occupancy?: string;
  fsae?: boolean;
  two_way_comm?: boolean;
  oee?: boolean;
  sprinkler_notes?: string;
}

interface ProjectUpdate extends Omit<Partial<Project>, 'project_building'> {
  project_building?: ProjectBuildingUpdate;
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProject = async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_building(*)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      setProject(data);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: ProjectUpdate) => {
    if (!user || !projectId) return false;

    try {
      // Separate project building updates from main project updates
      const { project_building, ...projectUpdates } = updates;

      // Update main project
      if (Object.keys(projectUpdates).length > 0) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectUpdates)
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      // Update project building if it exists and we have building data
      if (project_building && project?.project_building) {
        const { error: buildingError } = await supabase
          .from('project_building')
          .update(project_building)
          .eq('project_id', projectId);

        if (buildingError) throw buildingError;
      } else if (project_building && !project?.project_building) {
        // Create project building if it doesn't exist
        const { error: buildingError } = await supabase
          .from('project_building')
          .insert({ ...project_building, project_id: projectId });

        if (buildingError) throw buildingError;
      }

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      // Refresh project data
      await fetchProject();
      return true;
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update project",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProject();
  }, [user, projectId]);

  return {
    project,
    loading,
    error,
    updateProject,
    refetch: fetchProject,
  };
}