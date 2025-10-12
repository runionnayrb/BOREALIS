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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface DepartmentLeadSelectorProps {
  departmentId: string;
  departmentName: string;
  leadTechnicianId: string | null;
  onUpdateLead: (value: string | null) => void;
  onRemove: () => void;
}

function DepartmentLeadSelector({ 
  departmentId, 
  departmentName, 
  leadTechnicianId, 
  onUpdateLead, 
  onRemove 
}: DepartmentLeadSelectorProps) {
  const { data: deptTechnicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/departments", departmentId, "technicians"],
    queryFn: async () => {
      const res = await fetch(`/api/departments/${departmentId}/technicians`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`Failed to fetch technicians for department ${departmentId}`);
      return res.json();
    }
  });

  const sortedTechnicians = [...deptTechnicians].sort((a, b) => 
    (a.technicianName || `${a.firstName} ${a.lastName}`).localeCompare(
      b.technicianName || `${b.firstName} ${b.lastName}`
    )
  );

  return (
    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
      <div className="flex-1 space-y-1">
        <div className="text-sm font-medium">{departmentName}</div>
        <Select
          value={leadTechnicianId || "none"}
          onValueChange={(value) => onUpdateLead(value === "none" ? null : value)}
        >
          <SelectTrigger className="h-8 text-xs" data-testid={`select-lead-tech-${departmentId}`}>
            <SelectValue placeholder="Select lead technician" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No lead assigned</SelectItem>
            {sortedTechnicians.map(tech => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.technicianName || `${tech.firstName} ${tech.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onRemove}
        data-testid={`button-remove-department-${departmentId}`}
      >
        ×
      </Button>
    </div>
  );
}

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
  const [customName, setCustomName] = useState("");
  const [trainingNameComboOpen, setTrainingNameComboOpen] = useState(false);
  const [trainingNameInput, setTrainingNameInput] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedStageManagerId, setSelectedStageManagerId] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:30");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [actDepartmentIds, setActDepartmentIds] = useState<string[]>([]);
  const [actArtistIds, setActArtistIds] = useState<string[]>([]);
  const [trainingAssignments, setTrainingAssignments] = useState<DepartmentAssignment[]>([]);

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
      
      // Set the display input value
      if (editingTraining.customName) {
        setTrainingNameInput(editingTraining.customName);
        setCustomName(editingTraining.customName);
      } else if (value) {
        // Find and display the scene/act name
        const isScene = value.startsWith("scene-");
        if (isScene) {
          const sceneId = value.replace("scene-", "");
          const scene = scenes.find(s => s.id === sceneId);
          if (scene) setTrainingNameInput(scene.name);
        } else {
          const act = acts.find(a => a.id === value);
          if (act) setTrainingNameInput(act.name);
        }
      }
      
      // Fetch training locations
      fetch(`/api/trainings/${editingTraining.id}/locations`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(trainingLocations => {
          const locationIds = trainingLocations.map((tl: any) => {
            const location = locations.find(l => l.id === tl.locationId);
            // Convert FULL STAGE to special value
            if (location?.name === "FULL STAGE") {
              return "FULL_STAGE";
            }
            return tl.locationId;
          });
          setSelectedLocationIds(locationIds);
        })
        .catch(err => console.error("Error loading training locations:", err));

      // Fetch training artists
      fetch(`/api/trainings/${editingTraining.id}/artists`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(trainingArtists => {
          setActArtistIds(trainingArtists.map((ta: any) => ta.artistId));
        })
        .catch(err => console.error("Error loading training artists:", err));

      // Fetch training departments (via assignments)
      fetch(`/api/trainings/${editingTraining.id}/assignments`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(assignments => {
          setTrainingAssignments(assignments);
          setActDepartmentIds(assignments.map((a: any) => a.departmentId));
        })
        .catch(err => console.error("Error loading training assignments:", err));
      
      setStartTime(editingTraining.startTime);
      setEndTime(editingTraining.endTime);
      setTrainingNotes(editingTraining.notes || "");
      setCustomName(editingTraining.customName || "");
      setSelectedStageManagerId(editingTraining.stageManagerId || "");
      setShowAddTraining(true);
    }
  }, [editingTraining, locations, scenes, acts]);

  // Fetch departments and artists when scene or act is selected (only when creating, not editing)
  useEffect(() => {
    if (selectedActId && !editingTraining) {
      const isScene = selectedActId.startsWith("scene-");
      const id = isScene ? selectedActId.replace("scene-", "") : selectedActId;
      const departmentEndpoint = isScene ? `/api/scenes/${id}/departments` : `/api/acts/${id}/departments`;
      const artistEndpoint = isScene ? `/api/scenes/${id}/artists` : `/api/acts/${id}/artists`;
      
      // Fetch departments
      fetch(departmentEndpoint, {
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

      // Fetch artists
      fetch(artistEndpoint, {
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
          setActArtistIds(data.map((item: any) => item.artistId));
        })
        .catch(err => {
          console.error("Error loading artists:", err);
          setActArtistIds([]);
        });
    } else {
      setActDepartmentIds([]);
      setActArtistIds([]);
    }
  }, [selectedActId]);

  const createReportMutation = useMutation({
    mutationFn: async (data: { date: string; notes: string; stageManagerOnDuty: string }) => {
      return await apiRequest<Report>('POST', '/api/reports', data);
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
      return await apiRequest<Report>('PATCH', `/api/reports/${reportId}`, data);
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
      const training = await apiRequest<Training>('POST', '/api/trainings', data);
      
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
    onSuccess: (training) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', training.reportId, 'trainings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: "Training added successfully" });
      setShowAddTraining(false);
      setEditingTraining(null);
      setSelectedActId("");
      setCustomName("");
      setTrainingNameInput("");
      setSelectedLocationIds([]);
      setSelectedStageManagerId("");
      setStartTime("14:00");
      setEndTime("16:30");
      setTrainingNotes("");
      setActDepartmentIds([]);
      setActArtistIds([]);
      setTrainingAssignments([]);
    },
    onError: () => {
      toast({ title: "Failed to add training", variant: "destructive" });
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest<Training>('PATCH', `/api/trainings/${editingTraining!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId, 'trainings'] });
      toast({ title: "Training updated successfully" });
      setShowAddTraining(false);
      setEditingTraining(null);
      setSelectedActId("");
      setCustomName("");
      setTrainingNameInput("");
      setSelectedLocationIds([]);
      setSelectedStageManagerId("");
      setStartTime("14:00");
      setEndTime("16:30");
      setTrainingNotes("");
      setActDepartmentIds([]);
      setActArtistIds([]);
      setTrainingAssignments([]);
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

  const handleRemoveDepartment = async (departmentId: string) => {
    const assignment = trainingAssignments.find(a => a.departmentId === departmentId);
    if (!assignment) return;
    
    try {
      await apiRequest('DELETE', `/api/assignments/${assignment.id}`);
      setTrainingAssignments(trainingAssignments.filter(a => a.id !== assignment.id));
      setActDepartmentIds(actDepartmentIds.filter(id => id !== departmentId));
      queryClient.invalidateQueries({ queryKey: ['/api/trainings', editingTraining?.id, 'assignments'] });
      toast({ title: "Department removed successfully" });
    } catch (error) {
      toast({ title: "Failed to remove department", variant: "destructive" });
    }
  };

  const handleUpdateLeadTechnician = async (departmentId: string, leadTechnicianId: string | null) => {
    const assignment = trainingAssignments.find(a => a.departmentId === departmentId);
    if (!assignment) return;
    
    try {
      await apiRequest('PATCH', `/api/assignments/${assignment.id}`, {
        leadTechnicianId,
      });
      
      // Update local state
      setTrainingAssignments(trainingAssignments.map(a => 
        a.id === assignment.id ? { ...a, leadTechnicianId } : a
      ));
      
      queryClient.invalidateQueries({ queryKey: ['/api/trainings', editingTraining?.id, 'assignments'] });
      toast({ title: "Lead technician updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update lead technician", variant: "destructive" });
    }
  };

  const handleSubmitTraining = async () => {
    if (!selectedActId) {
      toast({ title: "Please select a scene or act", variant: "destructive" });
      return;
    }

    // Auto-create or fetch the report if it doesn't exist yet
    let currentReportId = reportId;
    if (!reportId && !editingTraining) {
      try {
        // First check if a report exists for this date
        const existingReportRes = await fetch(`/api/reports/date/${reportDate}`, {
          credentials: 'include',
        });
        const existingReport = await existingReportRes.json();
        
        if (existingReport) {
          // Use the existing report
          currentReportId = existingReport.id;
          toast({ title: "Using existing report for this date" });
          // Navigate to the existing report
          setLocation(`/report/${existingReport.id}`);
        } else {
          // Create a new report
          const newReport = await createReportMutation.mutateAsync({
            date: reportDate,
            notes: content,
            stageManagerOnDuty,
          });
          currentReportId = newReport.id;
        }
      } catch (error) {
        toast({ title: "Failed to get or create report", variant: "destructive" });
        return;
      }
    }

    const finalLocationIds: string[] = [];
    
    // Process each selected location
    for (const locationId of selectedLocationIds) {
      if (locationId === "FULL_STAGE") {
        // Find or create the FULL STAGE location
        let fullStageLocation = locations.find(l => l.name === "FULL STAGE");
        
        if (!fullStageLocation) {
          // Create the FULL STAGE location
          try {
            fullStageLocation = await apiRequest('POST', '/api/locations', {
              name: "FULL STAGE",
              locationTypeId: null,
              sortOrder: -1, // Sort first in the list
            });
            // Invalidate locations cache to update the list
            queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
          } catch (error) {
            toast({ title: "Failed to create FULL STAGE location", variant: "destructive" });
            return;
          }
        }
        
        if (fullStageLocation) {
          finalLocationIds.push(fullStageLocation.id);
        }
      } else {
        finalLocationIds.push(locationId);
      }
    }

    // Determine if scene or act is selected
    const isScene = selectedActId.startsWith("scene-");
    const sceneId = isScene ? selectedActId.replace("scene-", "") : null;
    const actId = isScene ? null : selectedActId;

    const duration = calculateDuration();
    const trainingData = {
      reportId: currentReportId || editingTraining?.reportId,
      sceneId: sceneId || undefined,
      actId: actId || undefined,
      customName: customName || undefined,
      locationIds: finalLocationIds,
      artistIds: actArtistIds,
      stageManagerId: selectedStageManagerId || undefined,
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
          {report && (
            <div className="text-sm text-muted-foreground">
              Last updated by {getCreatorName(report.updatedBy)} on {new Date(report.updatedAt).toLocaleString()}
            </div>
          )}
          
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Training Sessions</h2>
              <Dialog open={showAddTraining} onOpenChange={(open) => {
                setShowAddTraining(open);
                if (!open) {
                  setEditingTraining(null);
                  setSelectedActId("");
                  setCustomName("");
                  setTrainingNameInput("");
                  setSelectedLocationIds([]);
                  setSelectedStageManagerId("");
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
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTraining ? "Edit Training Session" : "Add Training Session"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Training Name</Label>
                        <Popover open={trainingNameComboOpen} onOpenChange={setTrainingNameComboOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={trainingNameComboOpen}
                              className="w-full justify-between font-normal"
                              data-testid="select-training-name"
                            >
                              {trainingNameInput || "Select a scene/act or type custom name..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command className="h-auto">
                              <CommandInput 
                                placeholder="Search or type custom name..." 
                                value={trainingNameInput}
                                onValueChange={(value) => {
                                  setTrainingNameInput(value);
                                  // When user types, set as custom name but keep any selected act
                                  // Custom name will be used for display, but act provides departments/artists
                                  setCustomName(value);
                                }}
                                data-testid="input-training-name"
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-2 px-2 text-sm text-muted-foreground">
                                    No scenes/acts match "{trainingNameInput}". Select a scene/act below, then you can type a custom display name.
                                  </div>
                                </CommandEmpty>
                                <CommandGroup heading="Scenes & Acts">
                                  {[...scenes].sort((a, b) => {
                                    // Put FULL SHOW and RESCUE SCENARIOS at the bottom
                                    const aIsFullShow = a.name === "FULL SHOW";
                                    const bIsFullShow = b.name === "FULL SHOW";
                                    const aIsRescue = a.name === "RESCUE SCENARIOS";
                                    const bIsRescue = b.name === "RESCUE SCENARIOS";
                                    
                                    // RESCUE SCENARIOS is last
                                    if (aIsRescue && !bIsRescue) return 1;
                                    if (!aIsRescue && bIsRescue) return -1;
                                    
                                    // FULL SHOW is second to last
                                    if (aIsFullShow && !bIsFullShow && !bIsRescue) return 1;
                                    if (!aIsFullShow && bIsFullShow && !aIsRescue) return -1;
                                    
                                    return a.sortOrder - b.sortOrder;
                                  }).map((scene) => {
                                    const sceneActs = acts.filter(a => a.sceneId === scene.id);
                                    if (sceneActs.length === 0) return null;
                                    return (
                                      <div key={scene.id}>
                                        <CommandItem
                                          value={scene.name}
                                          onSelect={() => {
                                            setTrainingNameInput(scene.name);
                                            setSelectedActId(`scene-${scene.id}`);
                                            setCustomName("");
                                            setTrainingNameComboOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedActId === `scene-${scene.id}` ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {scene.name}
                                        </CommandItem>
                                        {sceneActs.map((act) => (
                                          <CommandItem
                                            key={act.id}
                                            value={act.name}
                                            onSelect={() => {
                                              setTrainingNameInput(act.name);
                                              setSelectedActId(act.id);
                                              setCustomName("");
                                              setTrainingNameComboOpen(false);
                                            }}
                                            className="pl-8"
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedActId === act.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {act.name}
                                          </CommandItem>
                                        ))}
                                      </div>
                                    );
                                  })}
                                  {/* Acts without a scene */}
                                  {acts.filter(a => !a.sceneId).length > 0 && (
                                    <>
                                      {acts.filter(a => !a.sceneId).map((act) => (
                                        <CommandItem
                                          key={act.id}
                                          value={act.name}
                                          onSelect={() => {
                                            setTrainingNameInput(act.name);
                                            setSelectedActId(act.id);
                                            setCustomName("");
                                            setTrainingNameComboOpen(false);
                                          }}
                                          className="pl-8"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedActId === act.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {act.name}
                                        </CommandItem>
                                      ))}
                                    </>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          Select a scene/act, then optionally type a custom display name
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Locations (Multiple)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="select-locations">
                              {selectedLocationIds.length > 0 ? (
                                <span className="truncate">
                                  {selectedLocationIds.map(id => {
                                    if (id === "FULL_STAGE") return "FULL STAGE";
                                    const loc = locations.find(l => l.id === id);
                                    return loc?.name;
                                  }).join(", ")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select locations...</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                              {/* FULL STAGE option */}
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="location-FULL_STAGE"
                                  checked={selectedLocationIds.includes("FULL_STAGE")}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedLocationIds([...selectedLocationIds, "FULL_STAGE"]);
                                    } else {
                                      setSelectedLocationIds(selectedLocationIds.filter(id => id !== "FULL_STAGE"));
                                    }
                                  }}
                                  data-testid="checkbox-location-FULL_STAGE"
                                />
                                <label htmlFor="location-FULL_STAGE" className="text-sm font-semibold cursor-pointer">
                                  FULL STAGE (All Onstage Areas)
                                </label>
                              </div>
                              
                              {/* Location types */}
                              {locationTypes.map((type) => {
                                const typeLocations = locations.filter(l => l.locationTypeId === type.id);
                                if (typeLocations.length === 0) return null;
                                return (
                                  <div key={type.id} className="space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">{type.name}</div>
                                    {typeLocations.map((location) => (
                                      <div key={location.id} className="flex items-center space-x-2 pl-4">
                                        <Checkbox
                                          id={`location-${location.id}`}
                                          checked={selectedLocationIds.includes(location.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedLocationIds([...selectedLocationIds, location.id]);
                                            } else {
                                              setSelectedLocationIds(selectedLocationIds.filter(id => id !== location.id));
                                            }
                                          }}
                                        />
                                        <label htmlFor={`location-${location.id}`} className="text-sm cursor-pointer">
                                          {location.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                              
                              {/* Locations without type */}
                              {locations.filter(l => !l.locationTypeId && l.name !== "FULL STAGE").length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-muted-foreground uppercase">Other</div>
                                  {locations.filter(l => !l.locationTypeId && l.name !== "FULL STAGE").map((location) => (
                                    <div key={location.id} className="flex items-center space-x-2 pl-4">
                                      <Checkbox
                                        id={`location-${location.id}`}
                                        checked={selectedLocationIds.includes(location.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedLocationIds([...selectedLocationIds, location.id]);
                                          } else {
                                            setSelectedLocationIds(selectedLocationIds.filter(id => id !== location.id));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`location-${location.id}`} className="text-sm cursor-pointer">
                                        {location.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Stage Manager</Label>
                        <Select value={selectedStageManagerId || "none"} onValueChange={(value) => setSelectedStageManagerId(value === "none" ? "" : value)}>
                          <SelectTrigger data-testid="select-stage-manager">
                            <SelectValue placeholder="Select stage manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No stage manager</SelectItem>
                            {activeUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
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
                      <RichTextEditor
                        content={trainingNotes}
                        onChange={setTrainingNotes}
                      />
                    </div>

                    {editingTraining && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-sm">Customize Assignments</h3>
                        <p className="text-sm text-muted-foreground">
                          Remove artists or departments that don't apply to this specific training session.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Artists ({actArtistIds.length})</Label>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {actArtistIds.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No artists assigned</div>
                              ) : (
                                actArtistIds.map(artistId => {
                                  const artist = artists.find(a => a.id === artistId);
                                  if (!artist) return null;
                                  return (
                                    <div key={artistId} className="flex items-center justify-between p-2 rounded hover-elevate">
                                      <div className="text-sm">
                                        <div>{`${artist.firstName} ${artist.lastName}`}</div>
                                        {artist.role && <div className="text-xs text-muted-foreground">{artist.role}</div>}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setActArtistIds(actArtistIds.filter(id => id !== artistId))}
                                        data-testid={`button-remove-artist-${artistId}`}
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Departments ({actDepartmentIds.length})</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {actDepartmentIds.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No departments assigned</div>
                              ) : (
                                actDepartmentIds
                                  .map(deptId => ({ id: deptId, dept: departments.find(d => d.id === deptId) }))
                                  .filter(({ dept }) => dept !== undefined)
                                  .sort((a, b) => a.dept!.name.localeCompare(b.dept!.name))
                                  .map(({ id: deptId, dept }) => (
                                    <DepartmentLeadSelector
                                      key={deptId}
                                      departmentId={deptId}
                                      departmentName={dept!.name}
                                      leadTechnicianId={trainingAssignments.find(a => a.departmentId === deptId)?.leadTechnicianId || null}
                                      onUpdateLead={(value) => handleUpdateLeadTechnician(deptId, value)}
                                      onRemove={() => handleRemoveDepartment(deptId)}
                                    />
                                  ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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

          <section>
            <h2 className="text-xl font-semibold mb-4">General Notes</h2>
            <RichTextEditor
              content={content}
              onChange={setContent}
              minHeight="min-h-32"
            />
          </section>
        </div>
      </main>
    </div>
  );
}
