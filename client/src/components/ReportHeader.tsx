import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReportHeaderProps {
  leftImageUrl?: string;
  middleTitle?: string;
  rightImageUrl?: string;
  dateString: string;
  onLeftImageChange?: (url: string) => void;
  onMiddleTitleChange?: (title: string) => void;
  onRightImageChange?: (url: string) => void;
}

export default function ReportHeader({
  leftImageUrl,
  middleTitle = "Training Report",
  rightImageUrl,
  dateString,
  onLeftImageChange,
  onMiddleTitleChange,
  onRightImageChange,
}: ReportHeaderProps) {
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onImageChange?: (url: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      event.target.value = ''; // Clear input
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      event.target.value = ''; // Clear input
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      onImageChange?.(base64String);
      toast({
        title: "Image uploaded successfully",
      });
      event.target.value = ''; // Clear input to allow re-uploading same file
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to read the image file",
        variant: "destructive",
      });
      event.target.value = ''; // Clear input
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-border rounded-md p-4 md:p-6 bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="left-image">Left Image</Label>
          <div className="flex flex-col gap-2">
            <Input
              id="left-image"
              type="text"
              placeholder="Image URL or upload below"
              value={leftImageUrl || ''}
              onChange={(e) => onLeftImageChange?.(e.target.value)}
              data-testid="input-left-image"
            />
            <input
              ref={leftFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, onLeftImageChange)}
              data-testid="file-input-left"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => leftFileInputRef.current?.click()}
              data-testid="button-upload-left"
            >
              <Upload className="w-4 h-4 mr-2 text-foreground" />
              Upload Image
            </Button>
            {leftImageUrl && (
              <img
                src={leftImageUrl}
                alt="Left header"
                className="w-full h-24 object-contain border border-border rounded"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="middle-title">Center Title</Label>
          <Input
            id="middle-title"
            type="text"
            value={middleTitle}
            onChange={(e) => onMiddleTitleChange?.(e.target.value)}
            data-testid="input-middle-title"
          />
          <p className="text-sm text-muted-foreground" data-testid="text-date-string">
            {dateString}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="right-image">Right Image</Label>
          <div className="flex flex-col gap-2">
            <Input
              id="right-image"
              type="text"
              placeholder="Image URL or upload below"
              value={rightImageUrl || ''}
              onChange={(e) => onRightImageChange?.(e.target.value)}
              data-testid="input-right-image"
            />
            <input
              ref={rightFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, onRightImageChange)}
              data-testid="file-input-right"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => rightFileInputRef.current?.click()}
              data-testid="button-upload-right"
            >
              <Upload className="w-4 h-4 mr-2 text-foreground" />
              Upload Image
            </Button>
            {rightImageUrl && (
              <img
                src={rightImageUrl}
                alt="Right header"
                className="w-full h-24 object-contain border border-border rounded"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
