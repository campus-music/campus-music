import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackListItem } from '@/components/track-list-item';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search as SearchIcon, Music, Sun, BookOpen, Coffee, Dumbbell, PartyPopper, Guitar, Headphones, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SupportModal } from '@/components/support-modal';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

const popularSearches = [
  { term: "summer vibes", gradient: "from-orange-500 to-yellow-500", icon: Sun, pattern: "circles" },
  { term: "study music", gradient: "from-blue-500 to-cyan-500", icon: BookOpen, pattern: "waves" },
  { term: "chill beats", gradient: "from-purple-500 to-pink-500", icon: Coffee, pattern: "dots" },
  { term: "workout", gradient: "from-red-500 to-orange-500", icon: Dumbbell, pattern: "diagonal" },
  { term: "party mix", gradient: "from-pink-500 to-rose-500", icon: PartyPopper, pattern: "confetti" },
  { term: "acoustic", gradient: "from-amber-500 to-yellow-600", icon: Guitar, pattern: "strings" },
  { term: "lofi hip hop", gradient: "from-indigo-500 to-purple-500", icon: Headphones, pattern: "vinyl" },
  { term: "campus anthems", gradient: "from-green-500 to-emerald-500", icon: GraduationCap, pattern: "stars" },
];

const PatternOverlay = ({ pattern }: { pattern: string }) => {
  switch (pattern) {
    case "circles":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-4 border-white/40" />
          <div className="absolute top-1/2 -left-6 w-24 h-24 rounded-full border-4 border-white/30" />
          <div className="absolute -bottom-4 right-1/4 w-16 h-16 rounded-full bg-white/20" />
        </div>
      );
    case "waves":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0 30 Q25 10 50 20 T100 15 V30 Z" fill="white" />
            <path d="M0 30 Q25 15 50 25 T100 20 V30 Z" fill="white" opacity="0.5" />
          </svg>
        </div>
      );
    case "dots":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
      );
    case "diagonal":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 2px, transparent 2px, transparent 12px)'
          }} />
        </div>
      );
    case "confetti":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-4 left-4 w-3 h-3 bg-white/60 rotate-45" />
          <div className="absolute top-8 right-8 w-2 h-4 bg-white/50 rotate-12" />
          <div className="absolute bottom-12 left-1/3 w-4 h-2 bg-white/40 -rotate-12" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/60 rounded-full" />
          <div className="absolute bottom-8 right-12 w-3 h-1 bg-white/50 rotate-45" />
          <div className="absolute top-12 left-1/2 w-2 h-3 bg-white/40 -rotate-30" />
        </div>
      );
    case "strings":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="absolute h-full w-px bg-white/60"
              style={{ left: `${15 + i * 14}%` }}
            />
          ))}
        </div>
      );
    case "vinyl":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-25">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/40" />
        </div>
      );
    case "stars":
      return (
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-4 right-6 text-white/60 text-lg">✦</div>
          <div className="absolute top-1/3 left-4 text-white/40 text-sm">✦</div>
          <div className="absolute bottom-1/3 right-1/4 text-white/50 text-xs">✦</div>
          <div className="absolute top-1/2 right-8 text-white/30 text-base">✦</div>
          <div className="absolute bottom-8 left-1/3 text-white/40 text-lg">✦</div>
        </div>
      );
    default:
      return null;
  }
};

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
                <TrackListItem 
                  key={track.id} 
                  track={track} 
                  index={index + 1}
                  isLiked={likedTrackIds.has(track.id)}
                  onLike={() => handleLike(track.id)}
                />
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
            {popularSearches.map(({ term, gradient, icon: Icon, pattern }) => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                className={`relative aspect-square rounded-xl bg-gradient-to-br ${gradient} overflow-hidden hover-elevate transition-all duration-300 cursor-pointer group shadow-lg`}
                data-testid={`tile-popular-search-${term.replace(/\s+/g, '-')}`}
              >
                {/* Pattern overlay */}
                <PatternOverlay pattern={pattern} />
                
                {/* Icon in top right */}
                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-60 transition-opacity">
                  <Icon className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                
                {/* Bottom gradient for text readability */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-lg capitalize drop-shadow-lg text-left">
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
