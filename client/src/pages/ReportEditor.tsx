import { useState } from "react";
import { ArrowLeft, Download, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportHeader from "@/components/ReportHeader";
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

export default function ReportEditor() {
  const [, setLocation] = useLocation();
  const [leftImage, setLeftImage] = useState("");
  const [title, setTitle] = useState("Training Report");
  const [rightImage, setRightImage] = useState("");
  const [content, setContent] = useState("");
  const [showAddTraining, setShowAddTraining] = useState(false);

  //todo: remove mock functionality
  const [selectedAct, setSelectedAct] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:30");

  const mockActs = [
    { id: "1", name: "High Dive" },
    { id: "2", name: "Wheel" },
    { id: "3", name: "House Sync" },
    { id: "4", name: "Finale" },
  ];

  const mockDepartments = [
    { id: "1", name: "Rigging" },
    { id: "2", name: "Safety" },
    { id: "3", name: "Lighting" },
  ];

  const mockTechnicians = [
    { id: "1", name: "Sarah Johnson", departmentId: "1" },
    { id: "2", name: "Mike Chen", departmentId: "2" },
    { id: "3", name: "Alex Rivera", departmentId: "3" },
  ];

  const mockTrainings = [
    {
      id: "1",
      actName: "High Dive",
      startTime: "14:00",
      endTime: "16:30",
      durationMinutes: 150,
      departments: [
        { departmentName: "Rigging", leadName: "Sarah Johnson", notes: "Check harness tension" },
        { departmentName: "Safety", leadName: "Mike Chen" },
      ],
    },
  ];

  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return duration;
  };

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
          <ReportHeader
            leftImageUrl={leftImage}
            middleTitle={title}
            rightImageUrl={rightImage}
            dateString="Thursday, October 9, 2025"
            onLeftImageChange={setLeftImage}
            onMiddleTitleChange={setTitle}
            onRightImageChange={setRightImage}
          />

          <div>
            <h2 className="text-lg font-semibold mb-4">Report Body</h2>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trainings</h2>
              <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-training">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Training</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Act</Label>
                      <Select value={selectedAct} onValueChange={setSelectedAct}>
                        <SelectTrigger data-testid="select-act">
                          <SelectValue placeholder="Select act" />
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

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Duration: <span className="font-mono">{calculateDuration()} minutes</span>
                      </p>
                    </div>

                    {selectedAct && (
                      <div className="space-y-3">
                        <Label>Department Leads</Label>
                        {mockDepartments.map((dept) => (
                          <div key={dept.id} className="p-3 border border-border rounded-md space-y-2">
                            <p className="font-medium">{dept.name}</p>
                            <Select>
                              <SelectTrigger data-testid={`select-lead-${dept.id}`}>
                                <SelectValue placeholder="Select lead technician" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockTechnicians
                                  .filter((tech) => tech.departmentId === dept.id)
                                  .map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id}>
                                      {tech.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notes (optional)"
                              data-testid={`input-notes-${dept.id}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

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
