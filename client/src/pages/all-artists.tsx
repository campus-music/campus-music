import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Star } from 'lucide-react';
import { Link } from 'wouter';
import type { ArtistProfile } from '@shared/schema';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

export default function AllArtists() {
  const { data: artists, isLoading } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  const sortedArtists = artists
    ? [...artists].sort((a, b) => b.streams - a.streams)
    : [];

  return (
    <div className="space-y-8 pb-32">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Popular Artists</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Discover talented student musicians from universities worldwide
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))
        ) : sortedArtists.length > 0 ? (
          sortedArtists.map((artist) => (
            <Link key={artist.id} href={`/artist/${artist.id}`}>
              <Card 
                className="overflow-hidden hover-elevate transition-all p-6 text-center space-y-4 cursor-pointer h-full flex flex-col items-center justify-center"
                data-testid={`card-artist-${artist.id}`}
              >
                <Avatar className="h-28 w-28">
                  <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                  <AvatarFallback className="bg-primary/20">
                    <Music className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold truncate">{artist.stageName}</h3>
                  <p className="text-sm text-muted-foreground">{artist.mainGenre}</p>
                  <p className="text-xs text-muted-foreground">{artist.trackCount} tracks</p>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No artists found</p>
          </div>
        )}
      </div>
    </div>
  );
}
