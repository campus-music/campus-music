import { useQuery } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { TrackWithArtist } from '@shared/schema';

export default function Trending() {
  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Trending Songs</h1>
          <p className="text-muted-foreground text-lg">
            Most popular tracks on campus right now
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))
        ) : tracks && tracks.length > 0 ? (
          tracks.map((track, index) => (
            <TrackListItem key={track.id} track={track} index={index} />
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No trending tracks available yet
          </div>
        )}
      </div>
    </div>
  );
}
