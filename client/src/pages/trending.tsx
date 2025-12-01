import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { TrackWithArtist } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Trending() {
  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/user/liked-tracks'],
  });

  const [localLikedIds, setLocalLikedIds] = useState<Set<string>>(new Set());
  
  const likedTrackIds = new Set([
    ...(likedTracks?.map(t => t.id) || []),
    ...Array.from(localLikedIds)
  ]);

  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest('DELETE', `/api/tracks/${trackId}/like`, {});
      } else {
        await apiRequest('POST', `/api/tracks/${trackId}/like`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/liked-tracks'] });
    },
  });

  const handleLike = (trackId: string) => {
    const isLiked = likedTrackIds.has(trackId);
    
    setLocalLikedIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
    
    likeMutation.mutate({ trackId, isLiked });
  };

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
            <TrackListItem 
              key={track.id} 
              track={track} 
              index={index}
              isLiked={likedTrackIds.has(track.id)}
              onLike={() => handleLike(track.id)}
            />
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
