import { Clock, Users, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Training, Scene, Act, Department, Location, Artist, Technician, User, DepartmentAssignment } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrainingCardProps {
  training: Training;
  scenes: Scene[];
  acts: Act[];
  locations: Location[];
  departments: Department[];
  artists: Artist[];
  technicians: Technician[];
  users: User[];
}

export default function TrainingCard({
  training,
  scenes,
  acts,
  locations,
  departments,
  technicians,
  users,
}: TrainingCardProps) {
  const { toast } = useToast();
  
  const { data: assignments = [] } = useQuery<DepartmentAssignment[]>({
    queryKey: ['/api/trainings', training.id, 'assignments'],
  });

  const deleteTrainingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/trainings/${training.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', training.reportId, 'trainings'] });
      toast({ title: "Training deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete training", variant: "destructive" });
    },
  });

  const scene = scenes.find(s => s.id === training.sceneId);
  const act = acts.find(a => a.id === training.actId);
  const location = locations.find(l => l.id === training.locationId);
  const creator = users.find(u => u.id === training.createdBy);
  const updater = users.find(u => u.id === training.updatedBy);

  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || "Unknown";
  };

  const getTechnicianName = (techId: string | null) => {
    if (!techId) return null;
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return null;
    return `${tech.firstName} ${tech.lastName}`;
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "Unknown";
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || "Unknown";
  };

  return (
    <Card className="p-4" data-testid={`card-training-${training.id}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1" data-testid={`text-act-${training.id}`}>
            {scene ? `${scene.name} (Full Scene)` : act?.name || "Unknown"}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono" data-testid={`text-time-${training.id}`}>
              {training.startTime} - {training.endTime}
            </span>
            <Badge variant="secondary" className="font-mono">
              {training.durationMinutes} min
            </Badge>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{location.name}</span>
            </div>
          )}
          {training.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              {training.notes}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>
              Created by {getUserName(training.createdBy)} on {new Date(training.createdAt).toLocaleString()}
            </p>
            {training.updatedAt && training.updatedAt.toString() !== training.createdAt.toString() && (
              <p>
                Last updated by {getUserName(training.updatedBy)} on {new Date(training.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            data-testid={`button-edit-training-${training.id}`}
            className="w-9 h-9"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`button-delete-training-${training.id}`}
                className="w-9 h-9 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Training?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this training session. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTrainingMutation.mutate()}
                  disabled={deleteTrainingMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteTrainingMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Department Leads</span>
          </div>
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-start justify-between gap-2 text-sm"
                data-testid={`dept-assignment-${training.id}-${assignment.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{getDepartmentName(assignment.departmentId)}</p>
                  {assignment.leadTechnicianId && (
                    <p className="text-muted-foreground">{getTechnicianName(assignment.leadTechnicianId)}</p>
                  )}
                  {assignment.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{assignment.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
