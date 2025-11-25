import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Music } from 'lucide-react';
import type { TrackWithArtist, ArtistProfile } from '@shared/schema';

export default function Genres() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  const { data: genres, isLoading: genresLoading } = useQuery<string[]>({
    queryKey: ['/api/genres'],
  });

  const { data: genreTracks, isLoading: tracksLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/genres', selectedGenre, 'tracks'],
    enabled: selectedGenre.length > 0,
  });

  const { data: genreArtists, isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/genres', selectedGenre, 'artists'],
    enabled: selectedGenre.length > 0,
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Browse by Genre</h1>
          <p className="text-muted-foreground text-lg">
            Explore music from your favorite genres
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genresLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-full" />
            ))
          ) : genres && genres.length > 0 ? (
            genres.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm hover-elevate"
                onClick={() => setSelectedGenre(genre)}
                data-testid={`badge-genre-${genre}`}
              >
                {genre}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground">No genres available</p>
          )}
        </div>
      </div>

      {selectedGenre && (
        <>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Top Artists - {selectedGenre}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artistsLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))
              ) : genreArtists && genreArtists.length > 0 ? (
                genreArtists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="overflow-hidden hover-elevate transition-all"
                    data-testid={`card-artist-${artist.id}`}
                  >
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
                  No artists found in this genre
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Tracks - {selectedGenre}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tracksLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))
              ) : genreTracks && genreTracks.length > 0 ? (
                genreTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  No tracks found in this genre
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
