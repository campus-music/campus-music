import { useQuery } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrackWithArtist } from '@shared/schema';

export default function NewReleases() {
  const { data: tracks, isLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
  });

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
            <TrackCard key={track.id} track={track} />
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
