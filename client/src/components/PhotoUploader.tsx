import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Upload, Loader2, Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

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
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  }, []);

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
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBlob = await createCroppedImage(preview, croppedAreaPixels);
      
      if (croppedBlob.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Cropped image is larger than 10MB. Please try a different crop.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

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
        body: croppedBlob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      const url = new URL(uploadURL);
      const pathParts = url.pathname.split('/').filter(p => p);
      const objectPath = pathParts.slice(2).join('/');
      const displayPath = `/objects/${objectPath}`;
      
      onUploadComplete(displayPath);
      
      toast({
        title: "Upload Successful",
        description: "Photo uploaded successfully.",
      });
      
      handleCancel();
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
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
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

      <Dialog open={showDialog} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent data-testid="dialog-photo-upload" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Artist Photo</DialogTitle>
            <DialogDescription>
              {showCropper ? "Adjust the position and zoom of your photo." : "Select a photo to upload. Maximum file size: 10MB."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {showCropper && preview ? (
              <>
                <div className="relative w-full h-80 bg-muted rounded-md overflow-hidden">
                  <Cropper
                    image={preview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Zoom</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetCrop}
                      data-testid="button-reset-crop"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                    data-testid="slider-zoom"
                  />
                </div>

                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
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
              disabled={!croppedAreaPixels || uploading}
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
