import { FileText, Download, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

interface ReportCardProps {
  id: string;
  title: string;
  date: string;
  trainingsCount: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export default function ReportCard({
  id,
  title,
  date,
  trainingsCount,
  onClick,
  onEdit,
  onDelete,
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
            <p className="text-sm text-muted-foreground">{date}</p>
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
              onEdit?.();
            }}
            data-testid={`button-edit-report-${id}`}
            className="w-9 h-9"
          >
            <Pencil className="w-4 h-4" />
          </Button>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`button-delete-report-${id}`}
                className="w-9 h-9 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this report? This will permanently delete the report and all associated training sessions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid={`button-cancel-delete-${id}`}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  asChild
                  data-testid={`button-confirm-delete-${id}`}
                >
                  <Button
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
