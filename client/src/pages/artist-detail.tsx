import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, MapPin, Wallet, Heart } from 'lucide-react';
import { SupportModal } from '@/components/support-modal';
import { SupportHistory } from '@/components/support-history';
import { TrackCard } from '@/components/track-card';
import type { ArtistProfile, Track, ArtistWallet } from '@shared/schema';

interface ArtistWithTracks extends ArtistProfile {
  tracks: Track[];
  totalSupport: number;
}

export default function ArtistDetail() {
  const [, params] = useRoute('/artist/:id');
  const [, navigate] = useLocation();
  const artistId = params?.id || '';

  const { data: artist, isLoading: artistLoading } = useQuery<ArtistWithTracks>({
    queryKey: ['/api/artist', artistId],
    enabled: !!artistId,
  });

  const { data: wallet } = useQuery<ArtistWallet>({
    queryKey: ['/api/artist', artistId, 'wallet'],
    enabled: !!artistId,
  });

  if (!artistId) {
    navigate('/');
    return null;
  }

  if (artistLoading) {
    return (
      <div className="space-y-6 pb-32">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Artist Header */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
            {artist.profileImageUrl ? (
              <img
                src={artist.profileImageUrl}
                alt={artist.stageName}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="h-24 w-24 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{artist.stageName}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>{artist.mainGenre}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>University: {artist.bio || 'Student Artist'}</span>
                </div>
              </div>
            </div>

            {artist.bio && (
              <p className="text-muted-foreground">{artist.bio}</p>
            )}

            <div className="flex gap-3 flex-wrap">
              <SupportModal artistId={artist.id} artistName={artist.stageName} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Tracks</p>
                <p className="text-2xl font-bold">{artist.tracks?.length || 0}</p>
              </div>
              {wallet && (
                <div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>Total Support</span>
                  </div>
                  <p className="text-2xl font-bold">${(wallet.totalReceived / 100).toFixed(2)}</p>
                </div>
              )}
              {wallet && (
                <div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span>Balance</span>
                  </div>
                  <p className="text-2xl font-bold">${(wallet.balance / 100).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tracks */}
      {artist.tracks && artist.tracks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Tracks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artist.tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={{ ...track, artist }}
                data-testid={`card-track-${track.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Support History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Support History</h2>
        <SupportHistory artistId={artist.id} />
      </div>
    </div>
  );
}
