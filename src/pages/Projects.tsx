import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, FileText, Users, Building, Wrench, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample data matching WizardData structure
const sampleProjects = [
  {
    id: 1,
    name: "Downtown Office Complex",
    address1: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    created_at: "2024-01-15",
    status: "In Progress",
    addons: {
      needs_pe_stamp: true,
      needs_data_sheets: true,
      notes: "Rush project, need completed by end of month"
    },
    sprinklers: {
      has_sprinklers: true,
      riser_location: "Main electrical room, first floor",
      narrative: "Wet system with flow switches on each floor"
    },
    elevators: {
      has_elevators: true,
      not_sure: false,
      use_cases: ["Passenger", "Freight"],
      count: 4,
      machine_room_location: "Rooftop penthouse",
      narrative: "2 passenger elevators, 2 freight elevators",
      special: "High-speed passenger elevators required"
    },
    occupancy_types: ["B - Business", "A-2 - Assembly"],
    parts: {
      mode: "specify" as const,
      equipment_file_id: null,
      narrative: "Standard office building equipment",
      specified: [
        {
          part: "Fire Alarm Control Panel",
          manufacturer: "Honeywell",
          manufacturer_unknown: false,
          model: "FACP-2000",
          model_unknown: false,
          unknown_text: "",
          is_new: true,
          location: "Main electrical room"
        }
      ]
    },
    uploaded_file_ids: [1, 2, 3]
  },
  {
    id: 2,
    name: "Residential High Rise",
    address1: "456 Oak Avenue",
    city: "Los Angeles",
    state: "CA",
    zip: "90210",
    created_at: "2024-01-20",
    status: "Completed",
    addons: {
      needs_pe_stamp: true,
      needs_data_sheets: false,
      notes: "Standard residential project"
    },
    sprinklers: {
      has_sprinklers: true,
      riser_location: "Ground floor utility room",
      narrative: "Residential sprinkler system per NFPA 13R"
    },
    elevators: {
      has_elevators: true,
      not_sure: false,
      use_cases: ["Passenger"],
      count: 2,
      machine_room_location: "Machine room on top floor",
      narrative: "Two passenger elevators serving all floors",
      special: ""
    },
    occupancy_types: ["R-2 - Residential"],
    parts: {
      mode: "upload_file" as const,
      equipment_file_id: 5,
      narrative: "See uploaded equipment schedule",
      specified: []
    },
    uploaded_file_ids: [4, 5, 6]
  },
  {
    id: 3,
    name: "Shopping Mall Renovation",
    address1: "789 Commerce Blvd",
    city: "Miami",
    state: "FL",
    zip: "33101",
    created_at: "2024-02-01",
    status: "Quoted",
    addons: {
      needs_pe_stamp: false,
      needs_data_sheets: true,
      notes: "Existing building renovation, need coordination with existing systems"
    },
    sprinklers: {
      has_sprinklers: true,
      riser_location: "Multiple risers throughout mall",
      narrative: "Existing sprinkler system to be modified for new tenant spaces"
    },
    elevators: {
      has_elevators: false,
      not_sure: false,
      use_cases: [],
      count: 0,
      machine_room_location: "",
      narrative: "Single-story mall, no elevators",
      special: ""
    },
    occupancy_types: ["M - Mercantile", "A-3 - Assembly"],
    parts: {
      mode: "specify" as const,
      equipment_file_id: null,
      narrative: "Mix of new and existing equipment",
      specified: [
        {
          part: "Smoke Detector",
          manufacturer: "System Sensor",
          manufacturer_unknown: false,
          model: "ECO1003",
          model_unknown: false,
          unknown_text: "",
          is_new: false,
          location: "Various locations"
        }
      ]
    },
    uploaded_file_ids: [7, 8]
  }
];

export default function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = sampleProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.state.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-success text-success-foreground";
      case "in progress": return "bg-warning text-warning-foreground";
      case "quoted": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
                      {project.city}, {project.state} {project.zip}
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
                  {/* Add-ons */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2">
                      {project.addons.needs_pe_stamp && (
                        <Badge variant="outline" className="text-xs">P.E. Stamp</Badge>
                      )}
                      {project.addons.needs_data_sheets && (
                        <Badge variant="outline" className="text-xs">Data Sheets</Badge>
                      )}
                    </div>
                  </div>

                  {/* Building Features */}
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2 flex-wrap">
                      {project.sprinklers.has_sprinklers && (
                        <Badge variant="outline" className="text-xs">Sprinklers</Badge>
                      )}
                      {project.elevators.has_elevators && (
                        <Badge variant="outline" className="text-xs">{project.elevators.count} Elevators</Badge>
                      )}
                    </div>
                  </div>

                  {/* Occupancy Types */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1 flex-wrap">
                      {project.occupancy_types.slice(0, 2).map((type, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{type}</Badge>
                      ))}
                      {project.occupancy_types.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.occupancy_types.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Parts Info */}
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {project.parts.mode === "upload_file" ? "Equipment File Uploaded" : 
                       `${project.parts.specified.length} Parts Specified`}
                    </span>
                  </div>

                  {/* Files */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {project.uploaded_file_ids.length} files uploaded
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {project.addons.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{project.addons.notes}"
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
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
    </div>
  );
}