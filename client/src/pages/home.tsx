import { useQuery } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrackWithArtist } from '@shared/schema';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function Home() {
  const { data: latestTracks, isLoading: latestLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
  });

  const { data: trendingTracks, isLoading: trendingLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: bestOfCampus, isLoading: bestLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/best-of-campus'],
  });

  return (
    <div className="space-y-12 pb-32">
      <section>
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Welcome to Campus Music</h1>
          <p className="text-muted-foreground text-lg">
            Discover music from student artists worldwide
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Best of Campus 2025</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {bestLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-48 flex-shrink-0 rounded-lg" />
              ))
            ) : bestOfCampus && bestOfCampus.length > 0 ? (
              bestOfCampus.slice(0, 6).map((track) => (
                <div key={track.id} className="w-48 flex-shrink-0">
                  <TrackCard track={track} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground w-full">
                No tracks available yet
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Latest Songs</h2>
        <div className="space-y-2">
          {latestLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))
          ) : latestTracks && latestTracks.length > 0 ? (
            latestTracks.slice(0, 10).map((track, index) => (
              <TrackListItem key={track.id} track={track} index={index} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No tracks available yet
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Trending on Campus</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {trendingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-48 flex-shrink-0 rounded-lg" />
              ))
            ) : trendingTracks && trendingTracks.length > 0 ? (
              trendingTracks.slice(0, 6).map((track) => (
                <div key={track.id} className="w-48 flex-shrink-0">
                  <TrackCard track={track} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground w-full">
                No trending tracks yet
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    </div>
  );
}
