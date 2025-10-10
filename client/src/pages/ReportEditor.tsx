import { useState, useEffect } from "react";
import { ArrowLeft, Download, Plus, Save, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/RichTextEditor";
import TrainingCard from "@/components/TrainingCard";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, Training, Act, Department, Location, Artist, Technician, DepartmentAssignment, SafeUser } from "@shared/schema";
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
  SelectItem,
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
  
  const [selectedActId, setSelectedActId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:30");
  const [trainingNotes, setTrainingNotes] = useState("");

  const { data: report, isLoading: reportLoading } = useQuery<Report>({
    queryKey: ['/api/reports', reportId!],
    enabled: !!reportId,
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<Training[]>({
    queryKey: ['/api/reports', reportId!, 'trainings'],
    enabled: !!reportId,
  });

  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ['/api/acts'] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ['/api/departments'] });
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
      return await res.json() as Training;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId, 'trainings'] });
      toast({ title: "Training added successfully" });
      setShowAddTraining(false);
      setSelectedActId("");
      setSelectedLocationId("");
      setStartTime("14:00");
      setEndTime("16:30");
      setTrainingNotes("");
    },
    onError: () => {
      toast({ title: "Failed to add training", variant: "destructive" });
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

  const handleAddTraining = () => {
    if (!reportId) {
      toast({ title: "Please save the report first", variant: "destructive" });
      return;
    }

    const duration = calculateDuration();
    createTrainingMutation.mutate({
      reportId,
      actId: selectedActId,
      locationId: selectedLocationId || null,
      startTime,
      endTime,
      durationMinutes: duration,
      notes: trainingNotes,
    });
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
              <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-training">
                    <Plus className="h-4 w-4 mr-2 text-primary-foreground" />
                    Add Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Training Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Act</Label>
                        <Select value={selectedActId} onValueChange={setSelectedActId}>
                          <SelectTrigger data-testid="select-act">
                            <SelectValue placeholder="Select act" />
                          </SelectTrigger>
                          <SelectContent>
                            {acts.map((act) => (
                              <SelectItem key={act.id} value={act.id}>
                                {act.name}
                              </SelectItem>
                            ))}
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
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
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
                        onClick={handleAddTraining}
                        disabled={createTrainingMutation.isPending || !selectedActId}
                        data-testid="button-confirm-training"
                      >
                        {createTrainingMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-foreground" />
                        )}
                        Add Training
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
                    acts={acts}
                    locations={locations}
                    departments={departments}
                    artists={artists}
                    technicians={technicians}
                    users={users}
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
