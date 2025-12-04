import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, MapPin, Users, Radio } from 'lucide-react';
import { SupportModal } from '@/components/support-modal';
import { SupportHistory } from '@/components/support-history';
import { TrackCard } from '@/components/track-card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ArtistProfile, Track, LiveStream, TrackWithArtist } from '@shared/schema';

interface ArtistWithTracks extends ArtistProfile {
  tracks: Track[];
}

export default function ArtistDetail() {
  const [, params] = useRoute('/artist/:id');
  const [, navigate] = useLocation();
  const artistId = params?.id || '';

  const { data: artist, isLoading: artistLoading } = useQuery<ArtistWithTracks>({
    queryKey: ['/api/artist', artistId],
    enabled: !!artistId,
  });

  const { data: supporterData } = useQuery<{ count: number }>({
    queryKey: ['/api/artist', artistId, 'supporter-count'],
    enabled: !!artistId,
  });

  // Check if artist is currently live
  const { data: liveStatus } = useQuery<{ isLive: boolean; stream: LiveStream | null }>({
    queryKey: ['/api/artists', artistId, 'live'],
    enabled: !!artistId,
    refetchInterval: 30000, // Check every 30 seconds
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{artist.stageName}</h1>
                {liveStatus?.isLive && (
                  <Badge 
                    variant="destructive" 
                    className="animate-pulse gap-1 cursor-pointer"
                    onClick={() => navigate(`/live/${liveStatus.stream?.id}`)}
                    data-testid="badge-artist-live"
                  >
                    <Radio className="w-3 h-3" />
                    LIVE
                  </Badge>
                )}
              </div>
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
              {liveStatus?.isLive && liveStatus.stream && (
                <Button 
                  className="bg-[#E84A5F] hover:bg-[#E84A5F]/90 gap-2"
                  onClick={() => navigate(`/live/${liveStatus.stream?.id}`)}
                  data-testid="button-watch-live"
                >
                  <Radio className="w-4 h-4" />
                  Watch Live
                </Button>
              )}
              <SupportModal artistId={artist.id} artistName={artist.stageName} artistImageUrl={artist.profileImageUrl} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Tracks</p>
                <p className="text-2xl font-bold">{artist.tracks?.length || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Supporters</span>
                </div>
                <p className="text-2xl font-bold">{supporterData?.count || 0}</p>
              </div>
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
                isLiked={likedTrackIds.has(track.id)}
                onLike={() => handleLike(track.id)}
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
