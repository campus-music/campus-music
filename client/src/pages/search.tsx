import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackCard } from '@/components/track-card';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

export default function Search() {
  const [query, setQuery] = useState('');

  const { data: tracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/search/tracks', query],
    enabled: query.length > 0,
  });

  const { data: artists, isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/search/artists', query],
    enabled: query.length > 0,
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <SearchIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground text-lg">
            Find tracks, artists, and universities
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Input
          type="search"
          placeholder="Search for tracks, artists, genres, or universities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 text-lg"
          data-testid="input-search"
        />
      </div>

      {query.length > 0 ? (
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList>
            <TabsTrigger value="tracks" data-testid="tab-tracks">
              Tracks {tracks && `(${tracks.length})`}
            </TabsTrigger>
            <TabsTrigger value="artists" data-testid="tab-artists">
              Artists {artists && `(${artists.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tracksLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))
              ) : tracks && tracks.length > 0 ? (
                tracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  No tracks found for "{query}"
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artistsLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))
              ) : artists && artists.length > 0 ? (
                artists.map((artist) => (
                  <Card key={artist.id} className="overflow-hidden hover-elevate transition-all" data-testid={`card-artist-${artist.id}`}>
                    <div className="p-6">
                      <Avatar className="h-32 w-32 mx-auto mb-4">
                        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                        <AvatarFallback>{artist.stageName[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-center truncate">{artist.stageName}</h3>
                      <p className="text-sm text-muted-foreground text-center">{artist.mainGenre}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  No artists found for "{query}"
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Start typing to search for tracks, artists, and more
        </div>
      )}
    </div>
  );
}
