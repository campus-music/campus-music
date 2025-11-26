import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackCard } from '@/components/track-card';
import { TrackListItem } from '@/components/track-list-item';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search as SearchIcon, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupportModal } from '@/components/support-modal';
import { Link } from 'wouter';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

export default function Search() {
  const [query, setQuery] = useState('');

  const { data: tracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/search/tracks', query],
    enabled: query.length > 0,
  });

  const { data: artists, isLoading: artistsLoading } = useQuery<Artist[]>({
    queryKey: ['/api/search/artists', query],
    enabled: query.length > 0,
  });

  return (
    <div className="space-y-8 pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-6 px-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <SearchIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Search</h1>
          </div>

          <Input
            type="search"
            placeholder="Search for tracks, artists, genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 text-base rounded-full"
            data-testid="input-search"
          />
        </div>
      </div>

      {query.length > 0 ? (
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="tracks" 
              data-testid="tab-tracks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Tracks {tracks && `(${tracks.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="artists" 
              data-testid="tab-artists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Artists {artists && `(${artists.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-8 space-y-2">
            {tracksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : tracks && tracks.length > 0 ? (
              tracks.map((track, index) => (
                <TrackListItem key={track.id} track={track} index={index + 1} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                No tracks found for "{query}"
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists" className="mt-8">
            <div className="space-y-4">
              {artistsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              ) : artists && artists.length > 0 ? (
                artists.map((artist) => (
                  <Card 
                    key={artist.id} 
                    className="overflow-hidden hover-elevate transition-all" 
                    data-testid={`card-artist-search-${artist.id}`}
                  >
                    <Link href={`/artist/${artist.id}`}>
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                            <AvatarFallback className="bg-primary/20">
                              <Music className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg">{artist.stageName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{artist.mainGenre}</Badge>
                              <span className="text-sm text-muted-foreground">{artist.trackCount} tracks</span>
                            </div>
                          </div>
                        </div>
                        <SupportModal artistId={artist.id} artistName={artist.stageName} />
                      </div>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  No artists found for "{query}"
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-32 text-muted-foreground space-y-3">
          <SearchIcon className="h-16 w-16 mx-auto opacity-30" />
          <p className="text-lg">Start typing to search for tracks and artists</p>
        </div>
      )}
    </div>
  );
}
