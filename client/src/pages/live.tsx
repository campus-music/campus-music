import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { 
  Radio, 
  Users, 
  MessageCircle, 
  Send, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MonitorUp, 
  X, 
  Eye,
  Clock,
  Play,
  StopCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LiveStreamWithArtist, LiveStreamMessageWithUser, ArtistProfile, User } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export default function LivePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch artist profile if user is an artist
  const { data: artistProfile } = useQuery<ArtistProfile | null>({
    queryKey: ["/api/artist/profile"],
    enabled: !!user && user.role === "artist",
  });

  const isArtist = user?.role === "artist" && !!artistProfile;
  const { toast } = useToast();
  const [showGoLiveDialog, setShowGoLiveDialog] = useState(false);

  // Fetch active live streams
  const { data: activeStreams = [], isLoading } = useQuery<LiveStreamWithArtist[]>({
    queryKey: ["/api/live-streams"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Check if current artist is live
  const { data: myLiveStatus } = useQuery<{ isLive: boolean; stream: LiveStreamWithArtist | null }>({
    queryKey: ["/api/artists", artistProfile?.id, "live"],
    enabled: !!artistProfile?.id,
  });

  const handleJoinStream = (streamId: string) => {
    navigate(`/live/${streamId}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="live-page">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Live Streams</h1>
            <p className="text-muted-foreground mt-1">Connect and interact with your favorite artists in real-time</p>
          </div>
          
          {isArtist && !myLiveStatus?.isLive && (
            <Dialog open={showGoLiveDialog} onOpenChange={setShowGoLiveDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#E84A5F] hover:bg-[#E84A5F]/90 gap-2"
                  data-testid="button-go-live"
                >
                  <Radio className="w-4 h-4" />
                  Go Live
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <GoLiveForm 
                  artistProfile={artistProfile!} 
                  onSuccess={(stream) => {
                    setShowGoLiveDialog(false);
                    navigate(`/live/${stream.id}`);
                  }} 
                />
              </DialogContent>
            </Dialog>
          )}

          {myLiveStatus?.isLive && myLiveStatus.stream && (
            <Button 
              onClick={() => navigate(`/live/${myLiveStatus.stream!.id}`)}
              className="bg-[#E84A5F] hover:bg-[#E84A5F]/90 gap-2 animate-pulse"
              data-testid="button-return-to-stream"
            >
              <Radio className="w-4 h-4" />
              Return to Your Stream
            </Button>
          )}
        </div>

        {/* Active Streams */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="destructive" className="animate-pulse">LIVE NOW</Badge>
            <span className="text-muted-foreground">{activeStreams.length} streams</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeStreams.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Live Streams</h3>
                  <p className="text-muted-foreground mt-1">
                    {isArtist 
                      ? "Be the first to go live! Start streaming now."
                      : "Check back later when your favorite artists are streaming."}
                  </p>
                </div>
                {isArtist && !myLiveStatus?.isLive && (
                  <Button 
                    onClick={() => setShowGoLiveDialog(true)}
                    className="bg-[#E84A5F] hover:bg-[#E84A5F]/90 gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    Start Streaming
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams.map((stream) => (
                <LiveStreamCard 
                  key={stream.id} 
                  stream={stream} 
                  onJoin={() => handleJoinStream(stream.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Live Stream Card Component
function LiveStreamCard({ 
  stream, 
  onJoin 
}: { 
  stream: LiveStreamWithArtist; 
  onJoin: () => void;
}) {
  const startedAt = stream.startedAt ? new Date(stream.startedAt) : new Date();
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 60000);

  return (
    <Card 
      className="group cursor-pointer hover-elevate overflow-hidden"
      onClick={onJoin}
      data-testid={`card-stream-${stream.id}`}
    >
      <div className="aspect-video bg-gradient-to-br from-[#E84A5F]/20 to-[#E84A5F]/5 relative flex items-center justify-center">
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse gap-1">
            <Radio className="w-3 h-3" />
            LIVE
          </Badge>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs text-white">
          <Eye className="w-3 h-3" />
          {stream.viewerCount}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs text-white">
          <Clock className="w-3 h-3" />
          {duration}m
        </div>
        <Avatar className="w-20 h-20 border-4 border-[#E84A5F]">
          <AvatarImage src={stream.artist?.profileImageUrl || undefined} />
          <AvatarFallback className="text-2xl bg-[#E84A5F]/20">
            {stream.artist?.stageName?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{stream.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">{stream.artist?.stageName}</span>
        </div>
        {stream.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{stream.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Go Live Form Component
function GoLiveForm({ 
  artistProfile, 
  onSuccess 
}: { 
  artistProfile: ArtistProfile;
  onSuccess: (stream: LiveStreamWithArtist) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/live-streams", { title, description });
      return res.json();
    },
    onSuccess: (stream) => {
      toast({ title: "You're now live!", description: "Your stream has started." });
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
      onSuccess(stream);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start stream", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#E84A5F]" />
          Go Live
        </DialogTitle>
        <DialogDescription>
          Start streaming to your fans. Make sure your camera and microphone are ready.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium">Stream Title *</label>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Late Night Jam Session"
            className="mt-1"
            data-testid="input-stream-title"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you streaming today?"
            className="mt-1 resize-none"
            rows={3}
            data-testid="input-stream-description"
          />
        </div>
        <Button 
          onClick={() => createStreamMutation.mutate()}
          disabled={!title.trim() || createStreamMutation.isPending}
          className="w-full bg-[#E84A5F] hover:bg-[#E84A5F]/90 gap-2"
          data-testid="button-start-stream"
        >
          {createStreamMutation.isPending ? (
            <>Starting...</>
          ) : (
            <>
              <Radio className="w-4 h-4" />
              Start Streaming
            </>
          )}
        </Button>
      </div>
    </>
  );
}
