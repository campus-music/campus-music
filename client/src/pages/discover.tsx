import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function Discover() {
  const [university, setUniversity] = useState('');

  const { data: topTracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/by-university', university],
    enabled: university.length > 0,
  });

  const { data: topArtists, isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/artists/by-university', university],
    enabled: university.length > 0,
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Discover by University</h1>
          <p className="text-muted-foreground text-lg">
            Explore music from universities worldwide
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="university">Search University</Label>
        <Input
          id="university"
          type="text"
          placeholder="e.g., Stanford University, MIT, Harvard..."
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="mt-2"
          data-testid="input-university-search"
        />
      </div>

      {university.length > 0 ? (
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList>
            <TabsTrigger value="tracks" data-testid="tab-tracks">Top Tracks</TabsTrigger>
            <TabsTrigger value="artists" data-testid="tab-artists">Top Artists</TabsTrigger>
          </TabsList>
          <TabsContent value="tracks" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tracksLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))
              ) : topTracks && topTracks.length > 0 ? (
                topTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  No tracks found from this university
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
              ) : topArtists && topArtists.length > 0 ? (
                topArtists.map((artist) => (
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
                  No artists found from this university
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Enter a university name to discover music from student artists
        </div>
      )}
    </div>
  );
}
