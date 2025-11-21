import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DOMPurify from "dompurify";
import type { MeetingTemplate, MeetingTemplateField, Meeting, MeetingFieldValue, Location, SafeUser } from "@shared/schema";

// Strip HTML tags to show clean text for editing, preserving numbered lists and spacing
const stripHtml = (html: string): string => {
  let text = html;
  
  // Replace opening tags for lists and list items with numbered markers
  let listCounter = 0;
  text = text.replace(/<ol[^>]*>/gi, () => {
    listCounter = 0;
    return '';
  });
  text = text.replace(/<li[^>]*>/gi, () => {
    listCounter++;
    return `${listCounter}. `;
  });
  
  // Handle other HTML tags
  text = text
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/[ou]l>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n\n+/g, '\n\n')
    .trim();
};

// Convert plain text back to HTML with proper formatting and list handling
const plainTextToHtml = (text: string): string => {
  const lines = text.split('\n');
  const result: string[] = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // Preserve empty lines as <br> for spacing
      result.push('<br>');
      return;
    }
    
    const escaped = trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    result.push(`<p style="margin: 8px 0;">${escaped}</p>`);
  });
  
  return result.join('\n');
};
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
  const [originalHtmlBody, setOriginalHtmlBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  
  // Check if user can edit meetings (admin or stage_management roles)
  const canEdit = user?.role === 'admin' || user?.role === 'stage_management';

  // Fetch meeting
  const { data: meeting, isLoading: meetingLoading } = useQuery<Meeting>({
    queryKey: ['/api/meetings', id],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch meeting');
      return response.json();
    },
  });

  // Fetch template
  const { data: template, isLoading: templateLoading } = useQuery<MeetingTemplate>({
    queryKey: ['/api/meeting-templates', meeting?.templateId],
    enabled: !!meeting?.templateId,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch template fields
  const { data: templateFields = [] } = useQuery<MeetingTemplateField[]>({
    queryKey: ['/api/meeting-templates', meeting?.templateId, 'fields'],
    enabled: !!meeting?.templateId,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch field values
  const { data: fieldValues = [] } = useQuery<MeetingFieldValue[]>({
    queryKey: ['/api/meetings', id, 'field-values'],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}/field-values`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch field values');
      return response.json();
    },
    enabled: !!meeting,
    staleTime: 5000, // Cache for 5 seconds - short because content changes frequently
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
      
      const toEmails = Array.isArray(template?.emailTo) ? template.emailTo : (template?.emailTo ? [template.emailTo] : []);
      const ccEmails = Array.isArray(template?.emailCc) ? template.emailCc : (template?.emailCc ? [template.emailCc] : []);
      const bccEmails = Array.isArray(template?.emailBcc) ? template.emailBcc : (template?.emailBcc ? [template.emailBcc] : []);
      
      setEmailTo(toEmails.map((e: string) => e.toLowerCase()).join(', '));
      const ccValue = ccEmails.map((e: string) => e.toLowerCase()).join(', ');
      const bccValue = bccEmails.map((e: string) => e.toLowerCase()).join(', ');
      setEmailCc(ccValue);
      setEmailBcc(bccValue);
      setEmailSubject(previewData.subject || '');
      setOriginalHtmlBody(previewData.body || '');
      setEmailBody(stripHtml(previewData.body || ''));
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
          {canEdit && (
            <Button 
              variant="default"
              onClick={() => setLocation(`/meetings/${id}/edit`)}
              data-testid="button-edit-meeting"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
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

      {/* Email Preview Dialog */}
      <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Email Before Sending</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@example.com, another@example.com"
                data-testid="input-email-to"
              />
            </div>
            
            {!showCc && !showBcc && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                  data-testid="button-show-cc"
                >
                  Add CC
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                  data-testid="button-show-bcc"
                >
                  Add BCC
                </Button>
              </div>
            )}

            {showCc && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-cc">CC</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCc(false);
                      setEmailCc("");
                    }}
                    className="h-6 text-xs text-muted-foreground"
                    data-testid="button-hide-cc"
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  id="email-cc"
                  value={emailCc}
                  onChange={(e) => setEmailCc(e.target.value)}
                  placeholder="cc@example.com"
                  data-testid="input-email-cc"
                />
              </div>
            )}

            {showBcc && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-bcc">BCC</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBcc(false);
                      setEmailBcc("");
                    }}
                    className="h-6 text-xs text-muted-foreground"
                    data-testid="button-hide-bcc"
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  id="email-bcc"
                  value={emailBcc}
                  onChange={(e) => setEmailBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  data-testid="input-email-bcc"
                />
              </div>
            )}

            {!showCc && showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                data-testid="button-show-cc-alt"
              >
                Add CC
              </Button>
            )}

            {showCc && !showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                data-testid="button-show-bcc-alt"
              >
                Add BCC
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Email Body</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Edit email body before sending"
                className="min-h-[300px] resize-none"
                data-testid="input-email-body"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEmailPreviewOpen(false)}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate({
                to: emailTo,
                cc: emailCc,
                bcc: emailBcc,
                subject: emailSubject,
                body: plainTextToHtml(emailBody),
              })}
              disabled={sendEmailMutation.isPending}
              data-testid="button-confirm-send-email"
            >
              {sendEmailMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-foreground" />
              )}
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
