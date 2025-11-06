import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TrainingPrograms() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Manage training programs and validation requirements for artist competencies
          </p>
        </div>
        <Button data-testid="button-add-training-program">
          <Plus className="w-4 h-4 mr-2" />
          Add Training Program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Training Programs feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will allow you to create and manage training programs with multiple steps,
            track artist progress, and define validation requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
