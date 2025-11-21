import { Plus, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useQueryParams } from "@/hooks/use-query-params";
import { Link } from "wouter";
import type { MeetingTemplate, Meeting } from "@shared/schema";
import { format } from "date-fns";

export default function Meetings() {
  const { user } = useAuth();
  const queryParams = useQueryParams();
  const selectedTemplateId = queryParams.get('template') || "all";

  const { data: templates = [], isLoading: templatesLoading } = useQuery<MeetingTemplate[]>({
    queryKey: ['/api/meeting-templates/active'],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

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
            <Link href={selectedTemplateId && selectedTemplateId !== "all" ? `/meetings/new?template=${selectedTemplateId}` : "/meetings/new"}>
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
                  <Link key={meeting.id} href={`/meetings/${meeting.id}/view`}>
                    <Card className="hover-elevate cursor-pointer" data-testid={`card-meeting-${meeting.id}`}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold" data-testid={`text-meeting-title-${meeting.id}`}>
                              {template?.name || "Meeting"}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span data-testid={`text-meeting-date-${meeting.id}`}>
                                {format(new Date(meeting.meetingDate), "MMMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
