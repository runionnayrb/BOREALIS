import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportCardProps {
  id: string;
  title: string;
  date: string;
  trainingsCount: number;
  onClick?: () => void;
  onExport?: () => void;
}

export default function ReportCard({
  id,
  title,
  date,
  trainingsCount,
  onClick,
  onExport,
}: ReportCardProps) {
  return (
    <Card 
      className="p-4 hover-elevate cursor-pointer" 
      data-testid={`card-report-${id}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate" data-testid={`text-report-title-${id}`}>
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {trainingsCount} training{trainingsCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onExport?.();
            }}
            data-testid={`button-export-report-${id}`}
            className="w-9 h-9"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
