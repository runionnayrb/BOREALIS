import { useState } from "react";
import { Plus, Calendar, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryParams } from "@/hooks/use-query-params";
import { Link } from "wouter";
import type { MeetingTemplate, Meeting } from "@shared/schema";
import { format } from "date-fns";

export default function Meetings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryParams = useQueryParams();
  const selectedTemplateId = queryParams.get('template') || "all";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useQuery<MeetingTemplate[]>({
    queryKey: ['/api/meeting-templates'],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/meetings/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Meeting deleted",
        description: "The meeting has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    setMeetingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (meetingToDelete) {
      deleteMeetingMutation.mutate(meetingToDelete);
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive === 1);

  const filteredMeetings = selectedTemplateId && selectedTemplateId !== "all"
    ? meetings.filter((m) => m.templateId === selectedTemplateId)
    : meetings;

  const getMeetingTemplate = (templateId: string) => {
    return templates.find((t) => t.id === templateId);
  };

  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    return new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {selectedTemplateId && selectedTemplateId !== "all" 
                ? getMeetingTemplate(selectedTemplateId)?.name || "Meetings"
                : "Meetings"}
            </h1>
            <Link href="/meetings/new">
              <Button data-testid="button-new-meeting">
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </Link>
          </div>

          {meetingsLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Loading meetings...
            </div>
          ) : sortedMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-meetings">
                No meetings found. Create your first meeting note.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedMeetings.map((meeting) => {
                const template = getMeetingTemplate(meeting.templateId);
                return (
                  <Card key={meeting.id} className="hover-elevate" data-testid={`card-meeting-${meeting.id}`}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold" data-testid={`text-meeting-title-${meeting.id}`}>
                            {meeting.title || template?.name || "Meeting"}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-meeting-date-${meeting.id}`}>
                              {format(new Date(meeting.meetingDate), "MMMM d, yyyy")}
                            </span>
                            {template && (
                              <>
                                <span>•</span>
                                <span data-testid={`text-meeting-type-${meeting.id}`}>{template.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/meetings/${meeting.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-${meeting.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(meeting.id)}
                          data-testid={`button-delete-${meeting.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
