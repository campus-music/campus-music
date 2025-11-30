import { useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { TrackWithArtist } from '@shared/schema';
import { useAudioPlayer } from '@/lib/audio-player-context';
import { useAuth } from '@/lib/auth-context';
import { AuthPromptModal } from '@/components/auth-prompt-modal';
import { cn } from '@/lib/utils';

interface TrackCardProps {
  track: TrackWithArtist;
  onLike?: () => void;
  isLiked?: boolean;
}

export function TrackCard({ track, onLike, isLiked }: TrackCardProps) {
  const { playTrack, currentTrack } = useAudioPlayer();
  const { user } = useAuth();
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const isCurrentTrack = currentTrack?.id === track.id;

  const handleLike = () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    onLike?.();
  };

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden hover-elevate transition-all",
          isCurrentTrack && "ring-2 ring-primary"
        )}
        data-testid={`card-track-${track.id}`}
      >
        <div className="relative aspect-square">
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage 
              src={track.coverImageUrl || undefined} 
              alt={track.title}
              className="object-cover"
            />
            <AvatarFallback className="rounded-none bg-gradient-to-br from-primary/20 to-primary/5">
              {track.title[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => playTrack(track)}
              data-testid={`button-play-${track.id}`}
            >
              <Play className="h-6 w-6 ml-0.5" />
            </Button>
          </div>
          {(onLike || !user) && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleLike}
              data-testid={`button-like-${track.id}`}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current text-primary")} />
            </Button>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate" data-testid={`text-track-title-${track.id}`}>
            {track.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-artist-name-${track.id}`}>
            {track.artist.stageName}
          </p>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs max-w-full truncate">
              {track.universityName}
            </Badge>
          </div>
        </div>
      </Card>
      
      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        action="like"
        track={{
          coverImageUrl: track.coverImageUrl,
          title: track.title,
          artistName: track.artist.stageName,
        }}
      />
    </>
  );
}
