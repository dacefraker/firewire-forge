import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Project {
  id: string;
  name: string;
  number: string | null;
  status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  pe_stamp_required: boolean | null;
  due_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  client_id: string | null;
  company_id: string | null;
  // Related data
  project_building?: {
    sprinklers: boolean | null;
    elevators: boolean | null;
    elevator_recall: string | null;
    area_sqft: number | null;
    stories: number | null;
    fsae: boolean | null;
    two_way_comm: boolean | null;
    oee: boolean | null;
    sprinkler_notes: string | null;
    occupancy: string | null;
  } | null;
  files?: Array<{
    id: string;
    filename: string;
    category: string | null;
    size_bytes: number | null;
    uploaded_at: string;
  }>;
  file_count?: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_building (
            sprinklers,
            elevators,
            elevator_recall,
            area_sqft,
            stories,
            fsae,
            two_way_comm,
            oee,
            sprinkler_notes,
            occupancy
          )
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch file counts for each project
      const projectsWithFiles: Project[] = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count, error: filesError } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          if (filesError) {
            console.error('Error fetching file count:', filesError);
          }

          return {
            ...project,
            project_building: project.project_building?.[0] || null,
            file_count: count || 0
          };
        })
      );

      setProjects(projectsWithFiles);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      toast({
        title: "Error fetching projects",
        description: "There was a problem loading your projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, status } : project
      ));

      toast({
        title: "Project updated",
        description: `Project status changed to ${status}`
      });
    } catch (err) {
      console.error('Error updating project:', err);
      toast({
        title: "Error updating project",
        description: "Failed to update project status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "Project has been successfully deleted."
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({
        title: "Error deleting project",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          // Refresh projects when changes occur
          fetchProjects();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files'
        },
        () => {
          // Refresh projects when files change to update file counts
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    updateProjectStatus,
    deleteProject
  };
};