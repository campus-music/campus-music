import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { TrackListItem } from '@/components/track-list-item';
import { SearchableFilter } from '@/components/searchable-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Music, Flame, Star } from 'lucide-react';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Indie', 'Jazz', 'Classical'];
const UNIVERSITIES = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Oxford', 'Yale', 'Princeton'];

export default function Home() {
  const { toast } = useToast();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const { data: latestTracks, isLoading: latestLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
  });

  const { data: trendingTracks, isLoading: trendingLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: allArtists, isLoading: artistsLoading } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/user/liked-tracks'],
  });

  const likedTrackIds = new Set(likedTracks?.map(t => t.id) || []);

  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest('DELETE', `/api/tracks/${trackId}/like`, {});
      } else {
        await apiRequest('POST', `/api/tracks/${trackId}/like`, {});
      }
    },
    onSuccess: (_, { isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/liked-tracks'] });
      toast({ title: isLiked ? 'Removed from liked tracks' : 'Added to liked tracks' });
    },
  });

  const handleLike = (trackId: string) => {
    const isLiked = likedTrackIds.has(trackId);
    likeMutation.mutate({ trackId, isLiked });
  };

  const topArtists = allArtists
    ? [...allArtists].sort((a, b) => b.streams - a.streams).slice(0, 6)
    : [];

  const filteredTrendingTracks = trendingTracks?.filter(track => {
    if (selectedGenre && track.genre !== selectedGenre) return false;
    if (selectedUniversity && track.universityName !== selectedUniversity) return false;
    return true;
  }) || [];

  const SectionHeader = ({ title, icon: Icon, href }: { title: string; icon: any; href: string }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <Link href={href} className="text-primary hover:underline text-sm font-semibold" data-testid={`link-show-all-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        Show all
      </Link>
    </div>
  );

  return (
    <div className="space-y-16 pb-32">
      {/* Hero Section */}
      <section className="space-y-4">
        <div>
          <h1 className="text-5xl font-bold mb-3">Welcome back</h1>
          <p className="text-lg text-muted-foreground">
            Discover the latest hits from student artists worldwide
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="space-y-4">
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
      </section>

      {/* Trending Songs List */}
      <section>
        <SectionHeader title="Trending Songs" icon={Flame} href="/all-trending" />
        <div className="space-y-1">
          {trendingLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))
          ) : filteredTrendingTracks.length > 0 ? (
            filteredTrendingTracks.slice(0, 10).map((track, index) => (
              <TrackListItem 
                key={track.id} 
                track={track} 
                index={index}
                isLiked={likedTrackIds.has(track.id)}
                onLike={() => handleLike(track.id)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {selectedGenre || selectedUniversity ? 'No tracks match your filters' : 'No trending tracks available yet'}
            </div>
          )}
        </div>
      </section>

      {/* Top Artists */}
      {topArtists.length > 0 && (
        <section>
          <SectionHeader title="Popular Artists" icon={Star} href="/all-artists" />
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4">
              {artistsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-40 flex-shrink-0 rounded-lg" />
                ))
              ) : (
                topArtists.map((artist) => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <Card className="w-40 flex-shrink-0 overflow-hidden hover-elevate transition-all p-4 text-center space-y-3 cursor-pointer h-full flex flex-col items-center" data-testid={`card-artist-home-${artist.id}`}>
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                        <AvatarFallback className="bg-primary/20">
                          <Music className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 w-full px-1">
                        <h3 className="font-semibold truncate text-sm">{artist.stageName}</h3>
                        <p className="text-xs text-muted-foreground">{artist.trackCount} tracks</p>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Latest Songs Carousel */}
      <section>
        <SectionHeader title="Fresh Releases" icon={Music} href="/all-releases" />
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {latestLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-48 flex-shrink-0 rounded-lg" />
              ))
            ) : latestTracks && latestTracks.length > 0 ? (
              latestTracks.slice(0, 8).map((track) => (
                <div key={track.id} className="w-48 flex-shrink-0">
                  <TrackCard 
                    track={track} 
                    isLiked={likedTrackIds.has(track.id)}
                    onLike={() => handleLike(track.id)}
                  />
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

      {/* Best of Campus */}
      <section>
        <SectionHeader title="Best of Campus 2025" icon={Flame} href="/best-of-campus" />
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {latestLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-48 flex-shrink-0 rounded-lg" />
              ))
            ) : trendingTracks && trendingTracks.length > 0 ? (
              trendingTracks.slice(0, 6).map((track) => (
                <div key={track.id} className="w-48 flex-shrink-0">
                  <TrackCard 
                    track={track}
                    isLiked={likedTrackIds.has(track.id)}
                    onLike={() => handleLike(track.id)}
                  />
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
    </div>
  );
}
