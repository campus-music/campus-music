import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { SearchableFilter } from '@/components/searchable-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Music } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TrackWithArtist } from '@shared/schema';

export default function BestOfCampus() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
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

  // Extract unique genres and universities from top 100 trending tracks for better filter variety
  const top100Tracks = tracks?.slice(0, 100) || [];
  const availableGenres = Array.from(new Set(top100Tracks.map(t => t.genre))).sort();
  const availableUniversities = Array.from(new Set(top100Tracks.map(t => t.universityName))).sort();

  const filteredTracks = tracks?.filter(track => {
    if (selectedGenre && track.genre !== selectedGenre) return false;
    if (selectedUniversity && track.universityName !== selectedUniversity) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-8 pb-32">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Best of Campus 2025</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Top hits from universities around the world this year
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <SearchableFilter
          label="Filter by Genre"
          options={availableGenres}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          placeholder="Search or select genre..."
          testIdPrefix="genre"
        />
        <SearchableFilter
          label="Filter by University"
          options={availableUniversities}
          selected={selectedUniversity}
          onSelect={setSelectedUniversity}
          placeholder="Search or select university..."
          testIdPrefix="university"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))
        ) : filteredTracks.length > 0 ? (
          filteredTracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track}
              isLiked={likedTrackIds.has(track.id)}
              onLike={() => handleLike(track.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{selectedGenre || selectedUniversity ? 'No tracks match your filters' : 'No tracks available'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
