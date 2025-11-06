import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Competencies() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competencies</h1>
          <p className="text-muted-foreground mt-1">
            Manage artist qualifications and competency requirements
          </p>
        </div>
        <Button data-testid="button-add-competency">
          <Plus className="w-4 h-4 mr-2" />
          Add Competency
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Competencies feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will allow you to define competencies, assign them to artists,
            and track competency expiration dates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
