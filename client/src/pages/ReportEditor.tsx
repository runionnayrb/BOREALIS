import { useState } from "react";
import { ArrowLeft, Download, Plus, Save, Calendar, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/RichTextEditor";
import TrainingCard from "@/components/TrainingCard";
import { useLocation } from "wouter";
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
import { Badge } from "@/components/ui/badge";

export default function ReportEditor() {
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [reportDate, setReportDate] = useState("2025-10-09");

  //todo: remove mock functionality
  const [selectedAct, setSelectedAct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:30");

  const mockLocations = [
    { id: "1", name: "Main Stage" },
    { id: "2", name: "Rehearsal Hall A" },
    { id: "3", name: "Rehearsal Hall B" },
    { id: "4", name: "Pool Area" },
  ];

  const mockActs = [
    { 
      id: "1", 
      name: "High Dive",
      departments: [
        { id: "1", name: "Rigging" },
        { id: "2", name: "Safety" },
        { id: "3", name: "Lighting" },
      ],
      artists: [
        { id: "1", name: "Elena Martinez", group: "Divers" },
        { id: "2", name: "Marcus Chen", group: "Divers" },
        { id: "3", name: "Sophia Kim", group: "Divers" },
      ]
    },
    { 
      id: "2", 
      name: "Wheel",
      departments: [
        { id: "4", name: "Automation" },
        { id: "3", name: "Lighting" },
        { id: "5", name: "Sound" },
      ],
      artists: [
        { id: "4", name: "Andre Silva", group: "Wheel Team" },
        { id: "5", name: "Maya Patel", group: "Wheel Team" },
      ]
    },
    { 
      id: "3", 
      name: "House Sync",
      departments: [
        { id: "1", name: "Rigging" },
        { id: "4", name: "Automation" },
        { id: "6", name: "Stage Management" },
      ],
      artists: [
        { id: "6", name: "Lucas Torres", group: "Flyers" },
        { id: "7", name: "Amara Johnson", group: "Flyers" },
        { id: "8", name: "Jin Park", group: null },
      ]
    },
  ];

  const mockTechnicians = [
    { id: "1", name: "Sarah Johnson", departmentId: "1", role: "Rigging Lead" },
    { id: "2", name: "Mike Chen", departmentId: "2", role: "Safety Officer" },
    { id: "3", name: "Alex Rivera", departmentId: "3", role: "Lighting Director" },
    { id: "4", name: "Jamie Lee", departmentId: "4", role: "Automation Tech" },
    { id: "5", name: "Chris Taylor", departmentId: "5", role: "Sound Engineer" },
    { id: "6", name: "Pat Morgan", departmentId: "6", role: "Stage Manager" },
  ];

  const mockTrainings = [
    {
      id: "1",
      actName: "High Dive",
      startTime: "14:00",
      endTime: "16:30",
      durationMinutes: 150,
      location: "Pool Area",
      departments: [
        { departmentName: "Rigging", leadName: "Sarah Johnson", notes: "Check harness tension" },
        { departmentName: "Safety", leadName: "Mike Chen" },
      ],
    },
    {
      id: "2",
      actName: "Wheel",
      startTime: "17:00",
      endTime: "18:30",
      durationMinutes: 90,
      location: "Main Stage",
      departments: [
        { departmentName: "Lighting", leadName: "Alex Rivera" },
      ],
    },
  ];

  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return duration;
  };

  const selectedActData = mockActs.find(act => act.id === selectedAct);

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button data-testid="button-save">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-md p-6 bg-card">
            <div className="flex items-center gap-4 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="report-date" className="text-base font-semibold">Report Date</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  All trainings for this day will be included in one report
                </p>
              </div>
            </div>
            <Input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              data-testid="input-report-date"
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-formatted-date">
              Thursday, October 9, 2025
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Report Notes</h2>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Trainings for This Day</h2>
                <p className="text-sm text-muted-foreground">
                  All trainings scheduled for October 9, 2025
                </p>
              </div>
              <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-training">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Training</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Select Act</Label>
                      <Select value={selectedAct} onValueChange={setSelectedAct}>
                        <SelectTrigger data-testid="select-act">
                          <SelectValue placeholder="Choose an act for this training" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockActs.map((act) => (
                            <SelectItem key={act.id} value={act.id}>
                              {act.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Training Location</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue placeholder="Select training location" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {location.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedActData && (
                      <>
                        <div className="border border-border rounded-md p-4 bg-muted/30 space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Assigned Departments</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedActData.departments.map((dept) => (
                                <Badge key={dept.id} variant="secondary">
                                  {dept.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4" />
                              <h3 className="text-sm font-semibold">Assigned Artists</h3>
                            </div>
                            <div className="space-y-1">
                              {selectedActData.artists.map((artist) => (
                                <div key={artist.id} className="text-sm flex items-center gap-2">
                                  <span>{artist.name}</span>
                                  {artist.group && (
                                    <Badge variant="outline" className="text-xs">
                                      {artist.group}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                          <p className="text-sm font-medium">
                            Duration: <span className="font-mono text-primary">{calculateDuration()} minutes</span>
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Label>Department Lead Assignments</Label>
                          <p className="text-sm text-muted-foreground">
                            Assign a lead technician for each department in this training
                          </p>
                          {selectedActData.departments.map((dept) => {
                            const deptTechs = mockTechnicians.filter(
                              (tech) => tech.departmentId === dept.id
                            );
                            
                            return (
                              <div key={dept.id} className="p-4 border border-border rounded-md space-y-3 bg-card">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{dept.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {deptTechs.length} technician{deptTechs.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Lead Technician</Label>
                                  <Select>
                                    <SelectTrigger data-testid={`select-lead-${dept.id}`}>
                                      <SelectValue placeholder="Select lead technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {deptTechs.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                          {tech.name} {tech.role && `- ${tech.role}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Notes (Optional)</Label>
                                  <Textarea
                                    placeholder="Special instructions or notes for this department..."
                                    data-testid={`input-notes-${dept.id}`}
                                    className="resize-none"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => {
                            console.log("Save training");
                            setShowAddTraining(false);
                          }}
                          data-testid="button-save-training"
                        >
                          Save Training
                        </Button>
                      </>
                    )}

                    {!selectedActData && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Select an act to see assigned departments and artists</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {mockTrainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  {...training}
                  onEdit={() => console.log("Edit", training.id)}
                  onDelete={() => console.log("Delete", training.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 md:bottom-4 right-4 md:right-8 flex gap-2">
          <Button size="lg" className="shadow-lg" data-testid="button-save-mobile">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
