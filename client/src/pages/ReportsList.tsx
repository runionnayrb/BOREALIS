import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReportCard from "@/components/ReportCard";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, Training } from "@shared/schema";

export default function ReportsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  const { data: allTrainings = [] } = useQuery<Training[]>({
    queryKey: ['/api/trainings/all'],
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiRequest('DELETE', `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trainings/all'] });
      toast({ title: "Report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete report", variant: "destructive" });
    },
  });

  const filteredReports = reports.filter((report) => {
    const dateStr = new Date(report.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
           report.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
           report.stageManagerOnDuty?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Training Reports</h1>
            <p className="text-sm text-muted-foreground">
              One report per day with all trainings
            </p>
          </div>
          <Button onClick={() => setLocation("/new-report")} data-testid="button-create-report" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by date, act, artist, location, notes, or time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-reports"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Search across all training data including dates, times, acts, artists, locations, department notes, and technicians
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description="Try adjusting your search or create a new report"
            actionLabel="Create Report"
            onAction={() => setLocation("/new-report")}
          />
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const dateStr = new Date(report.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
              const trainingsCount = allTrainings.filter(t => t.reportId === report.id).length;
              return (
                <ReportCard
                  key={report.id}
                  id={report.id}
                  title={dateStr}
                  date={report.date}
                  trainingsCount={trainingsCount}
                  onEdit={() => setLocation(`/report/${report.id}`)}
                  onDelete={() => deleteReportMutation.mutate(report.id)}
                  onExport={() => console.log("Export", report.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
