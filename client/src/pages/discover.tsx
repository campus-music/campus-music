import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GraduationCap, Music, Users, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'wouter';

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
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4 flex-wrap">
            {universitiesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-40 rounded-full flex-shrink-0" />
              ))
            ) : filteredUniversities.length > 0 ? (
              filteredUniversities.map((uni) => (
                <Badge
                  key={uni}
                  variant={selectedUniversity === uni ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm hover-elevate flex-shrink-0 whitespace-nowrap"
                  onClick={() => setSelectedUniversity(uni)}
                  data-testid={`badge-university-${uni.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <GraduationCap className="h-3 w-3 mr-2" />
                  {uni}
                </Badge>
              ))
            ) : searchQuery ? (
              <p className="text-muted-foreground">No universities matching "{searchQuery}"</p>
            ) : (
              <p className="text-muted-foreground">No universities found</p>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {selectedUniversity ? (
        <Tabs defaultValue="tracks" className="w-full">
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
                      <p className="text-sm text-muted-foreground">{artist.mainGenre}</p>
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
