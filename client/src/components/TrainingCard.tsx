import { Clock, Users, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DepartmentPosition {
  departmentName: string;
  leadName?: string;
  notes?: string;
}

interface TrainingCardProps {
  id: string;
  actName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  departments: DepartmentPosition[];
  scheduledFor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TrainingCard({
  id,
  actName,
  startTime,
  endTime,
  durationMinutes,
  departments,
  scheduledFor,
  onEdit,
  onDelete,
}: TrainingCardProps) {
  return (
    <Card className="p-4" data-testid={`card-training-${id}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold text-base mb-1" data-testid={`text-act-${id}`}>
            {actName}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono" data-testid={`text-time-${id}`}>
              {startTime} - {endTime}
            </span>
            <Badge variant="secondary" className="font-mono">
              {durationMinutes} min
            </Badge>
          </div>
          {scheduledFor && (
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled: {scheduledFor}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            data-testid={`button-edit-training-${id}`}
            className="w-9 h-9"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid={`button-delete-training-${id}`}
            className="w-9 h-9 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {departments.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Department Leads</span>
          </div>
          <div className="space-y-2">
            {departments.map((dept, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 text-sm"
                data-testid={`dept-position-${id}-${idx}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{dept.departmentName}</p>
                  {dept.leadName && (
                    <p className="text-muted-foreground">{dept.leadName}</p>
                  )}
                  {dept.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{dept.notes}</p>
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
