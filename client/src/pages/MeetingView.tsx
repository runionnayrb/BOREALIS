import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DOMPurify from "dompurify";
import type { MeetingTemplate, MeetingTemplateField, Meeting, MeetingFieldValue, Location, SafeUser } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MeetingView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Email preview state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  
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
  const { data: template, isLoading: templateLoading } = useQuery<MeetingTemplate>({
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

  const handleOpenEmailPreview = async () => {
    if (!id) return;
    
    setIsLoadingEmailPreview(true);
    try {
      const previewData = await fetch(`/api/meetings/${id}/email-preview`, { credentials: 'include' }).then(res => res.json());
      
      setEmailTo((template?.emailTo || []).join(', '));
      const ccValue = (template?.emailCc || []).join(', ');
      const bccValue = (template?.emailBcc || []).join(', ');
      setEmailCc(ccValue);
      setEmailBcc(bccValue);
      setEmailSubject(previewData.subject || '');
      setEmailBody(previewData.body || '');
      setShowCc(ccValue.length > 0);
      setShowBcc(bccValue.length > 0);

      setEmailPreviewOpen(true);
    } catch (error) {
      console.error('Failed to load email preview:', error);
      toast({
        title: "Failed to load email preview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmailPreview(false);
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (customValues?: {
      to: string;
      cc: string;
      bcc: string;
      subject: string;
      body: string;
    }) => {
      if (!id) throw new Error("Meeting must be saved before sending");
      return await apiRequest<{ success: boolean; message: string }>('POST', `/api/meetings/${id}/send-email`, customValues);
    },
    onSuccess: (data) => {
      setEmailPreviewOpen(false);
      toast({ 
        title: "Email sent successfully", 
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to send email", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (meetingLoading || !meeting || templateLoading) {
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
        <div>
          <h1 className="text-2xl font-semibold" data-testid="display-meeting-title">
            {template?.name || 'Meeting Notes'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="display-meeting-date">
            {format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && user?.outlookConnected && (
            <Button 
              variant="outline"
              onClick={handleOpenEmailPreview}
              disabled={isLoadingEmailPreview}
              data-testid="button-send-email"
            >
              {isLoadingEmailPreview ? (
                <Loader2 className="h-4 w-4 mr-2 text-foreground animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2 text-foreground" />
              )}
              Send
            </Button>
          )}
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
