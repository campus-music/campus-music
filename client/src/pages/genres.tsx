import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Music, Users, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

const GENRE_COLORS: Record<string, string> = {
  'Pop': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Hip-Hop': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Electronic': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Rock': 'bg-red-500/20 text-red-400 border-red-500/30',
  'R&B': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Indie': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Jazz': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Classical': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function Genres() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {genresLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))
          ) : genres && genres.length > 0 ? (
            genres.map((genre) => (
              <Card
                key={genre}
                className={`cursor-pointer p-4 text-center transition-all hover-elevate ${
                  selectedGenre === genre 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : ''
                }`}
                onClick={() => setSelectedGenre(genre)}
                data-testid={`card-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Badge 
                  variant="outline" 
                  className={`mb-2 ${GENRE_COLORS[genre] || 'bg-primary/20'}`}
                >
                  {genre}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {selectedGenre === genre ? 'Selected' : 'Click to explore'}
                </p>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">No genres available</p>
          )}
        </div>
      </div>

      {selectedGenre ? (
        <Tabs defaultValue="tracks" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Badge className={GENRE_COLORS[selectedGenre] || 'bg-primary/20'}>
                {selectedGenre}
              </Badge>
            </h2>
          </div>

          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="tracks" 
              data-testid="tab-tracks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Music className="h-4 w-4 mr-2" />
              Tracks {genreTracks && `(${genreTracks.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="artists" 
              data-testid="tab-artists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Artists {genreArtists && `(${genreArtists.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6 space-y-2">
            {tracksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : genreTracks && genreTracks.length > 0 ? (
              genreTracks.map((track, index) => (
                <TrackListItem key={track.id} track={track} index={index + 1} />
              ))
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
              ) : genreArtists && genreArtists.length > 0 ? (
                genreArtists.map((artist) => (
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
