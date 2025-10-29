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
import { parse, isValid, format as formatDate } from "date-fns";
import type { 
  Report, 
  Training, 
  Scene, 
  Act, 
  Location, 
  Department, 
  Artist, 
  Technician,
  TrainingLocation,
  TrainingArtist,
  DepartmentAssignment
} from "@shared/schema";

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

  const { data: scenes = [] } = useQuery<Scene[]>({ 
    queryKey: ['/api/scenes'] 
  });
  
  const { data: acts = [] } = useQuery<Act[]>({ 
    queryKey: ['/api/acts'] 
  });
  
  const { data: locations = [] } = useQuery<Location[]>({ 
    queryKey: ['/api/locations'] 
  });
  
  const { data: departments = [] } = useQuery<Department[]>({ 
    queryKey: ['/api/departments'] 
  });
  
  const { data: artists = [] } = useQuery<Artist[]>({ 
    queryKey: ['/api/artists'] 
  });
  
  const { data: technicians = [] } = useQuery<Technician[]>({ 
    queryKey: ['/api/technicians'] 
  });

  const { data: trainingLocations = [] } = useQuery<TrainingLocation[]>({ 
    queryKey: ['/api/training-locations/all'] 
  });
  
  const { data: trainingArtists = [] } = useQuery<TrainingArtist[]>({ 
    queryKey: ['/api/training-artists/all'] 
  });
  
  const { data: assignments = [] } = useQuery<DepartmentAssignment[]>({ 
    queryKey: ['/api/assignments/all'] 
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

  // Helper function to try parsing search query as a date
  const tryParseDate = (query: string): Date | null => {
    const currentYear = new Date().getFullYear();
    
    // Try various date formats
    const formats = [
      'M/d/yyyy',    // 10/12/2025
      'M/d',         // 10/12 (assumes current year)
      'MMM d',       // Oct 12
      'MMMM d',      // October 12
      'MMM d yyyy',  // Oct 12 2025
      'MMMM d yyyy', // October 12 2025
    ];
    
    for (const dateFormat of formats) {
      try {
        const referenceDate = new Date();
        const parsedDate = parse(query, dateFormat, referenceDate);
        
        if (isValid(parsedDate)) {
          // For formats without year, use current year
          if (!dateFormat.includes('y')) {
            parsedDate.setFullYear(currentYear);
          }
          return parsedDate;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in report data
    const [year, month, day] = report.date.split('-').map(Number);
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Try to parse query as a date
    const parsedQueryDate = tryParseDate(query);
    const [reportYear, reportMonth, reportDay] = report.date.split('-').map(Number);
    const reportDate = new Date(reportYear, reportMonth - 1, reportDay);
    
    // Check if dates match (same day, month, year)
    const datesMatch = parsedQueryDate && 
      reportDate.getDate() === parsedQueryDate.getDate() &&
      reportDate.getMonth() === parsedQueryDate.getMonth() &&
      reportDate.getFullYear() === parsedQueryDate.getFullYear();
    
    if (datesMatch ||
        dateStr.toLowerCase().includes(query) ||
        report.date.toLowerCase().includes(query) ||
        report.stageManagerOnDuty?.toLowerCase().includes(query) ||
        report.notes?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in training data for this report
    const reportTrainings = allTrainings.filter(t => t.reportId === report.id);
    
    for (const training of reportTrainings) {
      // Search times
      if (training.startTime.toLowerCase().includes(query) ||
          training.endTime.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search training notes and custom name
      if (training.notes?.toLowerCase().includes(query) ||
          training.customName?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search scene name
      if (training.sceneId) {
        const scene = scenes.find(s => s.id === training.sceneId);
        if (scene?.name.toLowerCase().includes(query)) {
          return true;
        }
      }
      
      // Search act name
      if (training.actId) {
        const act = acts.find(a => a.id === training.actId);
        if (act?.name.toLowerCase().includes(query)) {
          return true;
        }
      }
      
      // Search location names
      const trainingLocs = trainingLocations.filter(tl => tl.trainingId === training.id);
      for (const tl of trainingLocs) {
        const location = locations.find(l => l.id === tl.locationId);
        if (location?.name.toLowerCase().includes(query)) {
          return true;
        }
      }
      
      // Search artist names
      const trainingArts = trainingArtists.filter(ta => ta.trainingId === training.id);
      for (const ta of trainingArts) {
        const artist = artists.find(a => a.id === ta.artistId);
        if (artist?.firstName.toLowerCase().includes(query) ||
            artist?.lastName.toLowerCase().includes(query) ||
            artist?.stageName?.toLowerCase().includes(query)) {
          return true;
        }
      }
      
      // Search department names and technician names
      const trainingAssignments = assignments.filter(a => a.trainingId === training.id);
      for (const assignment of trainingAssignments) {
        const department = departments.find(d => d.id === assignment.departmentId);
        if (department?.name.toLowerCase().includes(query)) {
          return true;
        }
        
        if (assignment.notes?.toLowerCase().includes(query)) {
          return true;
        }
        
        if (assignment.leadTechnicianId) {
          const technician = technicians.find(t => t.id === assignment.leadTechnicianId);
          if (technician?.firstName.toLowerCase().includes(query) ||
              technician?.lastName.toLowerCase().includes(query) ||
              technician?.technicianName?.toLowerCase().includes(query)) {
            return true;
          }
        }
      }
    }
    
    return false;
  });

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Training Reports</h1>
          </div>
          <Button onClick={() => setLocation("/new-report")} data-testid="button-create-report" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        <div className="mb-6">
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
              const [year, month, day] = report.date.split('-').map(Number);
              const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-US', { 
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
                  onClick={() => setLocation(`/report/${report.id}`)}
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
