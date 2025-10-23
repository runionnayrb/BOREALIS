import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploaderProps {
  onUploadComplete: (photoUrl: string) => void;
  currentPhotoUrl?: string;
  className?: string;
}

export function PhotoUploader({ onUploadComplete, currentPhotoUrl, className }: PhotoUploaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadResponse = await fetch("/api/photos/upload", {
        method: "POST",
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await uploadResponse.json();

      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      // Extract the object path from the GCS URL and convert to /objects/... format
      // The uploadURL is like: https://storage.googleapis.com/bucket-name/private/artist-photos/uuid
      // We need to convert it to: /objects/artist-photos/uuid
      // The server's getObjectEntityFile will add the 'private/' prefix back
      const url = new URL(uploadURL);
      const pathParts = url.pathname.split('/').filter(p => p);
      // Skip bucket-name and 'private', keep 'artist-photos/uuid'
      const objectPath = pathParts.slice(2).join('/');
      const displayPath = `/objects/${objectPath}`;
      
      onUploadComplete(displayPath);
      
      toast({
        title: "Upload Successful",
        description: "Photo uploaded successfully.",
      });
      
      setShowDialog(false);
      setPreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={className}
        data-testid="button-upload-photo"
      >
        <Upload className="w-4 h-4 mr-2" />
        {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="dialog-photo-upload">
          <DialogHeader>
            <DialogTitle>Upload Artist Photo</DialogTitle>
            <DialogDescription>
              Select a photo to upload. Maximum file size: 10MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-contain rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                  data-testid="input-photo-file"
                />
              </label>
            </div>

            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={uploading}
              data-testid="button-cancel-upload"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              data-testid="button-confirm-upload"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
