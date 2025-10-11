import { Clock, Users, Pencil, Trash2, MapPin, Loader2, FileText, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Training, Scene, Act, Department, Location, Artist, Technician, SafeUser, DepartmentAssignment, TrainingLocation, SceneArtist, ActArtist, SceneDepartment, ActDepartment } from "@shared/schema";
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
  users: SafeUser[];
  onEdit: (training: Training) => void;
}

export default function TrainingCard({
  training,
  scenes,
  acts,
  locations,
  departments,
  artists,
  technicians,
  users,
  onEdit,
}: TrainingCardProps) {
  const { toast } = useToast();
  
  const { data: assignments = [] } = useQuery<DepartmentAssignment[]>({
    queryKey: ['/api/trainings', training.id, 'assignments'],
  });

  const { data: trainingLocations = [] } = useQuery<TrainingLocation[]>({
    queryKey: ['/api/trainings', training.id, 'locations'],
  });

  // Fetch artists from scene or act
  const { data: sceneArtistLinks = [] } = useQuery<SceneArtist[]>({
    queryKey: ['/api/scenes', training.sceneId, 'artists'],
    enabled: !!training.sceneId,
  });

  const { data: actArtistLinks = [] } = useQuery<ActArtist[]>({
    queryKey: ['/api/acts', training.actId, 'artists'],
    enabled: !!training.actId,
  });

  // Fetch departments from scene or act
  const { data: sceneDepartmentLinks = [] } = useQuery<SceneDepartment[]>({
    queryKey: ['/api/scenes', training.sceneId, 'departments'],
    enabled: !!training.sceneId,
  });

  const { data: actDepartmentLinks = [] } = useQuery<ActDepartment[]>({
    queryKey: ['/api/acts', training.actId, 'departments'],
    enabled: !!training.actId,
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
  const trainingLocationsList = trainingLocations.map(tl => locations.find(l => l.id === tl.locationId)).filter(Boolean) as Location[];
  
  // Get artists from scene or act
  const artistLinks = training.sceneId ? sceneArtistLinks : actArtistLinks;
  const trainingArtists = artistLinks.map(link => artists.find(artist => artist.id === link.artistId)).filter(Boolean) as Artist[];
  
  // Get departments from scene or act
  const departmentLinks = training.sceneId ? sceneDepartmentLinks : actDepartmentLinks;
  const trainingDepartments = departmentLinks.map(link => departments.find(d => d.id === link.departmentId)).filter(Boolean) as Department[];
  
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
          {trainingLocationsList.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-foreground mt-1" data-testid={`text-locations-${training.id}`}>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{trainingLocationsList.map(l => l.name).join(", ")}</span>
            </div>
          )}
          {training.notes && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Training Notes</span>
              </div>
              <p className="text-sm text-foreground/80 mt-1 ml-5">
                {training.notes}
              </p>
            </div>
          )}
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Artists</span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 ml-5">
              {trainingArtists.length > 0
                ? trainingArtists.map(artist => {
                    const name = artist.stageName || `${artist.firstName} ${artist.lastName}`;
                    return artist.role ? `${name} (${artist.role})` : name;
                  }).join(", ")
                : "No Assigned Artists"}
            </p>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Departments</span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 ml-5">
              {trainingDepartments.length > 0 
                ? trainingDepartments.map(d => d.name).join(", ")
                : "No Assigned Departments"}
            </p>
          </div>
          <div className="text-xs text-muted-foreground/70 mt-2">
            <p>
              Created by {getUserName(training.createdBy)} on {new Date(training.createdAt).toLocaleString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit'
              })}
              {training.updatedAt && training.updatedAt.toString() !== training.createdAt.toString() && (
                <> | Last updated by {getUserName(training.updatedBy)} on {new Date(training.updatedAt).toLocaleString(undefined, { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit'
                })}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            data-testid={`button-edit-training-${training.id}`}
            className="w-9 h-9"
            onClick={() => onEdit(training)}
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
