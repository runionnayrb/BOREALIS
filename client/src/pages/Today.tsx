import { Clock, Loader2 } from "lucide-react";
import TrainingCard from "@/components/TrainingCard";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Report, Training, Act, Department, Location, Artist, Technician, User } from "@shared/schema";

export default function Today() {
  const [, setLocation] = useLocation();
  const today = new Date().toISOString().split('T')[0];

  const { data: todayReport } = useQuery<Report>({
    queryKey: ['/api/reports/date', today],
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<Training[]>({
    queryKey: ['/api/reports', todayReport?.id, 'trainings'],
    enabled: !!todayReport?.id,
  });

  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ['/api/acts'] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ['/api/departments'] });
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ['/api/locations'] });
  const { data: artists = [] } = useQuery<Artist[]>({ queryKey: ['/api/artists'] });
  const { data: technicians = [] } = useQuery<Technician[]>({ queryKey: ['/api/technicians'] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['/api/users'] });

  const hasTrainings = trainings.length > 0;
  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Today's Trainings</h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>

        {trainingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasTrainings ? (
          <div className="space-y-3">
            {trainings.map((training) => (
              <TrainingCard
                key={training.id}
                training={training}
                acts={acts}
                locations={locations}
                departments={departments}
                artists={artists}
                technicians={technicians}
                users={users}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No trainings scheduled for today"
            description="Check back later or view all reports to add a training"
            actionLabel="View All Reports"
            onAction={() => setLocation("/")}
          />
        )}
      </div>
    </div>
  );
}
