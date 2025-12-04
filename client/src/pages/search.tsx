import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackListItem } from '@/components/track-list-item';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search as SearchIcon, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SupportModal } from '@/components/support-modal';
import { Link } from 'wouter';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

const popularSearches = [
  { term: "summer vibes", gradient: "from-orange-500 to-yellow-500" },
  { term: "study music", gradient: "from-blue-500 to-cyan-500" },
  { term: "chill beats", gradient: "from-purple-500 to-pink-500" },
  { term: "workout", gradient: "from-red-500 to-orange-500" },
  { term: "party mix", gradient: "from-pink-500 to-rose-500" },
  { term: "acoustic", gradient: "from-amber-500 to-yellow-600" },
  { term: "lofi hip hop", gradient: "from-indigo-500 to-purple-500" },
  { term: "campus anthems", gradient: "from-green-500 to-emerald-500" },
];

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

  const handleQuickSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-6 px-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <SearchIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Search</h1>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for tracks, artists, genres..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-base rounded-full pl-12 bg-muted/50 border-muted-foreground/20 focus:bg-background"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      {query.length > 0 ? (
        /* Search Results */
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
                        <SupportModal artistId={artist.id} artistName={artist.stageName} artistImageUrl={artist.profileImageUrl} />
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
        /* Popular Searches Tiles - Shown when no search query */
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Popular searches</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularSearches.map(({ term, gradient }) => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                className={`relative aspect-square rounded-lg bg-gradient-to-br ${gradient} overflow-hidden hover-elevate transition-transform cursor-pointer group`}
                data-testid={`tile-popular-search-${term.replace(/\s+/g, '-')}`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-lg capitalize drop-shadow-lg">
                    {term}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
