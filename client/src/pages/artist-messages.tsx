import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Music, 
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ArtistProfile, ArtistMessage, ConversationPreview } from '@shared/schema';

export default function ArtistMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/messages/:connectionId');
  const connectionId = params?.connectionId;

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user && user.role === 'artist',
  });

  if (!user || user.role !== 'artist') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Artist Messages</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Chat with other student artists you're connected with.
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

  return connectionId ? (
    <ChatView connectionId={connectionId} artistProfile={artistProfile} />
  ) : (
    <ConversationsView artistProfile={artistProfile} />
  );
}

function ConversationsView({ artistProfile }: { artistProfile: ArtistProfile }) {
  const [, navigate] = useLocation();

  const { data: conversations = [], isLoading } = useQuery<ConversationPreview[]>({
    queryKey: ['/api/messages/conversations'],
    refetchInterval: 10000,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32">
      <div>
        <h1 className="text-4xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground text-lg">
          Chat with your connected artists
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Connect with other artists to start chatting about music and collaboration.
              </p>
              <Button onClick={() => navigate('/friends')} data-testid="button-find-artists">
                Find Artists
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.connection.id}
                    conversation={conv}
                    onClick={() => navigate(`/messages/${conv.connection.id}`)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConversationItem({ 
  conversation, 
  onClick 
}: { 
  conversation: ConversationPreview;
  onClick: () => void;
}) {
  const { otherArtist, lastMessage, unreadCount } = conversation;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors text-left"
      data-testid={`conversation-${conversation.connection.id}`}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={otherArtist.profileImageUrl || undefined} alt={otherArtist.stageName} />
        <AvatarFallback className="bg-primary/20">
          <Music className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold truncate">{otherArtist.stageName}</h4>
          {lastMessage && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {lastMessage ? lastMessage.content : 'Start a conversation'}
        </p>
      </div>
      {unreadCount > 0 && (
        <Badge className="shrink-0">{unreadCount}</Badge>
      )}
    </button>
  );
}

function ChatView({ 
  connectionId, 
  artistProfile 
}: { 
  connectionId: string;
  artistProfile: ArtistProfile;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<ConversationPreview[]>({
    queryKey: ['/api/messages/conversations'],
  });

  const currentConversation = conversations.find(c => c.connection.id === connectionId);
  const otherArtist = currentConversation?.otherArtist;

  const { data: messages = [], isLoading } = useQuery<ArtistMessage[]>({
    queryKey: ['/api/messages', connectionId],
    refetchInterval: 3000,
    enabled: !!connectionId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/messages/${connectionId}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-200px)] flex flex-col pb-32">
      <div className="flex items-center gap-4 pb-4 border-b mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/messages')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {otherArtist && (
          <>
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => navigate(`/artist/${otherArtist.id}`)}
            >
              <AvatarImage src={otherArtist.profileImageUrl || undefined} alt={otherArtist.stageName} />
              <AvatarFallback className="bg-primary/20">
                <Music className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 
                className="font-semibold cursor-pointer hover:text-primary"
                onClick={() => navigate(`/artist/${otherArtist.id}`)}
              >
                {otherArtist.stageName}
              </h2>
              <p className="text-xs text-muted-foreground">{otherArtist.mainGenre}</p>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Start the conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Say hello and start collaborating on music!
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {sortedMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === artistProfile.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t mt-4">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sendMutation.isPending}
          data-testid="input-message"
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || sendMutation.isPending}
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isOwn 
}: { 
  message: ArtistMessage;
  isOwn: boolean;
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-muted rounded-bl-md'
        }`}
        data-testid={`message-${message.id}`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
