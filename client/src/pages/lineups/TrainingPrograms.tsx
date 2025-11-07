import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, ChevronRight, Award, Layers, AlertCircle } from "lucide-react";
import type { TrainingProgram, ProgramStep, Competency, Department, Scene, Act, Cue } from "@shared/schema";

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

const colorTagLabels: Record<string, { label: string; color: string }> = {
  green: { label: "Act", color: "bg-green-500" },
  yellow: { label: "Cue", color: "bg-yellow-500" },
  orange: { label: "Acrobatic Cue", color: "bg-orange-500" },
};

const programSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sceneId: z.string().optional(),
  actId: z.string().optional(),
  cueId: z.string().optional(),
  competencyId: z.string().optional(),
  colorTag: z.string().optional(),
  isTemplate: z.coerce.number(),
});

const stepSchema = z.object({
  name: z.string().min(1, "Name is required"),
  departmentId: z.string().min(1, "Department is required"),
  stepType: z.string().min(1, "Step type is required"),
  conditions: z.string().optional(),
  signOffAuthority: z.string().min(1, "Sign-off authority is required"),
  notes: z.string().optional(),
  expectedDurationMinutes: z.coerce.number().optional(),
  sortOrder: z.coerce.number(),
});

export default function TrainingPrograms() {
  const { toast } = useToast();
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

  const { data: scenes = [] } = useQuery<Scene[]>({
    queryKey: ["/api/scenes"],
  });

  const { data: acts = [] } = useQuery<Act[]>({
    queryKey: ["/api/acts"],
  });

  const { data: cues = [] } = useQuery<Cue[]>({
    queryKey: ["/api/cues"],
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

  // Forms
  const programForm = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      sceneId: "",
      actId: "",
      cueId: "",
      competencyId: "",
      colorTag: "",
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
      notes: "",
      expectedDurationMinutes: undefined,
      sortOrder: 0,
    },
  });

  // Reset forms when editing
  useEffect(() => {
    if (editingProgram) {
      programForm.reset({
        name: editingProgram.name,
        sceneId: editingProgram.sceneId || "",
        actId: editingProgram.actId || "",
        cueId: editingProgram.cueId || "",
        competencyId: editingProgram.competencyId || "",
        colorTag: editingProgram.colorTag || "",
        isTemplate: editingProgram.isTemplate,
      });
    } else {
      programForm.reset({
        name: "",
        sceneId: "",
        actId: "",
        cueId: "",
        competencyId: "",
        colorTag: "",
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
        notes: editingStep.notes || "",
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
        notes: "",
        expectedDurationMinutes: undefined,
        sortOrder: steps.length,
      });
    }
  }, [editingStep, stepForm, steps.length]);

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        competencyId: data.competencyId || null,
        colorTag: data.colorTag || null,
      };
      return apiRequest("/api/training-programs", "POST", payload);
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
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        competencyId: data.competencyId || null,
        colorTag: data.colorTag || null,
      };
      return apiRequest(`/api/training-programs/${id}`, "PATCH", payload);
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
    mutationFn: async (id: string) => apiRequest(`/api/training-programs/${id}`, "DELETE"),
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
        conditions: data.conditions || null,
        notes: data.notes || null,
        expectedDurationMinutes: data.expectedDurationMinutes || null,
      };
      return apiRequest(`/api/training-programs/${selectedProgram!.id}/steps`, "POST", payload);
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
        notes: data.notes || null,
        expectedDurationMinutes: data.expectedDurationMinutes || null,
      };
      return apiRequest(`/api/training-programs/${selectedProgram!.id}/steps/${id}`, "PATCH", payload);
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
      apiRequest(`/api/training-programs/${selectedProgram!.id}/steps/${id}`, "DELETE"),
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

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No training programs yet. Create your first program to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {programs.map((program) => {
              const competency = competencies.find((c) => c.id === program.competencyId);
              const scene = scenes.find((s) => s.id === program.sceneId);
              const act = acts.find((a) => a.id === program.actId);
              const cue = cues.find((c) => c.id === program.cueId);
              
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
                          {program.isTemplate === 1 && (
                            <Badge variant="secondary" data-testid="badge-template">Template</Badge>
                          )}
                          {program.colorTag && colorTagLabels[program.colorTag] && (
                            <Badge 
                              className={`${colorTagLabels[program.colorTag].color} text-white`}
                              data-testid={`badge-color-${program.colorTag}`}
                            >
                              {colorTagLabels[program.colorTag].label}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          {competency && (
                            <div className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              <span>Awards: {competency.name}</span>
                            </div>
                          )}
                          {(scene || act || cue) && (
                            <div className="text-xs">
                              {scene && `Scene: ${scene.name}`}
                              {act && `Act: ${act.name}`}
                              {cue && `Cue: ${cue.name}`}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProgram(program);
                            setProgramDialogOpen(true);
                          }}
                          data-testid={`button-edit-program-${program.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ type: 'program', id: program.id });
                            setDeleteConfirmOpen(true);
                          }}
                          data-testid={`button-delete-program-${program.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Program Dialog */}
        <Dialog open={programDialogOpen} onOpenChange={(open) => {
          setProgramDialogOpen(open);
          if (!open) setEditingProgram(null);
        }}>
          <DialogContent className="max-w-2xl">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={programForm.control}
                    name="competencyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Awards Competency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-competency">
                              <SelectValue placeholder="Select competency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {competencies.map((comp) => (
                              <SelectItem key={comp.id} value={comp.id}>
                                {comp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={programForm.control}
                    name="colorTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Tag</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-color-tag">
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="green">Green (Act)</SelectItem>
                            <SelectItem value="yellow">Yellow (Cue)</SelectItem>
                            <SelectItem value="orange">Orange (Acrobatic Cue)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={programForm.control}
                    name="sceneId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scene</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scene">
                              <SelectValue placeholder="Select scene" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {scenes.map((scene) => (
                              <SelectItem key={scene.id} value={scene.id}>
                                {scene.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={programForm.control}
                    name="actId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Act</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-act">
                              <SelectValue placeholder="Select act" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {acts.map((act) => (
                              <SelectItem key={act.id} value={act.id}>
                                {act.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={programForm.control}
                    name="cueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cue</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cue">
                              <SelectValue placeholder="Select cue" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {cues.map((cue) => (
                              <SelectItem key={cue.id} value={cue.id}>
                                {cue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedProgram(null)}
            className="mb-2"
            data-testid="button-back-to-list"
          >
            ← Back to Programs
          </Button>
          <h1 className="text-3xl font-bold">{selectedProgram.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage training steps and validation requirements
          </p>
        </div>
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
                        {step.notes && (
                          <p className="text-sm mt-2">{step.notes}</p>
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

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={(open) => {
        setStepDialogOpen(open);
        if (!open) setEditingStep(null);
      }}>
        <DialogContent className="max-w-2xl">
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
                          <SelectItem value="">None</SelectItem>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-notes" />
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
