import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TrackWithArtist } from '@shared/schema';

export default function Recommendations() {
  const { data: recommendations, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/user/recommendations'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/user/recommendations'] });
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
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Recommended For You</h1>
          <p className="text-muted-foreground text-lg">
            Personalized recommendations based on your taste
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))
        ) : recommendations && recommendations.length > 0 ? (
          recommendations.map((track) => {
            const isLiked = likedTrackIds.has(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                isLiked={isLiked}
                onLike={() => handleLike(track.id)}
                data-testid={`card-recommendation-${track.id}`}
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            Like more tracks to get better recommendations
          </div>
        )}
      </div>
    </div>
  );
}
