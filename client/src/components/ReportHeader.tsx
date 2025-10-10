import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="border border-border rounded-md p-6 bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="left-image">Left Image</Label>
          <div className="flex flex-col gap-2">
            <Input
              id="left-image"
              type="text"
              placeholder="Image URL"
              value={leftImageUrl || ''}
              onChange={(e) => onLeftImageChange?.(e.target.value)}
              data-testid="input-left-image"
            />
            <Button variant="outline" size="sm" data-testid="button-upload-left">
              <Upload className="w-4 h-4 mr-2" />
              Upload
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
              placeholder="Image URL"
              value={rightImageUrl || ''}
              onChange={(e) => onRightImageChange?.(e.target.value)}
              data-testid="input-right-image"
            />
            <Button variant="outline" size="sm" data-testid="button-upload-right">
              <Upload className="w-4 h-4 mr-2" />
              Upload
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
