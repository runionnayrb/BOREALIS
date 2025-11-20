import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReportHeader from "@/components/ReportHeader";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import type { MeetingTemplate, MeetingTemplateField, Meeting, MeetingFieldValue, Location, SafeUser } from "@shared/schema";
import { format } from "date-fns";

export default function MeetingEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isNewMeeting = !id;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Fetch meeting templates
  const { data: templates = [] } = useQuery<MeetingTemplate[]>({
    queryKey: ['/api/meeting-templates'],
  });

  // Fetch template fields
  const { data: templateFields = [] } = useQuery<MeetingTemplateField[]>({
    queryKey: ['/api/meeting-template-fields', selectedTemplateId],
    enabled: !!selectedTemplateId,
  });

  // Fetch meeting if editing
  const { data: meeting, isLoading: meetingLoading } = useQuery<Meeting>({
    queryKey: ['/api/meetings', id],
    enabled: !!id && !isNewMeeting,
  });

  // Fetch field values if editing
  const { data: existingFieldValues = [] } = useQuery<MeetingFieldValue[]>({
    queryKey: ['/api/meetings', id, 'field-values'],
    enabled: !!id && !isNewMeeting,
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
      setFieldValues(values);
    }
  }, [existingFieldValues]);

  const saveMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isNewMeeting) {
        return apiRequest('/api/meetings', 'POST', data);
      } else {
        return apiRequest(`/api/meetings/${id}`, 'PATCH', data);
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

    // Prepare field values
    const fieldValuesArray = templateFields.map((field) => {
      const value = fieldValues[field.id];
      const fieldValue: any = {
        fieldId: field.id,
      };

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
      title: title || null,
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
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.fieldType === 'richtext' ? (
              <Textarea
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                rows={6}
                data-testid={`textarea-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ) : (
              <Input
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                data-testid={`input-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
              />
            )}
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
        // Simplified attendees - showing as comma-separated for now
        // TODO: Implement proper multi-select component
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} data-testid={`label-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
              {field.fieldName}
              {field.required === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => {
                const ids = e.target.value.split(',').map((id) => id.trim()).filter(Boolean);
                handleFieldChange(field.id, ids);
              }}
              placeholder="Enter user IDs separated by commas (temporary)"
              data-testid={`input-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`}
            />
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
        <ReportHeader dateString={format(new Date(), "MMMM d, yyyy")} />
        <div className="flex-1 flex items-center justify-center" data-testid="text-loading">
          <p className="text-muted-foreground">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ReportHeader dateString={format(new Date(), "MMMM d, yyyy")} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
                <Label htmlFor="template" data-testid="label-meeting-type">
                  Meeting Type <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={selectedTemplateId} 
                  onValueChange={setSelectedTemplateId}
                  disabled={!isNewMeeting}
                  data-testid="select-meeting-type"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label htmlFor="title" data-testid="label-custom-title">
                  Custom Title (Optional)
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Leave blank to use meeting type name"
                  data-testid="input-custom-title"
                />
              </div>
            </CardContent>
          </Card>

          {selectedTemplateId && sortedFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedFields.map((field) => renderField(field))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
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
  );
}
