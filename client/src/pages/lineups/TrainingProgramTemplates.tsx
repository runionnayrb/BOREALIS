import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, ChevronRight, Layers, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { TrainingProgram, Competency } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TrainingProgramTemplates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: templates = [], isLoading } = useQuery<TrainingProgram[]>({
    queryKey: ["/api/training-programs/templates"],
  });

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async ({ templateId, name }: { templateId: string; name: string }) => {
      const response = await apiRequest<TrainingProgram>(
        "POST",
        `/api/training-programs/${templateId}/create-from-template`,
        { name }
      );
      return response;
    },
    onSuccess: (newProgram) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      toast({
        title: "Program Created",
        description: `Created active program "${newProgram.name}"`,
      });
      setLocation(`/lineups/training-programs/${newProgram.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create program from template",
        variant: "destructive",
      });
    },
  });

  const handleCreateFromTemplate = (e: React.MouseEvent, template: TrainingProgram) => {
    e.preventDefault();
    e.stopPropagation();
    createFromTemplateMutation.mutate({ templateId: template.id, name: template.name });
  };

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
          <h1 className="text-3xl font-bold">Training Program Templates</h1>
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
              <Card
                key={template.id}
                className="hover-elevate cursor-pointer"
                data-testid={`template-card-${template.id}`}
              >
                <Link href={`/lineups/training-programs/${template.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {template.name}
                          <Badge variant="secondary" data-testid="badge-template">Template</Badge>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleCreateFromTemplate(e, template)}
                          disabled={createFromTemplateMutation.isPending}
                          data-testid={`button-create-from-template-${template.id}`}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Create from Template
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
