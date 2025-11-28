import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { SearchableFilter } from '@/components/searchable-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';
import type { TrackWithArtist } from '@shared/schema';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Indie', 'Jazz', 'Classical'];
const UNIVERSITIES = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Oxford', 'Yale', 'Princeton'];

export default function AllReleases() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
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
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Fresh Releases</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          The latest tracks from student artists
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))
        ) : filteredTracks.length > 0 ? (
          filteredTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{selectedGenre || selectedUniversity ? 'No tracks match your filters' : 'No releases available'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
