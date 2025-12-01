import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackCard } from '@/components/track-card';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Music, Flame, Star, Users, GraduationCap, Heart, UserPlus } from 'lucide-react';
import type { TrackWithArtist, ArtistProfile, User } from '@shared/schema';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';

interface Artist extends ArtistProfile {
  trackCount: number;
  streams: number;
}

interface FriendListenTrack extends TrackWithArtist {
  listenedBy: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  playedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  
  // Social home page queries
  const { data: fromFollowing, isLoading: followingLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/from-following'],
    enabled: !!user,
  });

  const { data: fromUniversity, isLoading: universityLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/my-university'],
    enabled: !!user,
  });

  const { data: friendsListening, isLoading: friendsLoading } = useQuery<FriendListenTrack[]>({
    queryKey: ['/api/tracks/friends-listening'],
    enabled: !!user,
  });

  const { data: trendingTracks, isLoading: trendingLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/trending'],
  });

  const { data: allArtists, isLoading: artistsLoading } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/user/liked-tracks'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/user/liked-tracks'] });
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

  const topArtists = allArtists
    ? [...allArtists].sort((a, b) => b.streams - a.streams).slice(0, 6)
    : [];

  const SectionHeader = ({ title, icon: Icon, href, subtitle }: { title: string; icon: any; href?: string; subtitle?: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="text-primary hover:underline text-sm font-semibold" data-testid={`link-show-all-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          Show all
        </Link>
      )}
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description, actionLabel, actionHref }: { 
    icon: any; 
    title: string; 
    description: string;
    actionLabel?: string;
    actionHref?: string;
  }) => (
    <Card className="p-8 text-center bg-card/50">
      <div className="inline-flex p-4 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Badge variant="secondary" className="cursor-pointer hover-elevate">
            {actionLabel}
          </Badge>
        </Link>
      )}
    </Card>
  );

  return (
    <div className="space-y-12 pb-32">
      {/* Hero Section */}
      <section className="space-y-2">
        <h1 className="text-4xl font-bold">Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
        <p className="text-muted-foreground">
          Your personalized music from campus artists
        </p>
      </section>

      {/* New From Artists You Follow */}
      <section>
        <SectionHeader 
          title="New From Artists You Follow" 
          icon={Heart} 
          subtitle="Latest drops from your favorites"
        />
        {followingLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : fromFollowing && fromFollowing.length > 0 ? (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {fromFollowing.slice(0, 8).map((track) => (
                <div key={track.id} className="w-48 flex-shrink-0">
                  <TrackCard 
                    track={track} 
                    isLiked={likedTrackIds.has(track.id)}
                    onLike={() => handleLike(track.id)}
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <EmptyState 
            icon={UserPlus}
            title="Follow artists to see their music here"
            description="Discover and follow artists you love to get their latest tracks in your feed"
            actionLabel="Discover Artists"
            actionHref="/all-artists"
          />
        )}
      </section>

      {/* Hot at Your University */}
      <section>
        <SectionHeader 
          title={`Hot at ${user?.universityName || 'Your University'}`}
          icon={GraduationCap} 
          subtitle="What's trending on your campus"
        />
        {universityLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : fromUniversity && fromUniversity.length > 0 ? (
          <div className="space-y-1">
            {fromUniversity.slice(0, 5).map((track, index) => (
              <TrackListItem 
                key={track.id} 
                track={track} 
                index={index}
                isLiked={likedTrackIds.has(track.id)}
                onLike={() => handleLike(track.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={GraduationCap}
            title="No tracks from your campus yet"
            description={user?.universityName 
              ? `Be the first to upload music from ${user.universityName}!`
              : "Update your profile to see music from your university"
            }
            actionLabel="Browse All Music"
            actionHref="/all-trending"
          />
        )}
      </section>

      {/* Friends Are Listening To */}
      <section>
        <SectionHeader 
          title="Friends Are Listening To" 
          icon={Users} 
          subtitle="See what your friends are playing"
        />
        {friendsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : friendsListening && friendsListening.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friendsListening.slice(0, 6).map((item) => (
              <Card key={`${item.id}-${item.listenedBy.id}`} className="p-3 hover-elevate transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.coverImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/20">
                        <Music className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.artist?.stageName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={item.listenedBy.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {item.listenedBy.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.listenedBy.fullName.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(item.playedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Users}
            title="Connect with friends to see their activity"
            description="Add friends to see what music they're listening to and discover new tracks"
            actionLabel="Find Friends"
            actionHref="/social"
          />
        )}
      </section>

      {/* Global Trending - Fallback discovery */}
      <section>
        <SectionHeader 
          title="Trending Globally" 
          icon={Flame} 
          href="/all-trending"
          subtitle="Top 100 songs across all campuses"
        />
        <div className="space-y-1">
          {trendingLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))
          ) : trendingTracks && trendingTracks.length > 0 ? (
            trendingTracks.slice(0, 5).map((track, index) => (
              <TrackListItem 
                key={track.id} 
                track={track} 
                index={index}
                isLiked={likedTrackIds.has(track.id)}
                onLike={() => handleLike(track.id)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No trending tracks available yet
            </div>
          )}
        </div>
      </section>

      {/* Popular Artists */}
      {topArtists.length > 0 && (
        <section>
          <SectionHeader title="Popular Artists" icon={Star} href="/all-artists" />
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4">
              {artistsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-40 flex-shrink-0 rounded-lg" />
                ))
              ) : (
                topArtists.map((artist) => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <Card className="w-40 flex-shrink-0 overflow-hidden hover-elevate transition-all p-4 text-center space-y-3 cursor-pointer h-full flex flex-col items-center" data-testid={`card-artist-home-${artist.id}`}>
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
                        <AvatarFallback className="bg-primary/20">
                          <Music className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 w-full px-1">
                        <h3 className="font-semibold truncate text-sm">{artist.stageName}</h3>
                        <p className="text-xs text-muted-foreground">{artist.trackCount} tracks</p>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}
    </div>
  );
}
