import { Play, Heart, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { TrackWithArtist } from '@shared/schema';
import { useAudioPlayer } from '@/lib/audio-player-context';
import { cn } from '@/lib/utils';
import { AddToPlaylist } from './add-to-playlist';

interface TrackListItemProps {
  track: TrackWithArtist;
  index?: number;
  onLike?: () => void;
  isLiked?: boolean;
}

export function TrackListItem({ track, index, onLike, isLiked }: TrackListItemProps) {
  const { playTrack, currentTrack } = useAudioPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-3 rounded-md hover-elevate transition-all",
        isCurrentTrack && "bg-primary/10"
      )}
      data-testid={`track-item-${track.id}`}
    >
      {index !== undefined && (
        <span className="text-sm text-muted-foreground w-8 text-center">
          {index + 1}
        </span>
      )}
      <div className="relative cursor-pointer" onClick={() => playTrack(track)}>
        <Avatar className="h-12 w-12 rounded-md">
          <AvatarImage src={track.coverImageUrl || undefined} alt={track.title} />
          <AvatarFallback className="rounded-md bg-primary/20">{track.title[0]}</AvatarFallback>
        </Avatar>
        <div
          className="absolute inset-0 h-12 w-12 rounded-md bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-play-${track.id}`}
        >
          <Play className="h-5 w-5 text-white fill-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" data-testid={`text-track-title-${track.id}`}>
          {track.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {track.artist.stageName}
        </p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {track.universityName}
      </Badge>
      <span className="text-sm text-muted-foreground w-16 text-right">
        {formatDuration(track.durationSeconds)}
      </span>
      {onLike && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onLike}
          data-testid={`button-like-${track.id}`}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current text-primary")} />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" data-testid={`button-menu-${track.id}`}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <AddToPlaylist trackId={track.id} trackTitle={track.title} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
