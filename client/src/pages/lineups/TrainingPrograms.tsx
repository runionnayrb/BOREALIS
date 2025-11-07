import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, ChevronRight, Award, Layers, AlertCircle, FileText, Users, X, GraduationCap } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import type { TrainingProgram, ProgramStep, Competency, Department, Artist, ProgramArtist } from "@shared/schema";

const stepTypeLabels: Record<string, string> = {
  choreography: "Choreography",
  induction: "Induction",
  rehearsal: "Rehearsal",
  show_validation: "Show Validation",
  technical: "Technical",
  wardrobe: "Wardrobe",
};

const programSchema = z.object({
  name: z.string().min(1, "Name is required"),
  competencyId: z.string().min(1, "Competency Goal is required"),
  isTemplate: z.coerce.number(),
});

const stepSchema = z.object({
  name: z.string().min(1, "Name is required"),
  departmentId: z.string().min(1, "Department is required"),
  stepType: z.string().min(1, "Step type is required"),
  conditions: z.string().optional(),
  departmentSignOffId: z.string().min(1, "Sign-off department is required"),
  description: z.string().optional(),
  expectedDurationMinutes: z.coerce.number().optional(),
  sortOrder: z.coerce.number(),
});

export default function TrainingPrograms() {
  const { toast } = useToast();
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [editingStep, setEditingStep] = useState<ProgramStep | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'program' | 'step'; id: string } | null>(null);

  // Fetch data
  const { data: programs = [], isLoading: loadingPrograms } = useQuery<TrainingProgram[]>({
    queryKey: ["/api/training-programs"],
  });

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Fetch specific program by ID from URL (including templates)
  const { data: programFromUrl } = useQuery<TrainingProgram>({
    queryKey: ["/api/training-programs", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/training-programs/${params.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch program");
      return response.json();
    },
    enabled: !!params.id,
  });

  const { data: steps = [], isLoading: loadingSteps } = useQuery<ProgramStep[]>({
    queryKey: ["/api/training-programs", selectedProgram?.id, "steps"],
    queryFn: async () => {
      const response = await fetch(`/api/training-programs/${selectedProgram!.id}/steps`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch steps");
      return response.json();
    },
    enabled: !!selectedProgram?.id,
  });

  const { data: programArtists = [] } = useQuery<ProgramArtist[]>({
    queryKey: ["/api/training-programs", selectedProgram?.id, "artists"],
    queryFn: async () => {
      const response = await fetch(`/api/training-programs/${selectedProgram!.id}/artists`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch program artists");
      return response.json();
    },
    enabled: !!selectedProgram?.id,
  });

  // Handle URL parameter to auto-select program
  useEffect(() => {
    if (params.id && programFromUrl && programFromUrl.id !== selectedProgram?.id) {
      // Use programFromUrl (fetched by ID, includes templates)
      setSelectedProgram(programFromUrl);
    } else if (!params.id && selectedProgram) {
      // Clear selection when navigating back to list view
      setSelectedProgram(null);
    }
  }, [params.id, programFromUrl]);

  // Forms
  const programForm = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      competencyId: "",
      isTemplate: 0,
    },
  });

  const stepForm = useForm<z.infer<typeof stepSchema>>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      name: "",
      departmentId: "",
      stepType: "",
      conditions: "",
      departmentSignOffId: "",
      description: "",
      expectedDurationMinutes: undefined,
      sortOrder: 0,
    },
  });

  // Reset forms when editing
  useEffect(() => {
    if (editingProgram) {
      programForm.reset({
        name: editingProgram.name,
        competencyId: editingProgram.competencyId || "",
        isTemplate: editingProgram.isTemplate,
      });
    } else {
      programForm.reset({
        name: "",
        competencyId: "",
        isTemplate: 0,
      });
    }
  }, [editingProgram, programForm]);

  useEffect(() => {
    if (editingStep) {
      stepForm.reset({
        name: editingStep.name,
        departmentId: editingStep.departmentId,
        stepType: editingStep.stepType,
        conditions: editingStep.conditions || "",
        departmentSignOffId: editingStep.departmentSignOffId,
        description: editingStep.description || "",
        expectedDurationMinutes: editingStep.expectedDurationMinutes || undefined,
        sortOrder: editingStep.sortOrder,
      });
    } else {
      stepForm.reset({
        name: "",
        departmentId: "",
        stepType: "",
        conditions: "",
        departmentSignOffId: "",
        description: "",
        expectedDurationMinutes: undefined,
        sortOrder: steps.length,
      });
    }
  }, [editingStep, stepForm, steps.length]);

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/training-programs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      toast({ title: "Training program created successfully" });
      setProgramDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create training program", variant: "destructive" });
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/training-programs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      toast({ title: "Training program updated successfully" });
      setProgramDialogOpen(false);
      setEditingProgram(null);
    },
    onError: () => {
      toast({ title: "Failed to update training program", variant: "destructive" });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/training-programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      toast({ title: "Training program deleted successfully" });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      setSelectedProgram(null);
    },
    onError: () => {
      toast({ title: "Failed to delete training program", variant: "destructive" });
    },
  });

  const createStepMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        programId: selectedProgram!.id,
        conditions: data.conditions || null,
        description: data.description || null,
        expectedDurationMinutes: data.expectedDurationMinutes || null,
      };
      return apiRequest("POST", `/api/program-steps`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "steps"] });
      toast({ title: "Step created successfully" });
      setStepDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create step", variant: "destructive" });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        conditions: data.conditions || null,
        description: data.description || null,
        expectedDurationMinutes: data.expectedDurationMinutes || null,
      };
      return apiRequest("PATCH", `/api/program-steps/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "steps"] });
      toast({ title: "Step updated successfully" });
      setStepDialogOpen(false);
      setEditingStep(null);
    },
    onError: () => {
      toast({ title: "Failed to update step", variant: "destructive" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/program-steps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "steps"] });
      toast({ title: "Step deleted successfully" });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete step", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'active' | 'completed') => {
      if (!selectedProgram) return null;
      return apiRequest("PATCH", `/api/training-programs/${selectedProgram.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", params.id] });
      toast({ title: "Program status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update program status", variant: "destructive" });
    },
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProgram) throw new Error("No template selected");
      return apiRequest("POST", `/api/training-programs/${selectedProgram.id}/create-from-template`, { name: selectedProgram.name });
    },
    onSuccess: (newProgram) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      toast({ title: `Program "${newProgram.name}" created from template successfully` });
      setSelectedProgram(newProgram);
      setLocation(`/lineups/training-programs/${newProgram.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create program from template", variant: "destructive" });
    },
  });

  const signOffStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return apiRequest("PATCH", `/api/program-steps/${stepId}/sign-off`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "steps"] });
      toast({ title: "Step signed off successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to sign off step",
        description: error.message || "You may not have permission to sign off this step",
        variant: "destructive",
      });
    },
  });

  const addArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!selectedProgram) throw new Error("No program selected");
      return apiRequest("POST", "/api/program-artists", {
        programId: selectedProgram.id,
        artistId,
        status: "not_started",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "artists"] });
      toast({ title: "Artist added to program successfully" });
      setArtistDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add artist to program", variant: "destructive" });
    },
  });

  const removeArtistMutation = useMutation({
    mutationFn: async (programArtistId: string) => {
      return apiRequest("DELETE", `/api/program-artists/${programArtistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs", selectedProgram?.id, "artists"] });
      toast({ title: "Artist removed from program successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove artist from program", variant: "destructive" });
    },
  });

  const handleSubmitProgram = (values: z.infer<typeof programSchema>) => {
    if (editingProgram) {
      updateProgramMutation.mutate({ id: editingProgram.id, data: values });
    } else {
      createProgramMutation.mutate(values);
    }
  };

  const handleSubmitStep = (values: z.infer<typeof stepSchema>) => {
    if (editingStep) {
      updateStepMutation.mutate({ id: editingStep.id, data: values });
    } else {
      createStepMutation.mutate(values);
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'program') {
      deleteProgramMutation.mutate(itemToDelete.id);
    } else {
      deleteStepMutation.mutate(itemToDelete.id);
    }
  };

  if (loadingPrograms) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading training programs...</p>
      </div>
    );
  }

  // Filter programs by status
  const activePrograms = programs.filter((p) => p.status === 'active');
  const completedPrograms = programs.filter((p) => p.status === 'completed');

  // List view
  if (!selectedProgram) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Training Programs</h1>
            <p className="text-muted-foreground mt-1">
              Manage training programs and validation requirements for artist competencies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/lineups/training-programs/templates">
              <Button variant="outline" data-testid="button-view-templates">
                <FileText className="w-4 h-4 mr-2" />
                View Templates
              </Button>
            </Link>
            <Button
              onClick={() => {
                setEditingProgram(null);
                setProgramDialogOpen(true);
              }}
              data-testid="button-add-training-program"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-programs">
              Active ({activePrograms.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-programs">
              Completed ({completedPrograms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activePrograms.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No active training programs. Create a new program to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activePrograms.map((program) => {
                  const competency = competencies.find((c) => c.id === program.competencyId);
                  return (
                    <Card
                      key={program.id}
                      className="p-4 hover-elevate cursor-pointer"
                      onClick={() => setSelectedProgram(program)}
                      data-testid={`program-card-${program.id}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 truncate">
                              {program.name}
                            </h3>
                            {competency && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {competency.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" data-testid="badge-status-active">
                            Active
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedPrograms.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No completed training programs yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedPrograms.map((program) => {
                  const competency = competencies.find((c) => c.id === program.competencyId);
                  return (
                    <Card
                      key={program.id}
                      className="p-4 hover-elevate cursor-pointer"
                      onClick={() => setSelectedProgram(program)}
                      data-testid={`program-card-${program.id}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 truncate">
                              {program.name}
                            </h3>
                            {competency && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {competency.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" data-testid="badge-status-completed">
                            Completed
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Program Dialog */}
        <Dialog open={programDialogOpen} onOpenChange={(open) => {
          setProgramDialogOpen(open);
          if (!open) setEditingProgram(null);
        }}>
          <DialogContent 
            className="max-w-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{editingProgram ? "Edit" : "Create"} Training Program</DialogTitle>
              <DialogDescription>
                Define a training program with steps for artist competency validation
              </DialogDescription>
            </DialogHeader>
            <Form {...programForm}>
              <form onSubmit={programForm.handleSubmit(handleSubmitProgram)} className="space-y-4">
                <FormField
                  control={programForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-program-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={programForm.control}
                  name="competencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competency Goal *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-competency">
                            <SelectValue placeholder="Select competency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {competencies.map((comp) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The competency this training program will award upon completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={programForm.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-is-template">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Active Program</SelectItem>
                          <SelectItem value="1">Template</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProgramDialogOpen(false)}
                    data-testid="button-cancel-program"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProgramMutation.isPending || updateProgramMutation.isPending}
                    data-testid="button-save-program"
                  >
                    {editingProgram ? "Update" : "Create"} Program
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setItemToDelete(null);
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProgramMutation.isPending || deleteStepMutation.isPending}
                data-testid="button-confirm-delete"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // Detail view
  const sortedSteps = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const competency = competencies.find((c) => c.id === selectedProgram.competencyId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedProgram(null);
              setLocation("/lineups/training-programs");
            }}
            className="mb-2"
            data-testid="button-back-to-list"
          >
            ← Back to Programs
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{selectedProgram.name}</h1>
            {selectedProgram.isTemplate === 1 && (
              <Badge variant="secondary" data-testid="badge-template">Template</Badge>
            )}
            {selectedProgram.status === 'completed' && (
              <Badge variant="secondary" data-testid="badge-completed-detail">Completed</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedProgram.isTemplate === 0 && (
            <Select
              value={selectedProgram.status}
              onValueChange={(value: 'active' | 'completed') => updateStatusMutation.mutate(value)}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-program-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {selectedProgram.isTemplate === 1 && (
            <Button
              onClick={() => createFromTemplateMutation.mutate()}
              disabled={createFromTemplateMutation.isPending}
              data-testid="button-create-from-template"
            >
              <Layers className="w-4 h-4 mr-2" />
              Create from Template
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setEditingProgram(selectedProgram);
              setProgramDialogOpen(true);
            }}
            data-testid="button-edit-program-detail"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => {
              setEditingStep(null);
              setStepDialogOpen(true);
            }}
            data-testid="button-add-step"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>
      </div>

      {loadingSteps ? (
        <p className="text-muted-foreground">Loading steps...</p>
      ) : sortedSteps.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No steps defined yet. Add steps to build the training program workflow.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSteps.map((step, index) => {
            const department = departments.find((d) => d.id === step.departmentId);
            const signOffDepartment = departments.find((d) => d.id === step.departmentSignOffId);
            return (
              <Card key={step.id} data-testid={`step-card-${step.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        {step.name}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{stepTypeLabels[step.stepType]}</Badge>
                          <Badge variant="outline">{department?.name}</Badge>
                          <Badge variant="outline">Sign-off: {signOffDepartment?.name}</Badge>
                          {step.conditions && (
                            <Badge variant="outline">
                              {step.conditions === 'work_lights' ? 'Work Lights' : 'Show Conditions'}
                            </Badge>
                          )}
                          {step.expectedDurationMinutes && (
                            <Badge variant="outline">{step.expectedDurationMinutes} min</Badge>
                          )}
                          {step.signedOffByUserId && step.signedOffAt && (
                            <Badge className="bg-green-600 hover:bg-green-700" data-testid={`badge-signed-off-${step.id}`}>
                              Signed Off {new Date(step.signedOffAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm mt-2">{step.description}</p>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {!step.signedOffByUserId && selectedProgram.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => signOffStepMutation.mutate(step.id)}
                          disabled={signOffStepMutation.isPending}
                          data-testid={`button-sign-off-${step.id}`}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Sign Off
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingStep(step);
                          setStepDialogOpen(true);
                        }}
                        data-testid={`button-edit-step-${step.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setItemToDelete({ type: 'step', id: step.id });
                          setDeleteConfirmOpen(true);
                        }}
                        data-testid={`button-delete-step-${step.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Artists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Assigned Artists
          </h2>
          {selectedProgram.status === 'active' && (
            <Button
              onClick={() => setArtistDialogOpen(true)}
              data-testid="button-add-artist"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Artist
            </Button>
          )}
        </div>

        {programArtists.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No artists assigned yet. Add artists to track their progress through this training program.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {programArtists.map((programArtist) => {
              const artist = artists.find((a) => a.id === programArtist.artistId);
              if (!artist) return null;
              return (
                <Card key={programArtist.id} className="p-4" data-testid={`artist-card-${artist.id}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{artist.firstName} {artist.lastName}</p>
                      </div>
                      <Badge variant="outline">
                        {programArtist.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    {selectedProgram.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArtistMutation.mutate(programArtist.id)}
                        disabled={removeArtistMutation.isPending}
                        data-testid={`button-remove-artist-${artist.id}`}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Program Button */}
      <div className="flex justify-start pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setItemToDelete({ type: 'program', id: selectedProgram.id });
            setDeleteConfirmOpen(true);
          }}
          data-testid="button-delete-program-detail"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Program
        </Button>
      </div>

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={(open) => {
        setStepDialogOpen(open);
        if (!open) setEditingStep(null);
      }}>
        <DialogContent 
          className="max-w-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit" : "Add"} Training Step</DialogTitle>
            <DialogDescription>
              Define a step in the training program workflow
            </DialogDescription>
          </DialogHeader>
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(handleSubmitStep)} className="space-y-4">
              <FormField
                control={stepForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-step-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stepForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stepForm.control}
                  name="stepType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-step-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="choreography">Choreography</SelectItem>
                          <SelectItem value="induction">Induction</SelectItem>
                          <SelectItem value="rehearsal">Rehearsal</SelectItem>
                          <SelectItem value="show_validation">Show Validation</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="wardrobe">Wardrobe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stepForm.control}
                  name="departmentSignOffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sign-off Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sign-off-department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stepForm.control}
                  name="conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditions</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-conditions">
                            <SelectValue placeholder="Select conditions" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="work_lights">Work Lights</SelectItem>
                          <SelectItem value="training_lights">Training Lights</SelectItem>
                          <SelectItem value="show_conditions">Show Conditions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stepForm.control}
                  name="expectedDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stepForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          data-testid="input-sort-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stepForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Describe what skill/competency this step validates" data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStepDialogOpen(false)}
                  data-testid="button-cancel-step"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStepMutation.isPending || updateStepMutation.isPending}
                  data-testid="button-save-step"
                >
                  {editingStep ? "Update" : "Add"} Step
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Artist Assignment Dialog */}
      <Dialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Artist to Program</DialogTitle>
            <DialogDescription>
              Select artists to assign to this training program
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {artists
              .filter((artist) => !programArtists.some((pa) => pa.artistId === artist.id))
              .map((artist) => (
                <Button
                  key={artist.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addArtistMutation.mutate(artist.id)}
                  disabled={addArtistMutation.isPending}
                  data-testid={`button-select-artist-${artist.id}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {artist.firstName} {artist.lastName}
                </Button>
              ))}
            {artists.filter((artist) => !programArtists.some((pa) => pa.artistId === artist.id)).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                All artists are already assigned to this program
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProgramMutation.isPending || deleteStepMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
