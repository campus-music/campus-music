import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { SearchableFilter } from '@/components/searchable-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Music } from 'lucide-react';
import type { TrackWithArtist } from '@shared/schema';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Indie', 'Jazz', 'Classical'];
const UNIVERSITIES = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Oxford', 'Yale', 'Princeton'];

export default function AllTrending() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

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
          <h1 className="text-4xl font-bold">Trending Songs</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          The hottest tracks from student artists right now
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <SearchableFilter
          label="Filter by Genre"
          options={GENRES}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          placeholder="Search or select genre..."
          testIdPrefix="genre"
        />
        <SearchableFilter
          label="Filter by University"
          options={UNIVERSITIES}
          selected={selectedUniversity}
          onSelect={setSelectedUniversity}
          placeholder="Search or select university..."
          testIdPrefix="university"
        />
      </div>

      <div className="space-y-1">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))
        ) : filteredTracks.length > 0 ? (
          filteredTracks.map((track, index) => (
            <TrackListItem key={track.id} track={track} index={index} />
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{selectedGenre || selectedUniversity ? 'No tracks match your filters' : 'No trending tracks available'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
