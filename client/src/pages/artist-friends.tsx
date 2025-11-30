import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageCircle, 
  Search, 
  Music, 
  Clock,
  Check,
  X
} from 'lucide-react';
import type { ArtistProfile, ArtistConnectionWithProfiles } from '@shared/schema';

export default function ArtistFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user && user.role === 'artist',
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<ArtistConnectionWithProfiles[]>({
    queryKey: ['/api/connections'],
    enabled: !!artistProfile,
  });

  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery<ArtistConnectionWithProfiles[]>({
    queryKey: ['/api/connections/pending'],
    enabled: !!artistProfile,
  });

  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<ArtistConnectionWithProfiles[]>({
    queryKey: ['/api/connections/sent'],
    enabled: !!artistProfile,
  });

  const { data: allArtists = [], isLoading: artistsLoading } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/artists/all'],
    enabled: !!artistProfile,
  });

  const acceptMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('POST', `/api/connections/${connectionId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/pending'] });
      toast({ title: 'Connection accepted!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to accept', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('POST', `/api/connections/${connectionId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections/pending'] });
      toast({ title: 'Request declined' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to decline', description: error.message, variant: 'destructive' });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (artistId: string) => {
      const res = await apiRequest('POST', `/api/connections/request/${artistId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections/sent'] });
      toast({ title: 'Connection request sent!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send request', description: error.message, variant: 'destructive' });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('DELETE', `/api/connections/${connectionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections/sent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({ title: 'Request cancelled' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to cancel', description: error.message, variant: 'destructive' });
    },
  });

  if (!user || user.role !== 'artist') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Artist Connections</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect with other student artists, collaborate on music, and chat about your craft.
          This feature is exclusively for artists.
        </p>
        <Button onClick={() => navigate('/artist/onboard')} data-testid="button-become-artist">
          Become an Artist
        </Button>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const connectedArtistIds = connections.map(c => 
    c.requesterId === artistProfile.id ? c.receiverId : c.requesterId
  );
  const pendingArtistIds = pendingRequests.map(p => p.requesterId);
  const sentArtistIds = sentRequests.map(s => s.receiverId);
  
  const discoverableArtists = allArtists.filter(a => 
    a.id !== artistProfile.id &&
    !connectedArtistIds.includes(a.id) &&
    !pendingArtistIds.includes(a.id) &&
    !sentArtistIds.includes(a.id)
  );

  const filteredDiscoverArtists = searchQuery
    ? discoverableArtists.filter(a => 
        a.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.mainGenre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : discoverableArtists;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <div>
        <h1 className="text-4xl font-bold mb-2">Artist Connections</h1>
        <p className="text-muted-foreground text-lg">
          Connect with fellow student artists and collaborate
        </p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2" data-testid="tab-friends">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Friends</span>
            {connections.length > 0 && (
              <Badge variant="secondary" className="ml-1">{connections.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2" data-testid="tab-requests">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
            {pendingRequests.length > 0 && (
              <Badge className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2" data-testid="tab-sent">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Sent</span>
            {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{sentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2" data-testid="tab-discover">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Discover</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Connected Artists
              </CardTitle>
              <CardDescription>
                Artists you've connected with. Start a conversation or check out their music.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <LoadingState />
              ) : connections.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No connections yet"
                  description="Discover and connect with other student artists to collaborate and share music."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {connections.map((connection) => {
                      const otherArtist = connection.requesterId === artistProfile.id 
                        ? connection.receiver 
                        : connection.requester;
                      return (
                        <ConnectionCard
                          key={connection.id}
                          artist={otherArtist}
                          connectionId={connection.id}
                          onMessage={() => navigate(`/messages/${connection.id}`)}
                          onRemove={() => cancelRequestMutation.mutate(connection.id)}
                          isRemoving={cancelRequestMutation.isPending}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Incoming Requests
              </CardTitle>
              <CardDescription>
                Artists who want to connect with you. Accept to start collaborating!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <LoadingState />
              ) : pendingRequests.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No pending requests"
                  description="When other artists want to connect, their requests will appear here."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        artist={request.requester}
                        onAccept={() => acceptMutation.mutate(request.id)}
                        onReject={() => rejectMutation.mutate(request.id)}
                        isAccepting={acceptMutation.isPending}
                        isRejecting={rejectMutation.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Sent Requests
              </CardTitle>
              <CardDescription>
                Connection requests you've sent that are awaiting a response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentLoading ? (
                <LoadingState />
              ) : sentRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="Requests you send to other artists will appear here until they respond."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <SentRequestCard
                        key={request.id}
                        artist={request.receiver}
                        onCancel={() => cancelRequestMutation.mutate(request.id)}
                        isCancelling={cancelRequestMutation.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Discover Artists
              </CardTitle>
              <CardDescription>
                Find and connect with student artists from campuses around the world.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-artists"
                />
              </div>

              {artistsLoading ? (
                <LoadingState />
              ) : filteredDiscoverArtists.length === 0 ? (
                <EmptyState
                  icon={Music}
                  title={searchQuery ? "No artists found" : "All caught up!"}
                  description={searchQuery 
                    ? "Try a different search term." 
                    : "You've connected with or sent requests to all available artists."}
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {filteredDiscoverArtists.map((artist) => (
                      <DiscoverCard
                        key={artist.id}
                        artist={artist}
                        onConnect={() => sendRequestMutation.mutate(artist.id)}
                        isSending={sendRequestMutation.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function ConnectionCard({ 
  artist, 
  connectionId,
  onMessage, 
  onRemove,
  isRemoving 
}: { 
  artist: ArtistProfile; 
  connectionId: string;
  onMessage: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors">
      <Avatar 
        className="h-12 w-12 cursor-pointer"
        onClick={() => navigate(`/artist/${artist.id}`)}
      >
        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
        <AvatarFallback className="bg-primary/20">
          <Music className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold truncate cursor-pointer hover:text-primary"
          onClick={() => navigate(`/artist/${artist.id}`)}
          data-testid={`text-artist-name-${artist.id}`}
        >
          {artist.stageName}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{artist.mainGenre}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={onMessage}
          data-testid={`button-message-${artist.id}`}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Chat
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onRemove}
          disabled={isRemoving}
          data-testid={`button-remove-${artist.id}`}
        >
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RequestCard({ 
  artist, 
  onAccept, 
  onReject,
  isAccepting,
  isRejecting 
}: { 
  artist: ArtistProfile; 
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}) {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors">
      <Avatar 
        className="h-12 w-12 cursor-pointer"
        onClick={() => navigate(`/artist/${artist.id}`)}
      >
        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
        <AvatarFallback className="bg-primary/20">
          <Music className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold truncate cursor-pointer hover:text-primary"
          onClick={() => navigate(`/artist/${artist.id}`)}
          data-testid={`text-request-artist-${artist.id}`}
        >
          {artist.stageName}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{artist.mainGenre}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={onAccept}
          disabled={isAccepting || isRejecting}
          data-testid={`button-accept-${artist.id}`}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onReject}
          disabled={isAccepting || isRejecting}
          data-testid={`button-reject-${artist.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SentRequestCard({ 
  artist, 
  onCancel,
  isCancelling 
}: { 
  artist: ArtistProfile; 
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors">
      <Avatar 
        className="h-12 w-12 cursor-pointer"
        onClick={() => navigate(`/artist/${artist.id}`)}
      >
        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
        <AvatarFallback className="bg-primary/20">
          <Music className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold truncate cursor-pointer hover:text-primary"
          onClick={() => navigate(`/artist/${artist.id}`)}
          data-testid={`text-sent-artist-${artist.id}`}
        >
          {artist.stageName}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{artist.mainGenre}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onCancel}
          disabled={isCancelling}
          data-testid={`button-cancel-${artist.id}`}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function DiscoverCard({ 
  artist, 
  onConnect,
  isSending 
}: { 
  artist: ArtistProfile; 
  onConnect: () => void;
  isSending: boolean;
}) {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors">
      <Avatar 
        className="h-12 w-12 cursor-pointer"
        onClick={() => navigate(`/artist/${artist.id}`)}
      >
        <AvatarImage src={artist.profileImageUrl || undefined} alt={artist.stageName} />
        <AvatarFallback className="bg-primary/20">
          <Music className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold truncate cursor-pointer hover:text-primary"
          onClick={() => navigate(`/artist/${artist.id}`)}
          data-testid={`text-discover-artist-${artist.id}`}
        >
          {artist.stageName}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{artist.mainGenre}</p>
        {artist.bio && (
          <p className="text-xs text-muted-foreground truncate mt-1">{artist.bio}</p>
        )}
      </div>
      <Button 
        size="sm" 
        onClick={onConnect}
        disabled={isSending}
        data-testid={`button-connect-${artist.id}`}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    </div>
  );
}
