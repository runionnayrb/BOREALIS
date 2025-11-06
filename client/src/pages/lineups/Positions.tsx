import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Positions() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Positions</h1>
          <p className="text-muted-foreground mt-1">
            Manage lineup positions and their competency requirements
          </p>
        </div>
        <Button data-testid="button-add-position">
          <Plus className="w-4 h-4 mr-2" />
          Add Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Positions feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will allow you to create positions, assign competency requirements,
            and manage linked positions for auto-assignment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
