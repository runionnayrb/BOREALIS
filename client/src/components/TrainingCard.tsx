import { Clock, Users, MapPin, FileText, Briefcase, Target, ArrowUpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import type { Training, Scene, Act, Department, Location, Artist, Technician, SafeUser, DepartmentAssignment, TrainingLocation, TrainingArtist } from "@shared/schema";

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
  const { data: assignments = [] } = useQuery<DepartmentAssignment[]>({
    queryKey: ['/api/trainings', training.id, 'assignments'],
  });

  const { data: trainingLocations = [] } = useQuery<TrainingLocation[]>({
    queryKey: ['/api/trainings', training.id, 'locations'],
  });

  // Fetch artists assigned to this specific training
  const { data: trainingArtistLinks = [] } = useQuery<TrainingArtist[]>({
    queryKey: ['/api/trainings', training.id, 'artists'],
  });

  const scene = scenes.find(s => s.id === training.sceneId);
  const act = acts.find(a => a.id === training.actId);
  const trainingLocationsList = trainingLocations.map(tl => locations.find(l => l.id === tl.locationId)).filter(Boolean) as Location[];
  
  // Get artists assigned to this training
  const trainingArtists = trainingArtistLinks.map(link => artists.find(artist => artist.id === link.artistId)).filter(Boolean) as Artist[];
  
  // Get departments from department assignments (not from scene/act)
  const trainingDepartments = assignments.map(assignment => departments.find(d => d.id === assignment.departmentId)).filter(Boolean) as Department[];
  
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
    <Card 
      className="p-3 md:p-4 cursor-pointer hover-elevate transition-all" 
      data-testid={`card-training-${training.id}`}
      onClick={() => onEdit(training)}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base break-words" data-testid={training.customName ? `text-custom-name-${training.id}` : `text-act-${training.id}`}>
                {training.customName || (scene ? `${scene.name} (Full Scene)` : act?.name || "Unknown")} - {training.goal || "No Goal Set"}
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm shrink-0 md:ml-4">
              <Badge variant="secondary" className="font-mono">
                {training.durationMinutes} min
              </Badge>
              <span className="text-muted-foreground tabular-nums" data-testid={`text-time-${training.id}`}>
                {training.startTime} - {training.endTime}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">SM:</span> <span>{training.stageManagerId ? getUserName(training.stageManagerId) : "None"}</span>
          </div>
          {trainingLocationsList.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-foreground mt-1 mb-3" data-testid={`text-locations-${training.id}`}>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{trainingLocationsList.map(l => l.name).join(", ")}</span>
            </div>
          )}
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Goal Notes</span>
            </div>
            {training.goalNotes ? (
              <div 
                className="text-sm text-foreground/80 mt-1 ml-5 prose prose-sm max-w-none [&_ul]:my-1 [&_ul]:text-foreground/80 [&_ol]:my-1 [&_ol]:text-foreground/80 [&_li]:my-0 [&_li]:mb-0.5 [&_li]:text-foreground/80 [&_p]:my-0.5 [&_p]:text-foreground/80 [&_li::marker]:text-foreground/80 [&_ul_li::marker]:text-foreground/80 [&_ol_li::marker]:text-foreground/80 [&_strong]:text-foreground/80 [&_em]:text-foreground/80 [&_u]:text-foreground/80 [&_s]:text-foreground/80"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(training.goalNotes) }}
              />
            ) : (
              <p className="text-sm text-foreground/80 mt-1 ml-5">No goal notes</p>
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Training Notes</span>
            </div>
            {training.notes ? (
              <div 
                className="text-sm text-foreground/80 mt-1 ml-5 prose prose-sm max-w-none [&_ul]:my-1 [&_ul]:text-foreground/80 [&_ol]:my-1 [&_ol]:text-foreground/80 [&_li]:my-0 [&_li]:mb-0.5 [&_li]:text-foreground/80 [&_p]:my-0.5 [&_p]:text-foreground/80 [&_li::marker]:text-foreground/80 [&_ul_li::marker]:text-foreground/80 [&_ol_li::marker]:text-foreground/80 [&_strong]:text-foreground/80 [&_em]:text-foreground/80 [&_u]:text-foreground/80 [&_s]:text-foreground/80"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(training.notes) }}
              />
            ) : (
              <p className="text-sm text-foreground/80 mt-1 ml-5">No training notes</p>
            )}
          </div>
          {training.followUpNotes && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <ArrowUpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Next Steps</span>
              </div>
              <div 
                className="text-sm text-foreground/80 mt-1 ml-5 prose prose-sm max-w-none [&_ul]:my-1 [&_ul]:text-foreground/80 [&_ol]:my-1 [&_ol]:text-foreground/80 [&_li]:my-0 [&_li]:mb-0.5 [&_li]:text-foreground/80 [&_p]:my-0.5 [&_p]:text-foreground/80 [&_li::marker]:text-foreground/80 [&_ul_li::marker]:text-foreground/80 [&_ol_li::marker]:text-foreground/80 [&_strong]:text-foreground/80 [&_em]:text-foreground/80 [&_u]:text-foreground/80 [&_s]:text-foreground/80"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(training.followUpNotes) }}
              />
            </div>
          )}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Artists</span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 ml-5">
              {trainingArtists.length > 0
                ? trainingArtists.map(artist => {
                    const name = artist.preferredName || `${artist.firstName} ${artist.lastName}`;
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
                ? [...trainingDepartments]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(dept => {
                      const assignment = assignments.find(a => a.departmentId === dept.id);
                      const leadTech = assignment?.leadTechnicianId 
                        ? technicians.find(t => t.id === assignment.leadTechnicianId)
                        : null;
                      const leadName = leadTech 
                        ? (leadTech.preferredName || `${leadTech.firstName} ${leadTech.lastName}`)
                        : null;
                      
                      return leadName ? `${dept.name} (${leadName})` : dept.name;
                    })
                    .join(", ")
                : "No Assigned Departments"}
            </p>
          </div>
          {training.updatedAt && training.updatedAt.toString() !== training.createdAt.toString() && (
            <div className="text-xs text-muted-foreground/70 mt-2">
              <p>
                Last updated by {getUserName(training.updatedBy)} on {new Date(training.updatedAt).toLocaleString(undefined, { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

    </Card>
  );
}
