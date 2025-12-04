import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackCard } from '@/components/track-card';
import { TrackListItem } from '@/components/track-list-item';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search as SearchIcon, Music, TrendingUp, Clock, Sparkles, Disc, Radio, Headphones, Mic2, Guitar, Piano, Zap } from 'lucide-react';
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

const genreIcons: Record<string, typeof Music> = {
  "Hip-Hop": Mic2,
  "R&B": Headphones,
  "Pop": Radio,
  "Rock": Guitar,
  "Electronic": Zap,
  "Jazz": Piano,
  "Classical": Music,
  "Indie": Disc,
};

const genreColors: Record<string, string> = {
  "Hip-Hop": "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  "R&B": "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  "Pop": "from-pink-500/20 to-pink-500/5 border-pink-500/30",
  "Rock": "from-red-500/20 to-red-500/5 border-red-500/30",
  "Electronic": "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  "Jazz": "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  "Classical": "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  "Indie": "from-green-500/20 to-green-500/5 border-green-500/30",
};

const trendingSearches = [
  "summer vibes",
  "study music", 
  "chill beats",
  "workout",
  "party mix",
  "acoustic",
  "lofi hip hop",
  "campus anthems"
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

  const { data: genres } = useQuery<string[]>({
    queryKey: ['/api/genres'],
  });

  const { data: trendingTracks, isLoading: trendingLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: latestTracks, isLoading: latestLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/latest'],
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
        /* Discovery Content - Shown when no search query */
        <div className="space-y-10">
          {/* Trending Searches */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Trending Searches</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSearch(term)}
                  className="rounded-full hover-elevate"
                  data-testid={`button-quick-search-${term.replace(/\s+/g, '-')}`}
                >
                  {term}
                </Button>
              ))}
            </div>
          </section>

          {/* Browse by Genre */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Browse by Genre</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(genres || ["Hip-Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Indie", "Classical"]).slice(0, 8).map((genre) => {
                const IconComponent = genreIcons[genre] || Music;
                const colorClass = genreColors[genre] || "from-primary/20 to-primary/5 border-primary/30";
                return (
                  <Link key={genre} href={`/genres?genre=${encodeURIComponent(genre)}`}>
                    <Card 
                      className={`hover-elevate bg-gradient-to-br ${colorClass} transition-all cursor-pointer`}
                      data-testid={`card-genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/50">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{genre}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Trending Tracks */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Trending Now</h2>
              </div>
              <Link href="/trending">
                <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-see-all-trending">
                  See all
                </Button>
              </Link>
            </div>
            {trendingLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : trendingTracks && trendingTracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trendingTracks.slice(0, 4).map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Music className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No trending tracks yet</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* New Releases */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">New Releases</h2>
              </div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-see-all-releases">
                  See all
                </Button>
              </Link>
            </div>
            {latestLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : latestTracks && latestTracks.length > 0 ? (
              <div className="space-y-2">
                {latestTracks.slice(0, 5).map((track, index) => (
                  <TrackListItem key={track.id} track={track} index={index + 1} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No new releases yet</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Discover Artists CTA */}
          <section>
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-primary/20 shrink-0">
                  <Mic2 className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">Discover Campus Artists</h3>
                  <p className="text-muted-foreground">
                    Explore talented student musicians from universities around the world
                  </p>
                </div>
                <Link href="/discover">
                  <Button size="lg" className="shrink-0" data-testid="button-discover-artists">
                    Explore Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
