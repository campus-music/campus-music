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
  Search, 
  MessageCircle,
  Clock,
  Check,
  X,
  Music,
  GraduationCap,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { UserConnectionWithUsers, User } from '@shared/schema';

type SafeUser = {
  id: string;
  email: string;
  fullName: string;
  universityName: string;
  profileImageUrl: string | null;
  role: string;
};

type FriendSuggestion = {
  user: User;
  similarityScore: number;
  commonArtists: string[];
  commonGenres: string[];
};

export default function Social() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friends = [], isLoading: friendsLoading } = useQuery<UserConnectionWithUsers[]>({
    queryKey: ['/api/social/friends'],
    enabled: !!user,
  });

  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery<UserConnectionWithUsers[]>({
    queryKey: ['/api/social/pending'],
    enabled: !!user,
  });

  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<UserConnectionWithUsers[]>({
    queryKey: ['/api/social/sent'],
    enabled: !!user,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ['/api/users/all'],
    enabled: !!user,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<FriendSuggestion[]>({
    queryKey: ['/api/social/suggestions'],
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('POST', `/api/social/${connectionId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/pending'] });
      toast({ title: 'Friend request accepted!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to accept', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('POST', `/api/social/${connectionId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/pending'] });
      toast({ title: 'Request declined' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to decline', description: error.message, variant: 'destructive' });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('POST', `/api/social/connect/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/sent'] });
      toast({ title: 'Friend request sent!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send request', description: error.message, variant: 'destructive' });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest('DELETE', `/api/social/${connectionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/sent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
      toast({ title: 'Request cancelled' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to cancel', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connect with Others</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect with fellow students, share music, and chat with friends.
          Sign in to start connecting.
        </p>
        <Button onClick={() => navigate('/login')} data-testid="button-login-social">
          Sign In
        </Button>
      </div>
    );
  }

  const connectedUserIds = friends.map(c => 
    c.requesterId === user.id ? c.receiverId : c.requesterId
  );
  const pendingUserIds = pendingRequests.map(p => p.requesterId);
  const sentUserIds = sentRequests.map(s => s.receiverId);
  
  const discoverableUsers = allUsers.filter(u => 
    u.id !== user.id &&
    !connectedUserIds.includes(u.id) &&
    !pendingUserIds.includes(u.id) &&
    !sentUserIds.includes(u.id)
  );

  const filteredDiscoverUsers = searchQuery
    ? discoverableUsers.filter(u => 
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : discoverableUsers;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <div>
        <h1 className="text-4xl font-bold mb-2">Social</h1>
        <p className="text-muted-foreground text-lg">
          Connect and chat with fellow students
        </p>
      </div>

      {/* Suggested Friends based on Music Taste */}
      {suggestions.length > 0 && (
        <SuggestedFriendsCarousel 
          suggestions={suggestions}
          onConnect={(userId) => sendRequestMutation.mutate(userId)}
          isConnecting={sendRequestMutation.isPending}
        />
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2" data-testid="tab-social-friends">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Friends</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-1">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2" data-testid="tab-social-requests">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
            {pendingRequests.length > 0 && (
              <Badge className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2" data-testid="tab-social-sent">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Sent</span>
            {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{sentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2" data-testid="tab-social-discover">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Discover</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Friends
              </CardTitle>
              <CardDescription>
                People you've connected with. Start a conversation or check out their profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <LoadingState />
              ) : friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No friends yet"
                  description="Discover and connect with other students to start chatting."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {friends.map((connection) => {
                      const otherUser = connection.requesterId === user.id 
                        ? connection.receiver 
                        : connection.requester;
                      return (
                        <FriendCard
                          key={connection.id}
                          user={otherUser}
                          connectionId={connection.id}
                          onMessage={() => navigate(`/chat/${connection.id}`)}
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
                People who want to connect with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <LoadingState />
              ) : pendingRequests.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No pending requests"
                  description="When someone sends you a friend request, it will appear here."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        user={request.requester}
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
                Friend requests you've sent that are awaiting response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentLoading ? (
                <LoadingState />
              ) : sentRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="When you send a friend request, it will appear here until they respond."
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <SentRequestCard
                        key={request.id}
                        user={request.receiver}
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
                Discover People
              </CardTitle>
              <CardDescription>
                Find and connect with other students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or university..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              {usersLoading ? (
                <LoadingState />
              ) : filteredDiscoverUsers.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={searchQuery ? "No users found" : "No new people to discover"}
                  description={searchQuery ? "Try a different search term" : "You've already connected with everyone!"}
                />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {filteredDiscoverUsers.map((discoverUser) => (
                      <DiscoverCard
                        key={discoverUser.id}
                        user={discoverUser}
                        onConnect={() => sendRequestMutation.mutate(discoverUser.id)}
                        isConnecting={sendRequestMutation.isPending}
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
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type SharedTaste = {
  similarityScore: number;
  commonArtists: { id: string; artistName: string }[];
  commonGenres: string[];
  visible?: boolean;
};

function FriendCard({ 
  user, 
  connectionId,
  onMessage, 
  onRemove, 
  isRemoving 
}: { 
  user: User; 
  connectionId: string;
  onMessage: () => void; 
  onRemove: () => void; 
  isRemoving: boolean;
}) {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  const [showTaste, setShowTaste] = useState(false);

  const { data: sharedTaste } = useQuery<SharedTaste>({
    queryKey: ['/api/social/shared-taste', user.id],
    enabled: showTaste,
  });

  const hasSharedTaste = sharedTaste && (sharedTaste.commonArtists.length > 0 || sharedTaste.commonGenres.length > 0);
  
  return (
    <div 
      className="p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`card-friend-${user.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{user.fullName}</h3>
              {user.role === 'artist' && (
                <Badge variant="secondary" className="text-xs">
                  <Music className="h-3 w-3 mr-1" />
                  Artist
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              {user.universityName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowTaste(!showTaste)}
            data-testid={`button-taste-${user.id}`}
          >
            <Heart className={`h-4 w-4 ${showTaste ? 'text-primary fill-primary' : ''}`} />
          </Button>
          <Button 
            size="sm" 
            onClick={onMessage}
            data-testid={`button-message-${user.id}`}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRemove}
            disabled={isRemoving}
            data-testid={`button-remove-friend-${user.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showTaste && sharedTaste && (
        <div className="mt-3 pt-3 border-t">
          {sharedTaste.visible === false ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              This user has chosen to keep their music preferences private.
            </p>
          ) : hasSharedTaste ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">
                  <Heart className="h-3 w-3 mr-1 text-primary" />
                  {sharedTaste.similarityScore}% match
                </Badge>
              </div>
              {sharedTaste.commonArtists.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    <Music className="h-3 w-3 inline mr-1" />
                    Common artists
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sharedTaste.commonArtists.map((artist) => (
                      <Badge key={artist.id} variant="outline" className="text-xs">
                        {artist.artistName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {sharedTaste.commonGenres.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Common genres
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sharedTaste.commonGenres.map((genre) => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No shared music preferences found. Add your favorite artists and genres in your profile!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({ 
  user, 
  onAccept, 
  onReject, 
  isAccepting, 
  isRejecting 
}: { 
  user: User; 
  onAccept: () => void; 
  onReject: () => void; 
  isAccepting: boolean; 
  isRejecting: boolean;
}) {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`card-request-${user.id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{user.fullName}</h3>
            {user.role === 'artist' && (
              <Badge variant="secondary" className="text-xs">
                <Music className="h-3 w-3 mr-1" />
                Artist
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <GraduationCap className="h-3 w-3" />
            {user.universityName}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm"
          onClick={onAccept}
          disabled={isAccepting || isRejecting}
          data-testid={`button-accept-${user.id}`}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onReject}
          disabled={isAccepting || isRejecting}
          data-testid={`button-reject-${user.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SentRequestCard({ 
  user, 
  onCancel, 
  isCancelling 
}: { 
  user: User; 
  onCancel: () => void; 
  isCancelling: boolean;
}) {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`card-sent-${user.id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{user.fullName}</h3>
            {user.role === 'artist' && (
              <Badge variant="secondary" className="text-xs">
                <Music className="h-3 w-3 mr-1" />
                Artist
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <GraduationCap className="h-3 w-3" />
            {user.universityName}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Waiting for response...</p>
        </div>
      </div>
      <Button 
        size="sm" 
        variant="outline"
        onClick={onCancel}
        disabled={isCancelling}
        data-testid={`button-cancel-${user.id}`}
      >
        Cancel
      </Button>
    </div>
  );
}

function DiscoverCard({ 
  user, 
  onConnect, 
  isConnecting 
}: { 
  user: SafeUser; 
  onConnect: () => void; 
  isConnecting: boolean;
}) {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`card-discover-${user.id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{user.fullName}</h3>
            {user.role === 'artist' && (
              <Badge variant="secondary" className="text-xs">
                <Music className="h-3 w-3 mr-1" />
                Artist
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <GraduationCap className="h-3 w-3" />
            {user.universityName}
          </div>
        </div>
      </div>
      <Button 
        size="sm"
        onClick={onConnect}
        disabled={isConnecting}
        data-testid={`button-connect-${user.id}`}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    </div>
  );
}

function SuggestedFriendsCarousel({
  suggestions,
  onConnect,
  isConnecting,
}: {
  suggestions: FriendSuggestion[];
  onConnect: (userId: string) => void;
  isConnecting: boolean;
}) {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('suggestions-carousel');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Suggested For You</h2>
            <p className="text-xs text-muted-foreground">Based on your music taste</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="h-7 w-7"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="h-7 w-7"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div 
        id="suggestions-carousel"
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.user.id}
            suggestion={suggestion}
            onConnect={() => onConnect(suggestion.user.id)}
            isConnecting={isConnecting}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onConnect,
  isConnecting,
}: {
  suggestion: FriendSuggestion;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const { user, similarityScore, commonArtists, commonGenres } = suggestion;
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Determine match quality for visual styling
  const matchQuality = similarityScore >= 50 ? 'high' : similarityScore >= 25 ? 'medium' : 'low';
  const matchColor = matchQuality === 'high' ? 'text-green-500' : matchQuality === 'medium' ? 'text-yellow-500' : 'text-primary';
  
  return (
    <Card 
      className="flex-shrink-0 w-44 hover-elevate transition-all group relative"
      style={{ scrollSnapAlign: 'start' }}
      data-testid={`card-suggestion-${user.id}`}
    >
      {/* Match percentage badge - top right corner */}
      <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-muted/80 text-[10px] font-semibold ${matchColor}`}>
        {similarityScore}%
      </div>
      
      <CardContent className="p-4 pt-3 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="mb-3">
          <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-offset-background ring-primary/30">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Name */}
        <h3 className="font-semibold text-sm truncate w-full mb-0.5">{user.fullName}</h3>
        
        {/* University */}
        {user.universityName && (
          <p className="text-[11px] text-muted-foreground truncate w-full mb-3">
            {user.universityName}
          </p>
        )}
        
        {/* Common interests - compact */}
        {(commonArtists.length > 0 || commonGenres.length > 0) && (
          <div className="w-full mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">You both like</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {commonArtists.slice(0, 1).map((artist) => (
                <Badge key={artist} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {artist}
                </Badge>
              ))}
              {commonGenres.slice(0, 1).map((genre) => (
                <Badge key={genre} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {genre}
                </Badge>
              ))}
              {(commonArtists.length + commonGenres.length) > 2 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  +{(commonArtists.length + commonGenres.length) - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Connect button */}
        <Button 
          size="sm"
          className="w-full h-8 text-xs"
          onClick={onConnect}
          disabled={isConnecting}
          data-testid={`button-connect-suggestion-${user.id}`}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}
