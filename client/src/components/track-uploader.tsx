import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, X, Music, Image, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TrackUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = 'form' | 'uploading-audio' | 'uploading-cover' | 'submitting' | 'complete';

export function TrackUploader({ open, onOpenChange }: TrackUploaderProps) {
  const { toast } = useToast();
  
  const [step, setStep] = useState<UploadStep>('form');
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioUploadedUrl, setAudioUploadedUrl] = useState<string | null>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadedUrl, setCoverUploadedUrl] = useState<string | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  
  const MAX_AUDIO_SIZE = 20 * 1024 * 1024;
  const MAX_COVER_SIZE = 5 * 1024 * 1024;
  const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac'];
  const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const cleanupCoverPreview = useCallback(() => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl(null);
    }
  }, [coverPreviewUrl]);

  const resetForm = useCallback(() => {
    setStep('form');
    setError(null);
    setTitle('');
    setDescription('');
    setGenre('');
    setAudioFile(null);
    setAudioDuration(0);
    setAudioUploadProgress(0);
    setAudioUploadedUrl(null);
    setCoverFile(null);
    cleanupCoverPreview();
    setCoverUploadProgress(0);
    setCoverUploadedUrl(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  }, [cleanupCoverPreview]);

  useEffect(() => {
    return () => {
      cleanupCoverPreview();
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.size > MAX_AUDIO_SIZE) {
      setError(`Audio file must be less than ${MAX_AUDIO_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setError('Invalid audio format. Please use MP3, WAV, or FLAC.');
      return;
    }
    
    setError(null);
    setAudioFile(file);
    
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setAudioDuration(Math.round(audio.duration));
      URL.revokeObjectURL(audio.src);
    };
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.size > MAX_COVER_SIZE) {
      setError(`Cover image must be less than ${MAX_COVER_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setError('Invalid image format. Please use JPG, PNG, or WebP.');
      return;
    }
    
    setError(null);
    cleanupCoverPreview();
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const uploadFile = async (
    file: File,
    endpoint: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const res = await apiRequest('POST', endpoint, {});
    const { uploadURL } = await res.json();
    
    const isLocalUpload = uploadURL.startsWith('/api/upload/local/');
    
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    
    const responseText = await new Promise<string>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText || '');
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload was cancelled'));
      
      xhr.open('PUT', uploadURL, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
    
    xhrRef.current = null;
    
    if (isLocalUpload && responseText) {
      try {
        const { objectPath } = JSON.parse(responseText);
        if (objectPath) return objectPath;
      } catch {
      }
    }
    
    return uploadURL.split('?')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !genre.trim() || !audioFile) {
      setError('Please fill in all required fields and select an audio file.');
      return;
    }
    
    setError(null);
    
    try {
      setStep('uploading-audio');
      const audioUrl = await uploadFile(
        audioFile,
        '/api/tracks/uploads/audio',
        setAudioUploadProgress
      );
      setAudioUploadedUrl(audioUrl);
      
      let coverUrl: string | undefined;
      if (coverFile) {
        setStep('uploading-cover');
        coverUrl = await uploadFile(
          coverFile,
          '/api/tracks/uploads/cover',
          setCoverUploadProgress
        );
        setCoverUploadedUrl(coverUrl);
      }
      
      setStep('submitting');
      const trackRes = await apiRequest('POST', '/api/tracks', {
        title: title.trim(),
        description: description.trim() || null,
        genre: genre.trim(),
        audioUrl,
        coverImageUrl: coverUrl || null,
        durationSeconds: audioDuration || 180,
      });
      
      if (!trackRes.ok) {
        const errorData = await trackRes.json();
        throw new Error(errorData.error || 'Failed to create track');
      }
      
      setStep('complete');
      
      queryClient.invalidateQueries({ queryKey: ['/api/artist/tracks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artist/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/latest'] });
      
      toast({ title: 'Track uploaded successfully!' });
      
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload track');
      setStep('form');
    }
  };

  const isUploading = step !== 'form' && step !== 'complete';

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isUploading) {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => isUploading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Upload New Track</DialogTitle>
          <DialogDescription>
            Upload your music directly. Audio files up to 20MB (MP3, WAV, FLAC).
          </DialogDescription>
        </DialogHeader>
        
        {step === 'complete' ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
            <p className="text-muted-foreground">Your track is now live.</p>
          </div>
        ) : isUploading ? (
          <div className="py-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {step === 'uploading-audio' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : audioUploadedUrl ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Uploading audio file</span>
              </div>
              <Progress value={step === 'uploading-audio' ? audioUploadProgress : audioUploadedUrl ? 100 : 0} />
            </div>
            
            {coverFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {step === 'uploading-cover' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : coverUploadedUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Uploading cover art</span>
                </div>
                <Progress value={step === 'uploading-cover' ? coverUploadProgress : coverUploadedUrl ? 100 : 0} />
              </div>
            )}
            
            {step === 'submitting' && (
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Creating track...</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audio-upload">Audio File *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate transition-colors"
                  onClick={() => audioInputRef.current?.click()}
                >
                  {audioFile ? (
                    <div className="flex items-center gap-3">
                      <Music className="h-8 w-8 text-primary" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          {audioDuration > 0 && ` • ${Math.floor(audioDuration / 60)}:${(audioDuration % 60).toString().padStart(2, '0')}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioFile(null);
                          setAudioDuration(0);
                          if (audioInputRef.current) audioInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select audio</p>
                      <p className="text-xs text-muted-foreground">MP3, WAV, FLAC up to 20MB</p>
                    </>
                  )}
                </div>
                <Input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/x-wav,audio/flac"
                  onChange={handleAudioSelect}
                  className="hidden"
                  data-testid="input-audio-file"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cover-upload">Cover Art (Optional)</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreviewUrl ? (
                    <div className="relative">
                      <img 
                        src={coverPreviewUrl} 
                        alt="Cover preview" 
                        className="w-24 h-24 object-cover rounded mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          cleanupCoverPreview();
                          setCoverFile(null);
                          if (coverInputRef.current) coverInputRef.current.value = '';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select cover</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p>
                    </>
                  )}
                </div>
                <Input
                  ref={coverInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleCoverSelect}
                  className="hidden"
                  data-testid="input-cover-file"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                required
                data-testid="input-track-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Pop, Hip-Hop, Electronic"
                required
                data-testid="input-track-genre"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about this track..."
                rows={3}
                data-testid="input-track-description"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!audioFile || !title.trim() || !genre.trim()} data-testid="button-submit-track">
                <Upload className="h-4 w-4 mr-2" />
                Upload Track
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
