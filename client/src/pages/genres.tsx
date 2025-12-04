import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Music, Users, Sparkles, Search, X, Mic2, Headphones, Radio, Guitar, Zap, Piano, Disc } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

const GENRE_CONFIG: Record<string, { gradient: string; icon: typeof Music; textColor: string }> = {
  'Pop': { gradient: 'from-pink-500 to-rose-500', icon: Radio, textColor: 'text-white' },
  'Hip-Hop': { gradient: 'from-orange-500 to-amber-500', icon: Mic2, textColor: 'text-white' },
  'Electronic': { gradient: 'from-cyan-500 to-blue-500', icon: Zap, textColor: 'text-white' },
  'Rock': { gradient: 'from-red-500 to-rose-600', icon: Guitar, textColor: 'text-white' },
  'R&B': { gradient: 'from-purple-500 to-violet-500', icon: Headphones, textColor: 'text-white' },
  'Indie': { gradient: 'from-green-500 to-emerald-500', icon: Disc, textColor: 'text-white' },
  'Jazz': { gradient: 'from-amber-500 to-yellow-500', icon: Piano, textColor: 'text-white' },
  'Classical': { gradient: 'from-slate-500 to-gray-600', icon: Music, textColor: 'text-white' },
};

const DEFAULT_CONFIG = { gradient: 'from-primary to-primary/70', icon: Music, textColor: 'text-white' };

export default function Genres() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: genres, isLoading: genresLoading } = useQuery<string[]>({
    queryKey: ['/api/genres'],
  });

  const { data: genreTracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: [`/api/genres/${selectedGenre}/tracks`],
    enabled: selectedGenre.length > 0,
  });

  const { data: genreArtists, isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: [`/api/genres/${selectedGenre}/artists`],
    enabled: selectedGenre.length > 0,
  });

  const filteredTracks = useMemo(() => {
    if (!genreTracks) return [];
    if (!searchQuery.trim()) return genreTracks;
    
    const query = searchQuery.toLowerCase();
    return genreTracks.filter(track => 
      track.title.toLowerCase().includes(query) ||
      track.artist?.stageName?.toLowerCase().includes(query)
    );
  }, [genreTracks, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!genreArtists) return [];
    if (!searchQuery.trim()) return genreArtists;
    
    const query = searchQuery.toLowerCase();
    return genreArtists.filter(artist => 
      artist.stageName.toLowerCase().includes(query) ||
      artist.bio?.toLowerCase().includes(query)
    );
  }, [genreArtists, searchQuery]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
  };

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/liked'],
  });

  const [localLikedIds, setLocalLikedIds] = useState<Set<string>>(new Set());
  
  const likedTrackIds = new Set([
    ...(likedTracks?.map(t => t.id) || []),
    ...Array.from(localLikedIds)
  ]);

  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest('DELETE', `/api/tracks/${trackId}/like`, {});
      } else {
        await apiRequest('POST', `/api/tracks/${trackId}/like`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/liked'] });
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
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Browse Genres</h1>
          <p className="text-muted-foreground text-lg">
            Explore music from your favorite genres
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Genres</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genresLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : genres && genres.length > 0 ? (
            genres.map((genre) => {
              const config = GENRE_CONFIG[genre] || DEFAULT_CONFIG;
              const IconComponent = config.icon;
              const isSelected = selectedGenre === genre;
              
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreSelect(genre)}
                  className={`relative h-24 rounded-xl bg-gradient-to-br ${config.gradient} overflow-hidden hover-elevate transition-all cursor-pointer group text-left ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-[1.02]' : ''
                  }`}
                  data-testid={`tile-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-semibold text-white text-sm drop-shadow-lg">
                      {genre}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-muted-foreground col-span-full">No genres available</p>
          )}
        </div>
      </div>

      {selectedGenre ? (
        <Tabs defaultValue="tracks" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${GENRE_CONFIG[selectedGenre]?.gradient || DEFAULT_CONFIG.gradient}`}>
                {(() => {
                  const IconComponent = GENRE_CONFIG[selectedGenre]?.icon || Music;
                  return <IconComponent className="h-5 w-5 text-white" />;
                })()}
              </div>
              {selectedGenre}
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-genre-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="tracks" 
              data-testid="tab-tracks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Music className="h-4 w-4 mr-2" />
              Tracks {searchQuery ? `(${filteredTracks.length})` : genreTracks && `(${genreTracks.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="artists" 
              data-testid="tab-artists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Artists {searchQuery ? `(${filteredArtists.length})` : genreArtists && `(${genreArtists.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6 space-y-2">
            {tracksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : filteredTracks.length > 0 ? (
              filteredTracks.map((track, index) => (
                <TrackListItem 
                  key={track.id} 
                  track={track} 
                  index={index + 1}
                  isLiked={likedTrackIds.has(track.id)}
                  onLike={() => handleLike(track.id)}
                />
              ))
            ) : searchQuery ? (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracks matching "{searchQuery}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracks found in {selectedGenre}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artistsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-lg" />
                ))
              ) : filteredArtists.length > 0 ? (
                filteredArtists.map((artist) => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <Card 
                      className="overflow-hidden hover-elevate transition-all p-6 text-center cursor-pointer h-full"
                      data-testid={`card-artist-${artist.id}`}
                    >
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                        <AvatarFallback className="bg-primary/20 text-2xl">
                          {artist.stageName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold truncate">{artist.stageName}</h3>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {artist.mainGenre}
                      </Badge>
                    </Card>
                  </Link>
                ))
              ) : searchQuery ? (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No artists matching "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No artists found in {selectedGenre}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <Sparkles className="h-16 w-16 mx-auto opacity-30" />
          <p className="text-lg">Select a genre above to explore tracks and artists</p>
        </div>
      )}
    </div>
  );
}
