import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Restrictions() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PWD Restrictions</h1>
          <p className="text-muted-foreground mt-1">
            View current artist restrictions managed by Performance Wellness
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Read-only view for Stage Management</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            PWD Restrictions view is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will display active artist restrictions set by the Performance Wellness
            department, including position-specific and general restrictions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
