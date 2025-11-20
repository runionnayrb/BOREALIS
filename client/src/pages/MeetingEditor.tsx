import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useQueryParams } from "@/hooks/use-query-params";
import { ArrowLeft, Save, ChevronDown, Trash2, FileDown } from "lucide-react";
import { Link } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";
import type { MeetingTemplate, MeetingTemplateField, Meeting, MeetingFieldValue, Location, SafeUser } from "@shared/schema";
import { format } from "date-fns";

export default function MeetingEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryParams = useQueryParams();
  const templateFromUrl = queryParams.get('template');
  const isNewMeeting = !id;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateFromUrl || "");
  const [meetingDate, setMeetingDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch meeting templates
  const { data: templates = [] } = useQuery<MeetingTemplate[]>({
    queryKey: ['/api/meeting-templates'],
  });

  // Fetch template fields
  const { data: templateFields = [] } = useQuery<MeetingTemplateField[]>({
    queryKey: ['/api/meeting-templates', selectedTemplateId, 'fields'],
    enabled: !!selectedTemplateId,
  });

  // Fetch meeting if editing (must complete before template fields load)
  const { data: meeting, isLoading: meetingLoading } = useQuery<Meeting>({
    queryKey: ['/api/meetings', id],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch meeting');
      return response.json();
    },
    enabled: !!id && !isNewMeeting,
  });

  // Fetch field values if editing
  const { data: existingFieldValues = [] } = useQuery<MeetingFieldValue[]>({
    queryKey: ['/api/meetings', id, 'field-values'],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}/field-values`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch field values');
      return response.json();
    },
    enabled: !!id && !isNewMeeting && !!meeting,
  });

  // Fetch locations for location dropdown
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Fetch users for attendees multi-select
  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ['/api/users'],
  });

  // Load meeting data when editing
  useEffect(() => {
    if (meeting) {
      setSelectedTemplateId(meeting.templateId);
      setMeetingDate(meeting.meetingDate);
      setTitle(meeting.title || "");
    }
  }, [meeting]);

  // Initialize default values for text/richText fields
  useEffect(() => {
    if (templateFields.length > 0) {
      const defaultRichTextValue = "<ol><li>No notes today.</li></ol>";
      const defaults: Record<string, any> = {};
      
      templateFields.forEach((field) => {
        if (field.fieldType === 'richtext' || field.fieldType === 'text') {
          defaults[field.id] = defaultRichTextValue;
        }
      });
      
      setFieldValues((prev) => {
        const merged = { ...defaults, ...prev };
        return merged;
      });
    }
  }, [templateFields]);

  // Load field values when editing
  useEffect(() => {
    if (existingFieldValues.length > 0) {
      const values: Record<string, any> = {};
      existingFieldValues.forEach((fv) => {
        if (fv.textValue) {
          values[fv.fieldId] = fv.textValue;
        } else if (fv.attendeeIds) {
          values[fv.fieldId] = fv.attendeeIds;
        } else if (fv.locationId) {
          values[fv.fieldId] = fv.locationId;
        }
      });
      setFieldValues((prev) => ({ ...prev, ...values }));
    }
  }, [existingFieldValues]);

  const saveMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isNewMeeting) {
        return apiRequest('POST', '/api/meetings', data);
      } else {
        return apiRequest('PATCH', `/api/meetings/${id}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Success",
        description: isNewMeeting ? "Meeting created successfully" : "Meeting updated successfully",
      });
      setLocation('/meetings');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Meeting deleted",
        description: "The meeting has been deleted successfully",
      });
      setLocation('/meetings');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedTemplateId) {
      toast({
        title: "Error",
        description: "Please select a meeting type",
        variant: "destructive",
      });
      return;
    }

    if (!meetingDate) {
      toast({
        title: "Error",
        description: "Please select a meeting date",
        variant: "destructive",
      });
      return;
    }

    // Generate default title if not provided
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const defaultTitle = selectedTemplate 
      ? `${selectedTemplate.name} - ${format(new Date(meetingDate), "d MMMM yyyy")}`
      : null;

    // Prepare field values - include existing IDs when editing to avoid duplicates
    const fieldValuesArray = templateFields.map((field) => {
      const value = fieldValues[field.id];
      const existingValue = existingFieldValues.find(fv => fv.fieldId === field.id);
      const fieldValue: any = {
        fieldId: field.id,
      };

      // Include existing ID if editing to enable updates instead of inserts
      if (existingValue) {
        fieldValue.id = existingValue.id;
      }

      if (field.fieldType === 'attendees' && Array.isArray(value)) {
        fieldValue.attendeeIds = value;
      } else if (field.fieldType === 'location') {
        fieldValue.locationId = value || null;
      } else {
        fieldValue.textValue = value || null;
      }

      return fieldValue;
    });

    saveMeetingMutation.mutate({
      templateId: selectedTemplateId,
      meetingDate,
      title: title || defaultTitle,
      fieldValues: fieldValuesArray,
    });
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const renderField = (field: MeetingTemplateField) => {
    const value = fieldValues[field.id] || "";

    switch (field.fieldType) {
      case 'richtext':
      case 'text':
        return (
          <div key={field.id} className="space-y-2 flex-1 flex flex-col">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex-1">
              <RichTextEditor
                content={value}
                onChange={(html) => handleFieldChange(field.id, html)}
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              data-testid={`input-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="time"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              data-testid={`input-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        );

      case 'location':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)} data-testid={`select-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)} data-testid={`select-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.fieldName.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.dropdownOptions?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'attendees':
        const selectedAttendees = Array.isArray(value) ? value : [];
        const selectedUsers = users.filter(u => selectedAttendees.includes(u.id));
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between" 
                  data-testid={`button-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="truncate">
                    {selectedUsers.length > 0 
                      ? selectedUsers.map(u => u.preferredName || u.firstName).join(', ')
                      : 'Select attendees'
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => {
                    const isSelected = selectedAttendees.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFieldChange(field.id, [...selectedAttendees, user.id]);
                            } else {
                              handleFieldChange(field.id, selectedAttendees.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {user.preferredName || user.firstName} {user.lastName}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );

      default:
        return null;
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive === 1);
  const sortedFields = [...templateFields].sort((a, b) => a.sortOrder - b.sortOrder);

  if (meetingLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center" data-testid="text-loading">
          <p className="text-muted-foreground">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6 h-full">
          <div className="flex items-center gap-4">
            <Link href="/meetings">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                {isNewMeeting ? "New Meeting" : "Edit Meeting"}
              </h1>
              <p className="text-muted-foreground">
                {isNewMeeting ? "Create a new meeting note" : "Update meeting details"}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" data-testid="label-meeting-title">
                  Meeting
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    selectedTemplateId 
                      ? `${templates.find(t => t.id === selectedTemplateId)?.name || ""} - ${format(new Date(meetingDate), "d MMMM yyyy")}`
                      : "Enter meeting title"
                  }
                  data-testid="input-meeting-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" data-testid="label-meeting-date">
                  Meeting Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  data-testid="input-meeting-date"
                />
              </div>
            </CardContent>
          </Card>

          {selectedTemplateId && sortedFields.length > 0 && (
            <Card className="flex flex-col flex-1">
              <CardHeader>
                <CardTitle>Meeting Notes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {sortedFields.map((field) => renderField(field))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between gap-4">
            {!isNewMeeting && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteMeetingMutation.isPending}
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMeetingMutation.isPending ? "Deleting..." : "Delete Meeting"}
              </Button>
            )}
            <div className="flex gap-4 ml-auto">
              {!isNewMeeting && (
                <a href={`/api/meetings/${id}/pdf`} download>
                  <Button variant="outline" data-testid="button-export-pdf">
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </a>
              )}
              <Button
                onClick={handleSave}
                disabled={saveMeetingMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMeetingMutation.isPending ? "Saving..." : "Save Meeting"}
              </Button>
              <Link href="/meetings">
                <Button variant="outline" data-testid="button-cancel">Cancel</Button>
              </Link>
            </div>
          </div>
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
            <AlertDialogCancel data-testid="button-cancel-delete" disabled={deleteMeetingMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMeetingMutation.mutate()} 
              disabled={deleteMeetingMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMeetingMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
