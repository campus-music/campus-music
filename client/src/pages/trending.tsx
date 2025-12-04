import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TrackWithArtist } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Trending() {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');

  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: genres } = useQuery<string[]>({
    queryKey: ['/api/genres'],
  });

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/user/liked-tracks'],
  });

  const [localLikedIds, setLocalLikedIds] = useState<Set<string>>(new Set());
  
  const likedTrackIds = new Set([
    ...(likedTracks?.map(t => t.id) || []),
    ...Array.from(localLikedIds)
  ]);

  const universities = useMemo(() => {
    if (!tracks) return [];
    const uniqueUniversities = new Set<string>();
    tracks.forEach(track => {
      if (track.universityName) {
        uniqueUniversities.add(track.universityName);
      }
    });
    return Array.from(uniqueUniversities).sort();
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter(track => {
      const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
      const matchesUniversity = selectedUniversity === 'all' || track.universityName === selectedUniversity;
      return matchesGenre && matchesUniversity;
    });
  }, [tracks, selectedGenre, selectedUniversity]);

  const hasActiveFilters = selectedGenre !== 'all' || selectedUniversity !== 'all';

  const clearFilters = () => {
    setSelectedGenre('all');
    setSelectedUniversity('all');
  };

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-[160px]" data-testid="select-genre-filter">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genres?.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
          <SelectTrigger className="w-[200px]" data-testid="select-university-filter">
            <SelectValue placeholder="All Universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map((university) => (
              <SelectItem key={university} value={university}>
                {university}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}

        {hasActiveFilters && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))
        ) : filteredTracks.length > 0 ? (
          filteredTracks.map((track, index) => (
            <TrackListItem 
              key={track.id} 
              track={track} 
              index={index}
              isLiked={likedTrackIds.has(track.id)}
              onLike={() => handleLike(track.id)}
            />
          ))
        ) : hasActiveFilters ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No tracks match your filters</p>
            <Button variant="ghost" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No trending tracks available yet
          </div>
        )}
      </div>
    </div>
  );
}
