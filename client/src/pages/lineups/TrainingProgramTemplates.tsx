import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, ChevronRight, Layers } from "lucide-react";
import { Link } from "wouter";
import type { TrainingProgram, Competency } from "@shared/schema";

export default function TrainingProgramTemplates() {
  const { data: templates = [], isLoading } = useQuery<TrainingProgram[]>({
    queryKey: ["/api/training-programs/templates"],
  });

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lineups/training-programs">
          <Button variant="ghost" size="icon" data-testid="button-back-to-programs">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Program Templates</h1>
          <p className="text-muted-foreground mt-1">
            Reusable training program templates
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No program templates yet. Create templates from the main programs page.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const competency = competencies.find((c) => c.id === template.competencyId);
            
            return (
              <Link key={template.id} href={`/lineups/training-programs/${template.id}`}>
                <Card
                  className="hover-elevate cursor-pointer"
                  data-testid={`template-card-${template.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {template.name}
                          <Badge variant="secondary" data-testid="badge-template">Template</Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {competency && (
                            <div className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              <span>Awards: {competency.name}</span>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
