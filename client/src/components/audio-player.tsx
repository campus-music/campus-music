import { useState, useEffect } from 'react';
import { Link } from 'wouter';
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
      <div className="sticky bottom-0 bg-card/95 backdrop-blur-lg border-t border-card-border z-50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0 w-56">
              <Avatar className="h-10 w-10 rounded-md flex-shrink-0">
                <AvatarImage src={currentTrack.coverImageUrl || undefined} alt={currentTrack.title} />
                <AvatarFallback className="rounded-md">{currentTrack.title[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm" data-testid="text-current-track-title">{currentTrack.title}</p>
                <Link 
                  href={`/artist/${currentTrack.artist.id}`}
                  className="text-xs text-muted-foreground truncate hover:text-primary hover:underline block"
                  data-testid="link-current-artist"
                >
                  {currentTrack.artist.stageName}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-center">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={previousTrack}
                data-testid="button-previous-track"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9"
                onClick={togglePlayPause}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={nextTrack}
                data-testid="button-next-track"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={displayDuration || 100}
                step={1}
                onValueChange={([value]) => seekTo(value)}
                className="w-32"
                data-testid="slider-seek"
              />
              <span className="text-xs text-muted-foreground w-8">
                {formatTime(displayDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value / 100)}
                className="w-20"
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
