import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, X, Image, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: {
    successful: Array<{ uploadURL: string }>;
    failed: Array<{ error: string }>;
  }) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
  disabled?: boolean;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  allowedFileTypes = ['image/*'],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  buttonVariant = "default",
  buttonSize = "default",
  children,
  disabled = false,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const cleanupPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const resetState = useCallback(() => {
    cleanupPreview();
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setUploading(false);
    resetFileInput();
  }, [cleanupPreview, resetFileInput]);

  useEffect(() => {
    return () => {
      cleanupPreview();
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > maxNumberOfFiles) {
      setError(`You can only upload ${maxNumberOfFiles} file${maxNumberOfFiles > 1 ? 's' : ''} at a time`);
      resetFileInput();
      return;
    }

    const file = files[0];
    
    if (file.size > maxFileSize) {
      setError(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      resetFileInput();
      return;
    }

    cleanupPreview();
    setError(null);
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const { url } = await onGetUploadParameters();

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload was cancelled'));
        
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', selectedFile.type);
        xhr.send(selectedFile);
      });

      xhrRef.current = null;

      onComplete?.({
        successful: [{ uploadURL: url.split('?')[0] }],
        failed: [],
      });

      resetState();
      setShowModal(false);
    } catch (err: any) {
      setUploading(false);
      if (err.message !== 'Upload was cancelled') {
        setError(err.message || 'Failed to upload file. Please try again.');
        onComplete?.({
          successful: [],
          failed: [{ error: err.message }],
        });
      }
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setError('Upload cancelled. You can try again or close this dialog.');
  };

  const handleClose = () => {
    if (uploading) {
      return;
    }
    resetState();
    setShowModal(false);
  };

  const handleRemoveFile = () => {
    cleanupPreview();
    setSelectedFile(null);
    setError(null);
    resetFileInput();
  };

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled}
        data-testid="button-upload"
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => uploading && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Select an image file to upload. Maximum size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click to select a file or drag and drop
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {previewUrl && (
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {!uploading && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                {!previewUrl && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading... {uploadProgress}%</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCancelUpload}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Input
              ref={fileInputRef}
              type="file"
              accept={allowedFileTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
