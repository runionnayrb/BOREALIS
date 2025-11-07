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
import { Plus, Edit, Trash2, ChevronRight, Award, Layers, AlertCircle, FileText } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import type { TrainingProgram, ProgramStep, Competency, Department } from "@shared/schema";

const stepTypeLabels: Record<string, string> = {
  induction: "Induction",
  technical: "Technical",
  rehearsal: "Rehearsal",
  show_validation: "Show Validation",
};

const authorityLabels: Record<string, string> = {
  hod: "HOD",
  ahod: "AHOD",
  lead: "Lead",
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
  signOffAuthority: z.string().min(1, "Sign-off authority is required"),
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
      signOffAuthority: "",
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
        signOffAuthority: editingStep.signOffAuthority,
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
        signOffAuthority: "",
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
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedProgram(program)}
                      data-testid={`program-card-${program.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{program.name}</CardTitle>
                            <CardDescription className="mt-2">
                              {competency && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  <span>Awards: {competency.name}</span>
                                </div>
                              )}
                            </CardDescription>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
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
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedProgram(program)}
                      data-testid={`program-card-${program.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {program.name}
                              <Badge variant="secondary" data-testid="badge-completed">Completed</Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {competency && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  <span>Awards: {competency.name}</span>
                                </div>
                              )}
                            </CardDescription>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
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
                          <Badge variant="outline">Sign-off: {authorityLabels[step.signOffAuthority]}</Badge>
                          {step.conditions && (
                            <Badge variant="outline">
                              {step.conditions === 'work_lights' ? 'Work Lights' : 'Show Conditions'}
                            </Badge>
                          )}
                          {step.expectedDurationMinutes && (
                            <Badge variant="outline">{step.expectedDurationMinutes} min</Badge>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm mt-2">{step.description}</p>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
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
                          {departments.map((dept) => (
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
                          <SelectItem value="induction">Induction</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="rehearsal">Rehearsal</SelectItem>
                          <SelectItem value="show_validation">Show Validation</SelectItem>
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
                  name="signOffAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sign-off Authority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-authority">
                            <SelectValue placeholder="Select authority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hod">HOD</SelectItem>
                          <SelectItem value="ahod">AHOD</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
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
