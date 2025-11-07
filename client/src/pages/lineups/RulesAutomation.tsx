import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, AlertTriangle, ShieldAlert, Link2 } from "lucide-react";
import type { LineupRule, PositionTrack, TrackPosition, Position, Scene, Act, Cue, Department } from "@shared/schema";

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ruleType: z.enum(['scene_conflict', 'character_exclusion', 'time_conflict', 'custom']),
  severity: z.enum(['hard_block', 'warning']),
  description: z.string().optional(),
  conditionData: z.string().min(1, "Condition data is required"),
  active: z.boolean().optional(),
});

const trackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  autoAssign: z.boolean().optional(),
});

export default function RulesAutomation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rules");

  // Rules state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LineupRule | null>(null);
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<LineupRule | null>(null);

  // Position Tracks state
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<PositionTrack | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<PositionTrack | null>(null);
  const [deleteTrackConfirm, setDeleteTrackConfirm] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<PositionTrack | null>(null);

  // Fetch rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<LineupRule[]>({
    queryKey: ["/api/lineup-rules"],
  });

  // Fetch position tracks
  const { data: tracks = [], isLoading: tracksLoading } = useQuery<PositionTrack[]>({
    queryKey: ["/api/position-tracks"],
  });

  // Rules form
  const ruleForm = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      ruleType: "custom",
      severity: "warning",
      description: "",
      conditionData: "{}",
      active: true,
    },
  });

  // Position Tracks form
  const trackForm = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      name: "",
      description: "",
      autoAssign: true,
    },
  });

  // Rule mutations
  const createRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ruleSchema>) =>
      apiRequest("/api/lineup-rules", "POST", { 
        ...data, 
        active: data.active ? 1 : 0 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineup-rules"] });
      toast({ title: "Rule created successfully" });
      setRuleDialogOpen(false);
      ruleForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create rule", variant: "destructive" });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ruleSchema>) =>
      apiRequest(`/api/lineup-rules/${editingRule!.id}`, "PATCH", { 
        ...data, 
        active: data.active ? 1 : 0 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineup-rules"] });
      toast({ title: "Rule updated successfully" });
      setRuleDialogOpen(false);
      setEditingRule(null);
      ruleForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/lineup-rules/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineup-rules"] });
      toast({ title: "Rule deleted successfully" });
      setDeleteRuleConfirm(false);
      setRuleToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    },
  });

  // Position Track mutations
  const createTrackMutation = useMutation({
    mutationFn: async (data: z.infer<typeof trackSchema>) =>
      apiRequest("/api/position-tracks", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-tracks"] });
      toast({ title: "Position track created successfully" });
      setTrackDialogOpen(false);
      trackForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create position track", variant: "destructive" });
    },
  });

  const updateTrackMutation = useMutation({
    mutationFn: async (data: z.infer<typeof trackSchema>) =>
      apiRequest(`/api/position-tracks/${editingTrack!.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-tracks"] });
      toast({ title: "Position track updated successfully" });
      setTrackDialogOpen(false);
      setEditingTrack(null);
      trackForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update position track", variant: "destructive" });
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/position-tracks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-tracks"] });
      toast({ title: "Position track deleted successfully" });
      setDeleteTrackConfirm(false);
      setTrackToDelete(null);
      if (selectedTrack?.id === trackToDelete?.id) {
        setSelectedTrack(null);
      }
    },
    onError: () => {
      toast({ title: "Failed to delete position track", variant: "destructive" });
    },
  });

  const handleCreateRule = () => {
    setEditingRule(null);
    ruleForm.reset({
      name: "",
      ruleType: "custom",
      severity: "warning",
      description: "",
      conditionData: "{}",
      active: true,
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: LineupRule) => {
    setEditingRule(rule);
    ruleForm.reset({
      name: rule.name,
      ruleType: rule.ruleType as any,
      severity: rule.severity as any,
      description: rule.description || "",
      conditionData: rule.conditionData,
      active: rule.active === 1,
    });
    setRuleDialogOpen(true);
  };

  const handleRuleSubmit = (data: z.infer<typeof ruleSchema>) => {
    if (editingRule) {
      updateRuleMutation.mutate(data);
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleCreateTrack = () => {
    setEditingTrack(null);
    trackForm.reset({
      name: "",
      description: "",
      autoAssign: true,
    });
    setTrackDialogOpen(true);
  };

  const handleEditTrack = (track: PositionTrack) => {
    setEditingTrack(track);
    trackForm.reset({
      name: track.name,
      description: track.description || "",
      autoAssign: track.autoAssign === 1,
    });
    setTrackDialogOpen(true);
  };

  const handleTrackSubmit = (data: z.infer<typeof trackSchema>) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      autoAssign: data.autoAssign ? 1 : 0,
    } as any; // API expects autoAssign as number (0 or 1)
    
    if (editingTrack) {
      updateTrackMutation.mutate(payload);
    } else {
      createTrackMutation.mutate(payload);
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'hard_block' ? (
      <ShieldAlert className="w-4 h-4 text-destructive" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-yellow-600" />
    );
  };

  const getSeverityBadge = (severity: string) => {
    return severity === 'hard_block' ? (
      <Badge variant="destructive" className="capitalize">Hard Block</Badge>
    ) : (
      <Badge variant="outline" className="capitalize border-yellow-600 text-yellow-600">Warning</Badge>
    );
  };

  const getRuleTypeBadge = (ruleType: string) => {
    const typeMap: Record<string, string> = {
      scene_conflict: 'Scene Conflict',
      character_exclusion: 'Character Exclusion',
      time_conflict: 'Time Conflict',
      custom: 'Custom',
    };
    return <Badge variant="secondary">{typeMap[ruleType] || ruleType}</Badge>;
  };

  // Fetch track positions for selected track
  const { data: trackPositions = [] } = useQuery<TrackPosition[]>({
    queryKey: ["/api/position-tracks", selectedTrack?.id, "positions"],
    queryFn: async () => {
      if (!selectedTrack) return [];
      const res = await fetch(`/api/position-tracks/${selectedTrack.id}/positions`);
      if (!res.ok) throw new Error("Failed to fetch track positions");
      return res.json();
    },
    enabled: !!selectedTrack,
  });

  // Fetch all positions
  const { data: allPositions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: !!selectedTrack,
  });

  // Fetch metadata for displaying positions
  const { data: scenes = [] } = useQuery<Scene[]>({
    queryKey: ["/api/scenes"],
    enabled: !!selectedTrack,
  });

  const { data: acts = [] } = useQuery<Act[]>({
    queryKey: ["/api/acts"],
    enabled: !!selectedTrack,
  });

  const { data: cues = [] } = useQuery<Cue[]>({
    queryKey: ["/api/cues"],
    enabled: !!selectedTrack,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: !!selectedTrack,
  });

  // Add position to track mutation
  const addPositionToTrackMutation = useMutation({
    mutationFn: async (positionId: string) =>
      apiRequest(`/api/position-tracks/${selectedTrack!.id}/positions`, "POST", {
        positionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/position-tracks", selectedTrack!.id, "positions"],
      });
      toast({ title: "Position added to track" });
    },
    onError: () => {
      toast({ title: "Failed to add position to track", variant: "destructive" });
    },
  });

  // Remove position from track mutation
  const removePositionFromTrackMutation = useMutation({
    mutationFn: async (trackPositionId: string) =>
      apiRequest(`/api/track-positions/${trackPositionId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/position-tracks", selectedTrack!.id, "positions"],
      });
      toast({ title: "Position removed from track" });
    },
    onError: () => {
      toast({ title: "Failed to remove position from track", variant: "destructive" });
    },
  });

  if (selectedTrack && activeTab === "tracks") {
    // Get positions that are in the track
    const positionsInTrack = allPositions.filter((pos) =>
      trackPositions.some((tp) => tp.positionId === pos.id)
    );

    // Get positions that are not in the track
    const availablePositions = allPositions.filter(
      (pos) => !trackPositions.some((tp) => tp.positionId === pos.id)
    );

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedTrack(null)}
              data-testid="button-back-to-tracks"
            >
              ← Back to Position Tracks
            </Button>
            <h2 className="text-2xl font-bold mt-2" data-testid="text-track-name">
              {selectedTrack.name}
            </h2>
            {selectedTrack.description && (
              <p className="text-muted-foreground">{selectedTrack.description}</p>
            )}
          </div>
          <div>
            {selectedTrack.autoAssign === 1 && (
              <Badge variant="secondary">Auto-Assign Enabled</Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Positions in Track</CardTitle>
              {availablePositions.length > 0 && (
                <Select
                  onValueChange={(positionId) =>
                    addPositionToTrackMutation.mutate(positionId)
                  }
                  disabled={addPositionToTrackMutation.isPending}
                >
                  <SelectTrigger className="w-[250px]" data-testid="select-add-position">
                    <SelectValue placeholder="Add position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePositions.filter(p => p.id).map((position) => (
                      <SelectItem key={position.id} value={String(position.id)}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {positionsInTrack.length === 0 ? (
              <p className="text-muted-foreground">
                No positions in this track yet. Add positions to enable auto-assignment.
              </p>
            ) : (
              <div className="space-y-2">
                {positionsInTrack.map((position) => {
                  const trackPosition = trackPositions.find(
                    (tp) => tp.positionId === position.id
                  );
                  const scene = scenes.find((s) => s.id === position.sceneId);
                  const act = acts.find((a) => a.id === position.actId);
                  const cue = cues.find((c) => c.id === position.cueId);
                  const department = departments.find((d) => d.id === position.departmentId);
                  
                  return (
                    <div
                      key={position.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`track-position-${position.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{position.name}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {scene && (
                            <Badge variant="outline" className="text-xs">
                              Scene: {scene.name}
                            </Badge>
                          )}
                          {act && (
                            <Badge variant="outline" className="text-xs">
                              Act: {act.name}
                            </Badge>
                          )}
                          {cue && (
                            <Badge variant="outline" className="text-xs">
                              Cue: {cue.name}
                            </Badge>
                          )}
                          {department && (
                            <Badge variant="outline" className="text-xs">
                              {department.name}
                            </Badge>
                          )}
                          {position.maxAssignees && (
                            <Badge variant="secondary" className="text-xs">
                              Max: {position.maxAssignees}
                            </Badge>
                          )}
                        </div>
                        {position.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {position.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removePositionFromTrackMutation.mutate(trackPosition!.id)
                        }
                        disabled={removePositionFromTrackMutation.isPending}
                        data-testid={`button-remove-position-${position.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-rules-automation">
          Rules & Automation
        </h1>
        <p className="text-muted-foreground">
          Manage lineup constraints and automated position assignments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules" data-testid="tab-rules">
            Rules
          </TabsTrigger>
          <TabsTrigger value="tracks" data-testid="tab-position-tracks">
            Position Tracks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {rules.length} rule{rules.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleCreateRule} data-testid="button-create-rule">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>

          {rulesLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading rules...</p>
              </CardContent>
            </Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  No rules created yet. Create your first rule to define lineup constraints.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(rule.severity)}
                          <CardTitle className="text-lg" data-testid={`text-rule-name-${rule.id}`}>
                            {rule.name}
                          </CardTitle>
                          {rule.active === 0 && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mb-2">
                          {getSeverityBadge(rule.severity)}
                          {getRuleTypeBadge(rule.ruleType)}
                        </div>
                        {rule.description && (
                          <CardDescription>{rule.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRule(rule)}
                          data-testid={`button-edit-rule-${rule.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRuleToDelete(rule);
                            setDeleteRuleConfirm(true);
                          }}
                          data-testid={`button-delete-rule-${rule.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleCreateTrack} data-testid="button-create-track">
              <Plus className="w-4 h-4 mr-2" />
              Create Position Track
            </Button>
          </div>

          {tracksLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading position tracks...</p>
              </CardContent>
            </Card>
          ) : tracks.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  No position tracks created yet. Create your first track to enable auto-assignment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <Card 
                  key={track.id} 
                  className="cursor-pointer hover-elevate"
                  onClick={() => setSelectedTrack(track)}
                  data-testid={`card-track-${track.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-primary" />
                          <CardTitle className="text-lg" data-testid={`text-track-name-${track.id}`}>
                            {track.name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-2 items-center">
                          {track.autoAssign === 1 && (
                            <Badge variant="secondary">
                              Auto-Assign Enabled
                            </Badge>
                          )}
                          {track.description && (
                            <p className="text-sm text-muted-foreground">{track.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTrack(track);
                          }}
                          data-testid={`button-edit-track-${track.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackToDelete(track);
                            setDeleteTrackConfirm(true);
                          }}
                          data-testid={`button-delete-track-${track.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rule Create/Edit Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Rule" : "Create Rule"}
            </DialogTitle>
            <DialogDescription>
              Define constraints and validations for lineup assignments
            </DialogDescription>
          </DialogHeader>
          <Form {...ruleForm}>
            <form onSubmit={ruleForm.handleSubmit(handleRuleSubmit)} className="space-y-4">
              <FormField
                control={ruleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-rule-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={ruleForm.control}
                  name="ruleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rule-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scene_conflict">Scene Conflict</SelectItem>
                          <SelectItem value="character_exclusion">Character Exclusion</SelectItem>
                          <SelectItem value="time_conflict">Time Conflict</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ruleForm.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rule-severity">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hard_block">Hard Block</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ruleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-rule-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ruleForm.control}
                name="conditionData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition Data (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder='{"key": "value"}'
                        className="font-mono text-sm"
                        data-testid="input-rule-condition-data"
                      />
                    </FormControl>
                    <FormDescription>
                      JSON object defining the rule conditions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ruleForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this rule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-rule-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRuleDialogOpen(false)}
                  data-testid="button-cancel-rule"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  data-testid="button-save-rule"
                >
                  {editingRule ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Position Track Create/Edit Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTrack ? "Edit Position Track" : "Create Position Track"}
            </DialogTitle>
            <DialogDescription>
              Configure automated position assignment tracks
            </DialogDescription>
          </DialogHeader>
          <Form {...trackForm}>
            <form onSubmit={trackForm.handleSubmit(handleTrackSubmit)} className="space-y-4">
              <FormField
                control={trackForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Track Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Pearl Girl Track" data-testid="input-track-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={trackForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-track-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={trackForm.control}
                name="autoAssign"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-Assign</FormLabel>
                      <FormDescription>
                        Automatically assign artists to all positions in this track
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-track-auto-assign"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTrackDialogOpen(false)}
                  data-testid="button-cancel-track"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTrackMutation.isPending || updateTrackMutation.isPending}
                  data-testid="button-save-track"
                >
                  {editingTrack ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation */}
      <Dialog open={deleteRuleConfirm} onOpenChange={(open) => {
        setDeleteRuleConfirm(open);
        if (!open) setRuleToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteRuleConfirm(false);
                setRuleToDelete(null);
              }}
              data-testid="button-cancel-delete-rule"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRuleMutation.mutate(ruleToDelete!.id)}
              disabled={deleteRuleMutation.isPending}
              data-testid="button-confirm-delete-rule"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Position Track Confirmation */}
      <Dialog open={deleteTrackConfirm} onOpenChange={(open) => {
        setDeleteTrackConfirm(open);
        if (!open) setTrackToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this position track? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTrackConfirm(false);
                setTrackToDelete(null);
              }}
              data-testid="button-cancel-delete-track"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTrackMutation.mutate(trackToDelete!.id)}
              disabled={deleteTrackMutation.isPending}
              data-testid="button-confirm-delete-track"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
