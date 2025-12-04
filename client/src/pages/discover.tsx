import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { GraduationCap, Music, Users, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

const UNIVERSITY_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-orange-500 to-amber-600',
  'from-green-500 to-emerald-600',
  'from-cyan-500 to-blue-600',
  'from-red-500 to-rose-600',
  'from-yellow-500 to-orange-600',
];

function getUniversityColor(index: number): string {
  return UNIVERSITY_COLORS[index % UNIVERSITY_COLORS.length];
}

export default function Discover() {
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: universities, isLoading: universitiesLoading } = useQuery<string[]>({
    queryKey: ['/api/universities'],
  });

  const { data: topTracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/by-university', selectedUniversity],
    queryFn: async () => {
      const res = await fetch(`/api/tracks/by-university?university=${encodeURIComponent(selectedUniversity)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: selectedUniversity.length > 0,
  });

  const { data: topArtists, isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/artists/by-university', selectedUniversity],
    queryFn: async () => {
      const res = await fetch(`/api/artists/by-university?university=${encodeURIComponent(selectedUniversity)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch artists');
      return res.json();
    },
    enabled: selectedUniversity.length > 0,
  });

  const filteredUniversities = useMemo(() => {
    if (!universities) return [];
    if (!searchQuery.trim()) return universities;
    return universities.filter(uni => 
      uni.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [universities, searchQuery]);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Discover by University</h1>
          <p className="text-muted-foreground text-lg">
            Explore music from student artists at universities worldwide
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Select a University</h2>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-universities"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {universitiesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filteredUniversities.length > 0 ? (
            filteredUniversities.map((uni, index) => {
              const isSelected = selectedUniversity === uni;
              const colorClass = getUniversityColor(index);
              
              return (
                <button
                  key={uni}
                  onClick={() => setSelectedUniversity(uni)}
                  className={`relative h-24 rounded-xl bg-gradient-to-br ${colorClass} overflow-hidden hover-elevate transition-all cursor-pointer group text-left ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-[1.02]' : ''
                  }`}
                  data-testid={`tile-university-${uni.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-semibold text-white text-sm drop-shadow-lg line-clamp-2">
                      {uni}
                    </p>
                  </div>
                </button>
              );
            })
          ) : searchQuery ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No universities matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No universities found</p>
            </div>
          )}
        </div>
      </div>

      {selectedUniversity ? (
        <Tabs defaultValue="tracks" className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${getUniversityColor(universities?.indexOf(selectedUniversity) || 0)}`}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">{selectedUniversity}</h2>
          </div>

          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="tracks" 
              data-testid="tab-tracks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Music className="h-4 w-4 mr-2" />
              Top Tracks {topTracks && `(${topTracks.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="artists" 
              data-testid="tab-artists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Artists {topArtists && `(${topArtists.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6 space-y-2">
            {tracksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : topTracks && topTracks.length > 0 ? (
              topTracks.map((track, index) => (
                <TrackListItem key={track.id} track={track} index={index + 1} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracks found from {selectedUniversity}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artistsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-lg" />
                ))
              ) : topArtists && topArtists.length > 0 ? (
                topArtists.map((artist) => (
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
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No artists found from {selectedUniversity}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <GraduationCap className="h-16 w-16 mx-auto opacity-30" />
          <p className="text-lg">Select a university above to discover music from student artists</p>
        </div>
      )}
    </div>
  );
}
