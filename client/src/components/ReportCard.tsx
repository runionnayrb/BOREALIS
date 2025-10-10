import { FileText, Download, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportCardProps {
  id: string;
  title: string;
  date: string;
  trainingsCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export default function ReportCard({
  id,
  title,
  date,
  trainingsCount,
  onEdit,
  onDelete,
  onExport,
}: ReportCardProps) {
  return (
    <Card className="p-4 hover-elevate" data-testid={`card-report-${id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate" data-testid={`text-report-title-${id}`}>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{date}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {trainingsCount} training{trainingsCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            data-testid={`button-edit-report-${id}`}
            className="w-9 h-9"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            data-testid={`button-export-report-${id}`}
            className="w-9 h-9"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid={`button-delete-report-${id}`}
            className="w-9 h-9 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
