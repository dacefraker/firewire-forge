import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Building, MapPin, FileText } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  number: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  pe_stamp_required: z.boolean().optional(),
  due_at: z.string().optional(),
  opened_at: z.string().optional(),
  closed_at: z.string().optional(),
  // Building details
  sprinklers: z.boolean().optional(),
  elevators: z.boolean().optional(),
  elevator_recall: z.string().optional(),
  area_sqft: z.number().optional(),
  stories: z.number().optional(),
  occupancy: z.string().optional(),
  fsae: z.boolean().optional(),
  two_way_comm: z.boolean().optional(),
  oee: z.boolean().optional(),
  sprinkler_notes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error, updateProject } = useProject(id!);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      number: "",
      status: "new",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      notes: "",
      pe_stamp_required: false,
      due_at: "",
      opened_at: "",
      closed_at: "",
      sprinklers: false,
      elevators: false,
      elevator_recall: "",
      area_sqft: undefined,
      stories: undefined,
      occupancy: "",
      fsae: false,
      two_way_comm: false,
      oee: false,
      sprinkler_notes: "",
    },
  });

  // Update form when project data loads
  useEffect(() => {
    if (project) {
      const buildingData = project.project_building;
      form.reset({
        name: project.name,
        number: project.number || "",
        status: project.status,
        address_line1: project.address_line1 || "",
        address_line2: project.address_line2 || "",
        city: project.city || "",
        state: project.state || "",
        postal_code: project.postal_code || "",
        notes: project.notes || "",
        pe_stamp_required: project.pe_stamp_required || false,
        due_at: project.due_at || "",
        opened_at: project.opened_at || "",
        closed_at: project.closed_at || "",
        sprinklers: buildingData?.sprinklers || false,
        elevators: buildingData?.elevators || false,
        elevator_recall: buildingData?.elevator_recall || "",
        area_sqft: buildingData?.area_sqft || undefined,
        stories: buildingData?.stories || undefined,
        occupancy: buildingData?.occupancy || "",
        fsae: buildingData?.fsae || false,
        two_way_comm: buildingData?.two_way_comm || false,
        oee: buildingData?.oee || false,
        sprinkler_notes: buildingData?.sprinkler_notes || "",
      });
    }
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    const {
      sprinklers,
      elevators,
      elevator_recall,
      area_sqft,
      stories,
      occupancy,
      fsae,
      two_way_comm,
      oee,
      sprinkler_notes,
      ...projectData
    } = data;

    const buildingData = {
      sprinklers,
      elevators,
      elevator_recall,
      area_sqft,
      stories,
      occupancy,
      fsae,
      two_way_comm,
      oee,
      sprinkler_notes,
    };

    const success = await updateProject({
      ...projectData,
      project_building: buildingData,
    });

    if (success) {
      navigate("/projects");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Project</h1>
              <p className="text-muted-foreground">{project?.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
          {/* Basic Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Information
              </CardTitle>
              <CardDescription>
                Basic details about your fire protection project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter project name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Project Number</Label>
                  <Input
                    id="number"
                    {...form.register("number")}
                    placeholder="Enter project number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_at">Due Date</Label>
                  <Input
                    id="due_at"
                    type="date"
                    {...form.register("due_at")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opened_at">Opened Date</Label>
                  <Input
                    id="opened_at"
                    type="date"
                    {...form.register("opened_at")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closed_at">Closed Date</Label>
                  <Input
                    id="closed_at"
                    type="date"
                    {...form.register("closed_at")}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pe_stamp_required"
                  checked={form.watch("pe_stamp_required")}
                  onCheckedChange={(checked) => form.setValue("pe_stamp_required", checked)}
                />
                <Label htmlFor="pe_stamp_required">P.E. Stamp Required</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Enter project notes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Project Address
              </CardTitle>
              <CardDescription>
                Location details for the project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  {...form.register("address_line1")}
                  placeholder="Enter street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  {...form.register("address_line2")}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    placeholder="Enter state"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    {...form.register("postal_code")}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Building Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Building Details
              </CardTitle>
              <CardDescription>
                Technical specifications and features of the building.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq ft)</Label>
                  <Input
                    id="area_sqft"
                    type="number"
                    {...form.register("area_sqft", { valueAsNumber: true })}
                    placeholder="Enter building area"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stories">Number of Stories</Label>
                  <Input
                    id="stories"
                    type="number"
                    {...form.register("stories", { valueAsNumber: true })}
                    placeholder="Enter number of stories"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupancy">Occupancy Type</Label>
                  <Input
                    id="occupancy"
                    {...form.register("occupancy")}
                    placeholder="Enter occupancy type"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elevator_recall">Elevator Recall</Label>
                  <Input
                    id="elevator_recall"
                    {...form.register("elevator_recall")}
                    placeholder="Enter elevator recall details"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Building Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sprinklers"
                      checked={form.watch("sprinklers")}
                      onCheckedChange={(checked) => form.setValue("sprinklers", checked)}
                    />
                    <Label htmlFor="sprinklers">Sprinklers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="elevators"
                      checked={form.watch("elevators")}
                      onCheckedChange={(checked) => form.setValue("elevators", checked)}
                    />
                    <Label htmlFor="elevators">Elevators</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fsae"
                      checked={form.watch("fsae")}
                      onCheckedChange={(checked) => form.setValue("fsae", checked)}
                    />
                    <Label htmlFor="fsae">FSAE</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="two_way_comm"
                      checked={form.watch("two_way_comm")}
                      onCheckedChange={(checked) => form.setValue("two_way_comm", checked)}
                    />
                    <Label htmlFor="two_way_comm">Two-Way Communication</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="oee"
                      checked={form.watch("oee")}
                      onCheckedChange={(checked) => form.setValue("oee", checked)}
                    />
                    <Label htmlFor="oee">OEE</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprinkler_notes">Sprinkler Notes</Label>
                <Textarea
                  id="sprinkler_notes"
                  {...form.register("sprinkler_notes")}
                  placeholder="Enter sprinkler-specific notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/projects")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}