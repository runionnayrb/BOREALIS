import { useState, useEffect } from "react";
import { ArrowLeft, Download, Plus, Save, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/RichTextEditor";
import TrainingCard from "@/components/TrainingCard";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, Training, Scene, Act, Department, LocationType, Location, Artist, Technician, DepartmentAssignment, SafeUser } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ReportEditor() {
  const params = useParams();
  const reportId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [stageManagerOnDuty, setStageManagerOnDuty] = useState("");
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  
  const [selectedActId, setSelectedActId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:30");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [actDepartmentIds, setActDepartmentIds] = useState<string[]>([]);

  const { data: report, isLoading: reportLoading } = useQuery<Report>({
    queryKey: ['/api/reports', reportId!],
    enabled: !!reportId,
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<Training[]>({
    queryKey: ['/api/reports', reportId!, 'trainings'],
    enabled: !!reportId,
  });

  const { data: scenes = [] } = useQuery<Scene[]>({ queryKey: ['/api/scenes'] });
  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ['/api/acts'] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ['/api/departments'] });
  const { data: locationTypes = [] } = useQuery<LocationType[]>({ queryKey: ['/api/location-types'] });
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ['/api/locations'] });
  const { data: artists = [] } = useQuery<Artist[]>({ queryKey: ['/api/artists'] });
  const { data: technicians = [] } = useQuery<Technician[]>({ queryKey: ['/api/technicians'] });
  const { data: users = [] } = useQuery<SafeUser[]>({ queryKey: ['/api/users'] });
  
  // Filter active users for SM on Duty dropdown
  const activeUsers = users.filter(user => user.active === 1);

  useEffect(() => {
    if (report) {
      setContent(report.notes || "");
      setReportDate(report.date);
      setStageManagerOnDuty(report.stageManagerOnDuty || "");
    }
  }, [report]);

  // Load training data when editing
  useEffect(() => {
    if (editingTraining) {
      // Determine if it's a scene or act training
      const value = editingTraining.sceneId 
        ? `scene-${editingTraining.sceneId}` 
        : editingTraining.actId || "";
      
      setSelectedActId(value);
      setSelectedLocationId(editingTraining.locationId || "");
      setStartTime(editingTraining.startTime);
      setEndTime(editingTraining.endTime);
      setTrainingNotes(editingTraining.notes || "");
      setShowAddTraining(true);
    }
  }, [editingTraining]);

  // Fetch departments when scene or act is selected
  useEffect(() => {
    if (selectedActId) {
      const isScene = selectedActId.startsWith("scene-");
      const id = isScene ? selectedActId.replace("scene-", "") : selectedActId;
      const endpoint = isScene ? `/api/scenes/${id}/departments` : `/api/acts/${id}/departments`;
      
      fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
        .then(async res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          return res.json();
        })
        .then(data => {
          setActDepartmentIds(data.map((item: any) => item.departmentId));
        })
        .catch(err => {
          console.error("Error loading departments:", err);
          setActDepartmentIds([]);
        });
    } else {
      setActDepartmentIds([]);
    }
  }, [selectedActId]);

  const createReportMutation = useMutation({
    mutationFn: async (data: { date: string; notes: string; stageManagerOnDuty: string }) => {
      const res = await apiRequest('POST', '/api/reports', data);
      return await res.json() as Report;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: "Report created successfully" });
      setLocation(`/report/${newReport.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create report", variant: "destructive" });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async (data: { notes: string; stageManagerOnDuty: string }) => {
      const res = await apiRequest('PATCH', `/api/reports/${reportId}`, data);
      return await res.json() as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId] });
      toast({ title: "Report saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save report", variant: "destructive" });
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/trainings', data);
      const training = await res.json() as Training;
      
      // Auto-create department assignments for the act's required departments
      if (actDepartmentIds.length > 0) {
        for (const departmentId of actDepartmentIds) {
          await apiRequest('POST', `/api/trainings/${training.id}/assignments`, {
            departmentId,
            leadTechnicianId: null,
            notes: "",
          });
        }
      }
      
      return training;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId, 'trainings'] });
      toast({ title: "Training added successfully" });
      setShowAddTraining(false);
      setEditingTraining(null);
      setSelectedActId("");
      setSelectedLocationId("");
      setStartTime("14:00");
      setEndTime("16:30");
      setTrainingNotes("");
      setActDepartmentIds([]);
    },
    onError: () => {
      toast({ title: "Failed to add training", variant: "destructive" });
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PATCH', `/api/trainings/${editingTraining!.id}`, data);
      return await res.json() as Training;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId, 'trainings'] });
      toast({ title: "Training updated successfully" });
      setShowAddTraining(false);
      setEditingTraining(null);
      setSelectedActId("");
      setSelectedLocationId("");
      setStartTime("14:00");
      setEndTime("16:30");
      setTrainingNotes("");
      setActDepartmentIds([]);
    },
    onError: () => {
      toast({ title: "Failed to update training", variant: "destructive" });
    },
  });

  const handleSaveReport = async () => {
    if (reportId) {
      updateReportMutation.mutate({
        notes: content,
        stageManagerOnDuty,
      });
    } else {
      createReportMutation.mutate({
        date: reportDate,
        notes: content,
        stageManagerOnDuty,
      });
    }
  };

  const handleSubmitTraining = async () => {
    if (!reportId && !editingTraining) {
      toast({ title: "Please save the report first", variant: "destructive" });
      return;
    }

    let finalLocationId = selectedLocationId;
    
    // Handle FULL_STAGE special case
    if (selectedLocationId === "FULL_STAGE") {
      // Find or create the FULL STAGE location
      let fullStageLocation = locations.find(l => l.name === "FULL STAGE");
      
      if (!fullStageLocation) {
        // Create the FULL STAGE location
        try {
          const res = await apiRequest('POST', '/api/locations', {
            name: "FULL STAGE",
            locationTypeId: null,
            sortOrder: -1, // Sort first in the list
          });
          fullStageLocation = await res.json();
          // Invalidate locations cache to update the list
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
        } catch (error) {
          toast({ title: "Failed to create FULL STAGE location", variant: "destructive" });
          return;
        }
      }
      
      if (fullStageLocation) {
        finalLocationId = fullStageLocation.id;
      }
    }

    // Determine if scene or act is selected
    const isScene = selectedActId.startsWith("scene-");
    const sceneId = isScene ? selectedActId.replace("scene-", "") : null;
    const actId = isScene ? null : selectedActId;

    const duration = calculateDuration();
    const trainingData = {
      reportId: reportId || editingTraining?.reportId,
      sceneId: sceneId || undefined,
      actId: actId || undefined,
      locationId: finalLocationId || null,
      startTime,
      endTime,
      durationMinutes: duration,
      notes: trainingNotes,
    };

    if (editingTraining) {
      updateTrainingMutation.mutate(trainingData);
    } else {
      createTrainingMutation.mutate(trainingData);
    }
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
  };

  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return totalMinutes;
  };

  const getCreatorName = (userId: string | null) => {
    if (!userId) return "Unknown";
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || "Unknown";
  };

  if (reportLoading || trainingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="max-w-[200px]"
              disabled={!!reportId}
              data-testid="input-report-date"
            />
            <div className="flex items-center gap-2 flex-1">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">SM on Duty:</Label>
              <Select
                value={stageManagerOnDuty}
                onValueChange={setStageManagerOnDuty}
              >
                <SelectTrigger className="max-w-[250px]" data-testid="select-sm-on-duty">
                  <SelectValue placeholder="Select stage manager" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.name || user.email}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                  {activeUsers.length === 0 && (
                    <SelectItem value="no-users" disabled>
                      No active users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveReport}
            disabled={createReportMutation.isPending || updateReportMutation.isPending}
            data-testid="button-save-report"
          >
            {(createReportMutation.isPending || updateReportMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-foreground" />
            ) : (
              <Save className="h-4 w-4 mr-2 text-primary-foreground" />
            )}
            {reportId ? "Save" : "Create Report"}
          </Button>
          <Button variant="outline" data-testid="button-export-pdf">
            <Download className="h-4 w-4 mr-2 text-foreground" />
            Export PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Report Notes</h2>
              {report && (
                <div className="text-sm text-muted-foreground">
                  Last updated by {getCreatorName(report.updatedBy)} on {new Date(report.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Training Sessions</h2>
              <Dialog open={showAddTraining} onOpenChange={(open) => {
                setShowAddTraining(open);
                if (!open) {
                  setEditingTraining(null);
                  setSelectedActId("");
                  setSelectedLocationId("");
                  setStartTime("14:00");
                  setEndTime("16:30");
                  setTrainingNotes("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-training">
                    <Plus className="h-4 w-4 mr-2 text-primary-foreground" />
                    Add Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingTraining ? "Edit Training Session" : "Add Training Session"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Scene / Act</Label>
                        <Select value={selectedActId} onValueChange={setSelectedActId}>
                          <SelectTrigger data-testid="select-act">
                            <SelectValue placeholder="Select scene or act" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenes.map((scene) => {
                              const sceneActs = acts.filter(a => a.sceneId === scene.id);
                              if (sceneActs.length === 0) return null;
                              return (
                                <SelectGroup key={scene.id}>
                                  <SelectItem value={`scene-${scene.id}`}>
                                    {scene.name}
                                  </SelectItem>
                                  {sceneActs.map((act) => (
                                    <SelectItem key={act.id} value={act.id} className="pl-12">
                                      {act.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              );
                            })}
                            {/* Acts without a scene */}
                            {acts.filter(a => !a.sceneId).length > 0 && (
                              <SelectGroup>
                                <SelectLabel>No Scene</SelectLabel>
                                {acts.filter(a => !a.sceneId).map((act) => (
                                  <SelectItem key={act.id} value={act.id} className="pl-12">
                                    {act.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Special FULL STAGE option */}
                            <SelectItem value="FULL_STAGE" className="font-semibold">
                              FULL STAGE (All Onstage Areas)
                            </SelectItem>
                            
                            {locationTypes.map((type) => {
                              const typeLocations = locations.filter(l => l.locationTypeId === type.id);
                              if (typeLocations.length === 0) return null;
                              return (
                                <SelectGroup key={type.id}>
                                  <SelectLabel>{type.name}</SelectLabel>
                                  {typeLocations.map((location) => (
                                    <SelectItem key={location.id} value={location.id} className="pl-12">
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              );
                            })}
                            {/* Locations without a type (excluding FULL STAGE which is shown at top) */}
                            {locations.filter(l => !l.locationTypeId && l.name !== "FULL STAGE").length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Other</SelectLabel>
                                {locations.filter(l => !l.locationTypeId && l.name !== "FULL STAGE").map((location) => (
                                  <SelectItem key={location.id} value={location.id} className="pl-12">
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          data-testid="input-start-time"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          data-testid="input-end-time"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={`${calculateDuration()} min`}
                          disabled
                          data-testid="text-duration"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Training Notes</Label>
                      <Textarea
                        value={trainingNotes}
                        onChange={(e) => setTrainingNotes(e.target.value)}
                        placeholder="Add any notes about this training session..."
                        rows={4}
                        data-testid="textarea-training-notes"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddTraining(false)}
                        data-testid="button-cancel-training"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitTraining}
                        disabled={createTrainingMutation.isPending || updateTrainingMutation.isPending || !selectedActId}
                        data-testid="button-confirm-training"
                      >
                        {(createTrainingMutation.isPending || updateTrainingMutation.isPending) && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-foreground" />
                        )}
                        {editingTraining ? "Update Training" : "Add Training"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {trainings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No training sessions added yet. Click "Add Training" to get started.
                </div>
              ) : (
                trainings.map((training) => (
                  <TrainingCard
                    key={training.id}
                    training={training}
                    scenes={scenes}
                    acts={acts}
                    locations={locations}
                    departments={departments}
                    artists={artists}
                    technicians={technicians}
                    users={users}
                    onEdit={handleEditTraining}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
