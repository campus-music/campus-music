import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TrackWithArtist } from '@shared/schema';

export default function NewReleases() {
  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
  });

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/liked'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/liked'] });
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
      <div>
        <h1 className="text-4xl font-bold mb-2">New Releases</h1>
        <p className="text-muted-foreground text-lg">
          Fresh tracks from student artists around the world
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))
        ) : tracks && tracks.length > 0 ? (
          tracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track}
              isLiked={likedTrackIds.has(track.id)}
              onLike={() => handleLike(track.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            No new releases available yet
          </div>
        )}
      </div>
    </div>
  );
}
