import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
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
import { Plus, Edit, Trash2, ChevronRight, Users, Award, X } from "lucide-react";
import type { Position, PositionCompetency, Competency, Department, Scene, Act, Cue } from "@shared/schema";

const positionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sceneId: z.string().optional(),
  actId: z.string().optional(),
  cueId: z.string().optional(),
  departmentId: z.string().optional(),
  maxAssignees: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(1, "Must be at least 1").optional()
  ),
  description: z.string().optional(),
});

export default function Positions() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  // Fetch data
  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
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

  const { data: positionCompetencies = [], isLoading: loadingCompetencies } = useQuery<PositionCompetency[]>({
    queryKey: ["/api/positions", selectedPosition?.id, "competencies"],
    queryFn: async () => {
      const response = await fetch(`/api/positions/${selectedPosition!.id}/competencies`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch competencies");
      return response.json();
    },
    enabled: !!selectedPosition?.id,
  });

  // Form
  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
      sceneId: "",
      actId: "",
      cueId: "",
      departmentId: "",
      maxAssignees: undefined,
      description: "",
    },
  });

  // Reset form when editing
  useEffect(() => {
    if (editingPosition) {
      form.reset({
        name: editingPosition.name,
        sceneId: editingPosition.sceneId || "",
        actId: editingPosition.actId || "",
        cueId: editingPosition.cueId || "",
        departmentId: editingPosition.departmentId || "",
        maxAssignees: editingPosition.maxAssignees || undefined,
        description: editingPosition.description || "",
      });
    } else {
      form.reset({
        name: "",
        sceneId: "",
        actId: "",
        cueId: "",
        departmentId: "",
        maxAssignees: undefined,
        description: "",
      });
    }
  }, [editingPosition, form]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        departmentId: data.departmentId || null,
        maxAssignees: data.maxAssignees || null,
        description: data.description || null,
      };
      return apiRequest("/api/positions", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Position created successfully" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create position", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        departmentId: data.departmentId || null,
        maxAssignees: data.maxAssignees || null,
        description: data.description || null,
      };
      return apiRequest(`/api/positions/${id}`, "PATCH", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Position updated successfully" });
      setDialogOpen(false);
      setEditingPosition(null);
    },
    onError: () => {
      toast({ title: "Failed to update position", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/positions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Position deleted successfully" });
      setDeleteConfirmOpen(false);
      setPositionToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete position", variant: "destructive" });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest(`/api/positions/${id}`, "DELETE")));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: `${selectedForBatch.size} positions deleted successfully` });
      setBatchDeleteConfirm(false);
      setSelectedForBatch(new Set());
    },
    onError: () => {
      toast({ title: "Failed to delete positions", variant: "destructive" });
    },
  });

  const addCompetencyMutation = useMutation({
    mutationFn: async ({ positionId, competencyId }: { positionId: string; competencyId: string }) =>
      apiRequest(`/api/positions/${positionId}/competencies`, "POST", { competencyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions", selectedPosition?.id, "competencies"] });
      toast({ title: "Competency added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add competency", variant: "destructive" });
    },
  });

  const removeCompetencyMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/positions/${selectedPosition!.id}/competencies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions", selectedPosition?.id, "competencies"] });
      toast({ title: "Competency removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove competency", variant: "destructive" });
    },
  });

  const handleSubmit = (values: z.infer<typeof positionSchema>) => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleBatchDelete = () => {
    batchDeleteMutation.mutate(Array.from(selectedForBatch));
  };

  const toggleBatchSelect = (id: string) => {
    const newSet = new Set(selectedForBatch);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForBatch(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedForBatch.size === positions.length) {
      setSelectedForBatch(new Set());
    } else {
      setSelectedForBatch(new Set(positions.map(p => p.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading positions...</p>
      </div>
    );
  }

  // List view
  if (!selectedPosition) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Positions</h1>
            <p className="text-muted-foreground mt-1">
              Manage lineup positions and their competency requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedForBatch.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBatchDeleteConfirm(true)}
                data-testid="button-batch-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedForBatch.size})
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingPosition(null);
                setDialogOpen(true);
              }}
              data-testid="button-add-position"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
          </div>
        </div>

        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No positions defined yet. Create your first position to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {positions.length > 1 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedForBatch.size === positions.length}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({positions.length})
                </span>
              </div>
            )}
            <div className="grid gap-4">
              {positions.map((position) => {
                const department = departments.find((d) => d.id === position.departmentId);
                const scene = scenes.find((s) => s.id === position.sceneId);
                const act = acts.find((a) => a.id === position.actId);
                const cue = cues.find((c) => c.id === position.cueId);
                
                return (
                  <Card
                    key={position.id}
                    className="hover-elevate"
                    data-testid={`position-card-${position.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedForBatch.has(position.id)}
                          onCheckedChange={() => toggleBatchSelect(position.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-position-${position.id}`}
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedPosition(position)}
                        >
                          <CardTitle className="flex items-center gap-2">
                            {position.name}
                            {position.maxAssignees && (
                              <Badge variant="outline">Max: {position.maxAssignees}</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex flex-wrap gap-2">
                              {department && <Badge variant="secondary">{department.name}</Badge>}
                              {scene && <Badge variant="outline">Scene: {scene.name}</Badge>}
                              {act && <Badge variant="outline">Act: {act.name}</Badge>}
                              {cue && <Badge variant="outline">Cue: {cue.name}</Badge>}
                            </div>
                            {position.description && (
                              <p className="text-sm mt-2">{position.description}</p>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPosition(position);
                              setDialogOpen(true);
                            }}
                            data-testid={`button-edit-position-${position.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPositionToDelete(position);
                              setDeleteConfirmOpen(true);
                            }}
                            data-testid={`button-delete-position-${position.id}`}
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
          </>
        )}

        {/* Position Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPosition(null);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPosition ? "Edit" : "Create"} Position</DialogTitle>
              <DialogDescription>
                Define a lineup position with competency requirements
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Aerial Artist A1" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
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
                    control={form.control}
                    name="maxAssignees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Assignees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Unlimited"
                            data-testid="input-max-assignees"
                          />
                        </FormControl>
                        <FormDescription>Leave blank for unlimited</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe this position"
                          rows={3}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {editingPosition ? "Update" : "Create"} Position
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Batch Delete Confirmation */}
        <Dialog open={batchDeleteConfirm} onOpenChange={setBatchDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Batch Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedForBatch.size} position(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBatchDeleteConfirm(false)}
                data-testid="button-cancel-batch-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={batchDeleteMutation.isPending}
                data-testid="button-confirm-batch-delete"
              >
                Delete {selectedForBatch.size} Position(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setPositionToDelete(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this position? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPositionToDelete(null);
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(positionToDelete!.id)}
                disabled={deleteMutation.isPending}
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

  // Detail view - Manage competencies
  const availableCompetencies = competencies.filter(
    (comp) => !positionCompetencies.some((pc) => pc.competencyId === comp.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedPosition(null)}
            className="mb-2"
            data-testid="button-back-to-list"
          >
            ← Back to Positions
          </Button>
          <h1 className="text-3xl font-bold">{selectedPosition.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage required competencies for this position
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Required Competencies</CardTitle>
          <CardDescription>
            Artists must have all these competencies to be assigned to this position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCompetencies ? (
            <p className="text-sm text-muted-foreground">Loading competencies...</p>
          ) : positionCompetencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No competencies required yet</p>
          ) : (
            <div className="space-y-2">
              {positionCompetencies.map((pc) => {
                const competency = competencies.find((c) => c.id === pc.competencyId);
                if (!competency) return null;
                return (
                  <div
                    key={pc.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`competency-${pc.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{competency.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompetencyMutation.mutate(pc.id)}
                      data-testid={`button-remove-competency-${pc.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {availableCompetencies.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">Add Competency</h3>
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) => {
                    addCompetencyMutation.mutate({
                      positionId: selectedPosition.id,
                      competencyId: value,
                    });
                  }}
                  disabled={addCompetencyMutation.isPending}
                >
                  <SelectTrigger className="flex-1" data-testid="select-add-competency">
                    <SelectValue placeholder="Select a competency to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompetencies.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
