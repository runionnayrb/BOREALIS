import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DOMPurify from "dompurify";
import type { MeetingTemplate, MeetingTemplateField, Meeting, MeetingFieldValue, Location, SafeUser } from "@shared/schema";
import { format } from "date-fns";

export default function MeetingView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Check if user can edit meetings (admin or stage_management roles)
  const canEdit = user?.role === 'admin' || user?.role === 'stage_management';

  // Fetch meeting - refetch on mount to ensure fresh data after edits
  const { data: meeting, isLoading: meetingLoading } = useQuery<Meeting>({
    queryKey: ['/api/meetings', id],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch meeting');
      return response.json();
    },
    refetchOnMount: true,
  });

  // Fetch template
  const { data: template } = useQuery<MeetingTemplate>({
    queryKey: ['/api/meeting-templates', meeting?.templateId],
    enabled: !!meeting?.templateId,
  });

  // Fetch template fields
  const { data: templateFields = [] } = useQuery<MeetingTemplateField[]>({
    queryKey: ['/api/meeting-templates', meeting?.templateId, 'fields'],
    enabled: !!meeting?.templateId,
  });

  // Fetch field values - refetch on mount to ensure fresh data after edits
  const { data: fieldValues = [] } = useQuery<MeetingFieldValue[]>({
    queryKey: ['/api/meetings', id, 'field-values'],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}/field-values`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch field values');
      return response.json();
    },
    enabled: !!meeting,
    refetchOnMount: true,
  });

  // Fetch locations for display
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Fetch users for attendees display
  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ['/api/users'],
  });

  if (meetingLoading || !meeting) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const getFieldValue = (fieldId: string) => {
    const value = fieldValues.find(v => v.fieldId === fieldId);
    if (!value) return null;
    
    if (value.textValue !== null) return value.textValue;
    if (value.locationId !== null) return value.locationId;
    if (value.attendeeIds !== null) return value.attendeeIds;
    
    return null;
  };

  const renderFieldValue = (field: MeetingTemplateField) => {
    const fieldValue = fieldValues.find(v => v.fieldId === field.id);

    switch (field.fieldType) {
      case 'text':
      case 'richtext':
        const textValue = fieldValue?.textValue;
        const sanitizedHtml = DOMPurify.sanitize(textValue || '<p class="text-muted-foreground">No content</p>');
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              data-testid={`display-field-${field.id}`}
            />
          </div>
        );
      
      case 'date':
        const dateValue = fieldValue?.textValue;
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div className="text-sm" data-testid={`display-field-${field.id}`}>
              {dateValue ? format(new Date(dateValue), "MMMM d, yyyy") : "No date set"}
            </div>
          </div>
        );
      
      case 'time':
        const timeValue = fieldValue?.textValue;
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div className="text-sm" data-testid={`display-field-${field.id}`}>
              {timeValue || "No time set"}
            </div>
          </div>
        );
      
      case 'checkbox':
        const checkboxValue = fieldValue?.textValue === "true";
        return (
          <div className="flex items-center space-x-2">
            <div 
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                checkboxValue ? 'bg-primary border-primary' : 'border-border bg-muted/30'
              }`}
              data-testid={`display-field-${field.id}`}
            >
              {checkboxValue && (
                <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <Label className="cursor-default">{field.fieldName}</Label>
          </div>
        );
      
      case 'location':
        const locationId = fieldValue?.locationId;
        const location = locations.find(l => l.id === locationId);
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div className="text-sm" data-testid={`display-field-${field.id}`}>
              {location?.name || "No location selected"}
            </div>
          </div>
        );
      
      case 'attendees':
        const attendeeIds = fieldValue?.attendeeIds || [];
        const selectedUsers = users.filter(u => attendeeIds.includes(u.id));
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div className="text-sm" data-testid={`display-field-${field.id}`}>
              {selectedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map(user => (
                    <span key={user.id} className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs">
                      {user.preferredName || user.firstName} {user.lastName}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No attendees selected</span>
              )}
            </div>
          </div>
        );
      
      case 'dropdown':
        const dropdownValue = fieldValue?.textValue;
        return (
          <div className="space-y-2">
            <Label>{field.fieldName}</Label>
            <div className="text-sm" data-testid={`display-field-${field.id}`}>
              {dropdownValue || "No selection"}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with Meeting Title and Edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/meetings">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="display-meeting-title">
              {template?.name || 'Meeting Notes'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1" data-testid="display-meeting-date">
              {format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button 
            onClick={() => setLocation(`/meetings/${id}/edit`)}
            data-testid="button-edit-meeting"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Meeting Fields */}
      <div className="space-y-6">
        {templateFields.map((field) => (
          <div key={field.id}>
            {renderFieldValue(field)}
          </div>
        ))}
      </div>
    </div>
  );
}
