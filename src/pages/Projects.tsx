import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, FileText, Users, Building, Wrench, Search, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects, Project } from "@/hooks/useProjects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProjectFilesModal from "@/components/ProjectFilesModal";

export default function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [showFilesModal, setShowFilesModal] = useState(false);
  const { projects, loading, error, refetch } = useProjects();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.city && project.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (project.state && project.state.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || project.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-success text-success-foreground";
      case "in progress": return "bg-warning text-warning-foreground";
      case "active": return "bg-warning text-warning-foreground";
      case "quoted": return "bg-primary text-primary-foreground";
      case "new": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatAddress = (project: Project) => {
    const parts = [project.city, project.state, project.postal_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address specified';
  };

  const handleViewFiles = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedProjectName(project.name);
    setShowFilesModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
              <p className="text-muted-foreground mt-2">Manage and view all your fire protection projects</p>
            </div>
            <Button onClick={() => navigate("/")}>
              Create New Project
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error} <Button variant="outline" size="sm" onClick={refetch} className="ml-2">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-2">Manage and view all your fire protection projects</p>
          </div>
          <Button onClick={() => navigate("/")}>
            Create New Project
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="quoted">Quoted</option>
          </select>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {formatAddress(project)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>

                {/* Project Details */}
                <div className="space-y-3">
                  {/* Project Info */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2 flex-wrap">
                      {project.pe_stamp_required && (
                        <Badge variant="outline" className="text-xs">P.E. Stamp Required</Badge>
                      )}
                      {project.number && (
                        <Badge variant="outline" className="text-xs">#{project.number}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Building Features */}
                  {project.project_building && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div className="flex gap-2 flex-wrap">
                        {project.project_building.sprinklers && (
                          <Badge variant="outline" className="text-xs">Sprinklers</Badge>
                        )}
                        {project.project_building.elevators && (
                          <Badge variant="outline" className="text-xs">Elevators</Badge>
                        )}
                        {project.project_building.fsae && (
                          <Badge variant="outline" className="text-xs">FSAE</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Occupancy Type */}
                  {project.project_building?.occupancy && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {project.project_building.occupancy}
                      </Badge>
                    </div>
                  )}

                  {/* Building Area */}
                  {project.project_building?.area_sqft && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {project.project_building.area_sqft.toLocaleString()} sq ft
                      </span>
                    </div>
                  )}

                  {/* Files */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {project.file_count || 0} files uploaded
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {project.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{project.notes}"
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewFiles(project)}
                  >
                    View Files
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    Edit Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No projects found matching your criteria.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/")}
            >
              Create Your First Project
            </Button>
          </div>
        )}
      </div>

      {/* Project Files Modal */}
      {selectedProjectId && (
        <ProjectFilesModal
          open={showFilesModal}
          onOpenChange={setShowFilesModal}
          projectId={selectedProjectId}
          projectName={selectedProjectName}
        />
      )}
    </div>
  );
}