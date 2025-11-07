import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Award, Calendar } from "lucide-react";
import type { Competency, Scene, Act, Cue } from "@shared/schema";

const competencySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sceneId: z.string().min(1).optional().or(z.literal(undefined)),
  actId: z.string().min(1).optional().or(z.literal(undefined)),
  cueId: z.string().min(1).optional().or(z.literal(undefined)),
  description: z.string().optional(),
  expirationDays: z.coerce.number().min(1, "Must be at least 1 day").default(90),
});

export default function Competencies() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [competencyToDelete, setCompetencyToDelete] = useState<string | null>(null);

  // Fetch data
  const { data: competencies = [], isLoading } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
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

  // Form
  const form = useForm<z.infer<typeof competencySchema>>({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      name: "",
      sceneId: undefined,
      actId: undefined,
      cueId: undefined,
      description: "",
      expirationDays: 90,
    },
  });

  // Reset form when editing
  useEffect(() => {
    if (editingCompetency) {
      form.reset({
        name: editingCompetency.name,
        sceneId: editingCompetency.sceneId || undefined,
        actId: editingCompetency.actId || undefined,
        cueId: editingCompetency.cueId || undefined,
        description: editingCompetency.description || "",
        expirationDays: editingCompetency.expirationDays,
      });
    } else {
      form.reset({
        name: "",
        sceneId: undefined,
        actId: undefined,
        cueId: undefined,
        description: "",
        expirationDays: 90,
      });
    }
  }, [editingCompetency, form]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        description: data.description || null,
      };
      return apiRequest("POST", "/api/competencies", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      toast({ title: "Competency created successfully" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create competency", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        sceneId: data.sceneId || null,
        actId: data.actId || null,
        cueId: data.cueId || null,
        description: data.description || null,
      };
      return apiRequest("PATCH", `/api/competencies/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      toast({ title: "Competency updated successfully" });
      setDialogOpen(false);
      setEditingCompetency(null);
    },
    onError: () => {
      toast({ title: "Failed to update competency", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/competencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      toast({ title: "Competency deleted successfully" });
      setDeleteConfirmOpen(false);
      setCompetencyToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete competency", variant: "destructive" });
    },
  });

  const handleSubmit = (values: z.infer<typeof competencySchema>) => {
    if (editingCompetency) {
      updateMutation.mutate({ id: editingCompetency.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = () => {
    if (competencyToDelete) {
      deleteMutation.mutate(competencyToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading competencies...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competencies</h1>
          <p className="text-muted-foreground mt-1">
            Manage artist qualifications and competency requirements
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCompetency(null);
            setDialogOpen(true);
          }}
          data-testid="button-add-competency"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Competency
        </Button>
      </div>

      {competencies.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No competencies defined yet. Create your first competency to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((competency) => {
                return (
                  <TableRow key={competency.id} data-testid={`competency-row-${competency.id}`}>
                    <TableCell className="font-medium">{competency.name}</TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {competency.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {competency.expirationDays} days
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCompetency(competency);
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-competency-${competency.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCompetencyToDelete(competency.id);
                            setDeleteConfirmOpen(true);
                          }}
                          data-testid={`button-delete-competency-${competency.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setEditingCompetency(null);
      }}>
        <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingCompetency ? "Edit" : "Create"} Competency</DialogTitle>
            <DialogDescription>
              Define an artist qualification that can be earned through training programs
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competency Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Hair Hanging - Validated" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sceneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scene</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-scene">
                            <SelectValue placeholder="Select scene" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-act">
                            <SelectValue placeholder="Select act" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cue">
                            <SelectValue placeholder="Select cue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                        placeholder="Describe what this competency qualifies the artist to do"
                        rows={3}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Period (days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        data-testid="input-expiration-days"
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days until this competency expires and requires revalidation (default: 90 days)
                    </FormDescription>
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
                  {editingCompetency ? "Update" : "Create"} Competency
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this competency? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCompetencyToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
