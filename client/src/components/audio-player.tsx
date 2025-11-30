import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/lib/audio-player-context';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthPromptModal } from '@/components/auth-prompt-modal';

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isPreviewMode,
    previewEnded,
    togglePlayPause,
    seekTo,
    setVolume,
    nextTrack,
    previousTrack,
    resetPreviewEnded,
  } = useAudioPlayer();
  
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    if (previewEnded) {
      setAuthPromptOpen(true);
      resetPreviewEnded();
    }
  }, [previewEnded, resetPreviewEnded]);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayDuration = isPreviewMode ? Math.min(duration, 30) : duration;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-card-border z-50">
        <div className="px-4 py-2">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-14 w-14 rounded-md">
                <AvatarImage src={currentTrack.coverImageUrl || undefined} alt={currentTrack.title} />
                <AvatarFallback className="rounded-md">{currentTrack.title[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid="text-current-track-title">{currentTrack.title}</p>
                <p className="text-sm text-muted-foreground truncate" data-testid="text-current-artist-name">
                  {currentTrack.artist.stageName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentTrack.universityName}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={previousTrack}
                  data-testid="button-previous-track"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={togglePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={nextTrack}
                  data-testid="button-next-track"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={displayDuration || 100}
                  step={1}
                  onValueChange={([value]) => seekTo(value)}
                  className="flex-1"
                  data-testid="slider-seek"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {formatTime(displayDuration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value / 100)}
                className="w-24"
                data-testid="slider-volume"
              />
            </div>
          </div>
        </div>
      </div>
      
      <AuthPromptModal 
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        action="play"
        track={{
          coverImageUrl: currentTrack.coverImageUrl,
          title: currentTrack.title,
          artistName: currentTrack.artist.stageName,
        }}
      />
    </>
  );
}
