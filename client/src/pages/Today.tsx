import { Clock } from "lucide-react";
import TrainingCard from "@/components/TrainingCard";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "wouter";

export default function Today() {
  const [, setLocation] = useLocation();

  //todo: remove mock functionality
  const mockTodayTrainings = [
    {
      id: "1",
      actName: "High Dive",
      startTime: "14:00",
      endTime: "16:30",
      durationMinutes: 150,
      departments: [
        { departmentName: "Rigging", leadName: "Sarah Johnson", notes: "Check harness tension" },
        { departmentName: "Safety", leadName: "Mike Chen" },
      ],
      scheduledFor: "Today at 2:00 PM",
    },
  ];

  const hasTrainings = mockTodayTrainings.length > 0;

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Today's Trainings</h1>
          <p className="text-sm text-muted-foreground">
            Thursday, October 9, 2025
          </p>
        </div>

        {hasTrainings ? (
          <div className="space-y-3">
            {mockTodayTrainings.map((training) => (
              <TrainingCard
                key={training.id}
                {...training}
                onEdit={() => console.log("Edit", training.id)}
                onDelete={() => console.log("Delete", training.id)}
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
