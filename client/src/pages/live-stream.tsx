import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ArrowLeft,
  StopCircle,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LiveStreamWithArtist, LiveStreamMessageWithUser, ArtistProfile, User } from "@shared/schema";

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export default function LiveStreamPage() {
  const params = useParams();
  const streamId = params.streamId as string;
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch stream details
  const { data: stream, isLoading, error } = useQuery<LiveStreamWithArtist>({
    queryKey: ["/api/live-streams", streamId],
    refetchInterval: (query) => query.state.data?.status === 'live' ? 5000 : false,
  });

  // Fetch artist profile for current user
  const { data: artistProfile } = useQuery<ArtistProfile | null>({
    queryKey: ["/api/artists/profile"],
    enabled: !!user && user.role === "artist",
  });

  const isHost = stream && artistProfile && stream.artistId === artistProfile.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading stream...</div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Stream Not Found</h2>
          <p className="text-muted-foreground mb-4">This stream may have ended or doesn't exist.</p>
          <Button onClick={() => navigate("/live")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Live Streams
          </Button>
        </Card>
      </div>
    );
  }

  if (stream.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Stream Ended</h2>
          <p className="text-muted-foreground mb-4">
            This stream by {stream.artist?.stageName} has ended.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Peak: {stream.peakViewerCount} viewers
            </div>
          </div>
          <Button onClick={() => navigate("/live")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Live Streams
          </Button>
        </Card>
      </div>
    );
  }

  return isHost ? (
    <BroadcasterView stream={stream} artistProfile={artistProfile} user={user!} />
  ) : (
    <ViewerView stream={stream} user={user} />
  );
}

// Broadcaster View - For the artist going live
function BroadcasterView({ 
  stream, 
  artistProfile,
  user
}: { 
  stream: LiveStreamWithArtist;
  artistProfile: ArtistProfile;
  user: User;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Failed to get media:", error);
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access your camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };
    initMedia();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Connect to WebSocket for signaling
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        streamId: stream.id,
        userId: user.id,
        role: 'host',
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'peer-joined': {
          if (!data.isHost && localStream) {
            // Create peer connection for new viewer
            await createPeerConnection(data.userId, true);
          }
          setViewerCount(data.peerCount - 1); // Exclude host
          break;
        }
        case 'peer-left': {
          setViewerCount(data.peerCount - 1);
          const pc = peerConnections.current.get(data.userId);
          if (pc) {
            pc.close();
            peerConnections.current.delete(data.userId);
          }
          break;
        }
        case 'answer': {
          const pc = peerConnections.current.get(data.fromUserId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          break;
        }
        case 'ice-candidate': {
          const pc = peerConnections.current.get(data.fromUserId);
          if (pc && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;
        }
        case 'chat': {
          setMessages(prev => [...prev, {
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp,
          }]);
          break;
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [stream.id, user.id, localStream]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createPeerConnection = async (viewerId: string, createOffer: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnections.current.set(viewerId, pc);

    // Add local tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          targetUserId: viewerId,
          candidate: event.candidate,
        }));
      }
    };

    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          targetUserId: viewerId,
          offer: offer,
        }));
      }
    }

    return pc;
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      wsRef.current?.send(JSON.stringify({ type: 'stream-ended' }));
      const res = await apiRequest("POST", `/api/live-streams/${stream.id}/end`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Stream ended", description: "Your live stream has ended." });
      localStream?.getTracks().forEach(track => track.stop());
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
      navigate("/live");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to end stream", description: error.message, variant: "destructive" });
    },
  });

  const sendChatMessage = () => {
    if (!newMessage.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      streamId: stream.id,
      userId: user.id,
      userName: artistProfile.stageName,
      message: newMessage.trim(),
    }));

    setNewMessage("");
  };

  const startedAt = stream.startedAt ? new Date(stream.startedAt) : new Date();
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 60000);

  return (
    <div className="min-h-screen bg-background" data-testid="broadcaster-view">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse gap-1">
              <Radio className="w-3 h-3" />
              LIVE
            </Badge>
            <span className="text-lg font-semibold">{stream.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{viewerCount} viewers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{duration}m</span>
            </div>
            <Button 
              variant="destructive"
              onClick={() => endStreamMutation.mutate()}
              disabled={endStreamMutation.isPending}
              data-testid="button-end-stream"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              End Stream
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden bg-black">
              <div className="aspect-video relative">
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                      <Avatar className="w-24 h-24 mx-auto mb-4">
                        <AvatarImage src={artistProfile.profileImageUrl || undefined} />
                        <AvatarFallback>{artistProfile.stageName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-white">Camera is off</p>
                    </div>
                  </div>
                )}
                {/* Stream info overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                </div>
              </div>
            </Card>

            {/* Controls */}
            <Card className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isVideoOn ? "default" : "destructive"}
                  size="icon"
                  onClick={toggleVideo}
                  data-testid="button-toggle-video"
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
                <Button
                  variant={isAudioOn ? "default" : "destructive"}
                  size="icon"
                  onClick={toggleAudio}
                  data-testid="button-toggle-audio"
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          <Card className="h-[600px] flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Live Chat</span>
            </div>
            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    Chat messages will appear here
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-medium text-[#E84A5F]">{msg.userName}:</span>
                      <span className="text-foreground">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message..."
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  data-testid="input-chat-message"
                />
                <Button 
                  size="icon" 
                  onClick={sendChatMessage}
                  disabled={!newMessage.trim()}
                  data-testid="button-send-chat"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Viewer View - For fans watching the stream
function ViewerView({ 
  stream, 
  user 
}: { 
  stream: LiveStreamWithArtist;
  user: User | null;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Join the stream
  const joinStreamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/live-streams/${stream.id}/join`);
      return res.json();
    },
  });

  // Leave the stream
  const leaveStreamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/live-streams/${stream.id}/leave`);
      return res.json();
    },
  });

  // Connect to WebSocket for signaling
  useEffect(() => {
    if (!user) return;

    joinStreamMutation.mutate();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        streamId: stream.id,
        userId: user.id,
        role: 'viewer',
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'joined': {
          setIsConnecting(false);
          setViewerCount(data.peerCount);
          break;
        }
        case 'peer-joined': {
          setViewerCount(data.peerCount);
          break;
        }
        case 'peer-left': {
          setViewerCount(data.peerCount);
          break;
        }
        case 'offer': {
          // Received offer from host
          await handleOffer(data.offer, data.fromUserId);
          break;
        }
        case 'ice-candidate': {
          if (peerConnectionRef.current && data.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;
        }
        case 'chat': {
          setMessages(prev => [...prev, {
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp,
          }]);
          break;
        }
        case 'stream-ended': {
          toast({ title: "Stream ended", description: "The host has ended the stream." });
          navigate("/live");
          break;
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      leaveStreamMutation.mutate();
      ws.close();
      peerConnectionRef.current?.close();
    };
  }, [user, stream.id]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOffer = async (offer: RTCSessionDescriptionInit, hostId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          targetUserId: hostId,
          candidate: event.candidate,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        targetUserId: hostId,
        answer: answer,
      }));
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !user) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      streamId: stream.id,
      userId: user.id,
      userName: user.fullName || 'Anonymous',
      message: newMessage.trim(),
    }));

    setNewMessage("");
  };

  const startedAt = stream.startedAt ? new Date(stream.startedAt) : new Date();
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 60000);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to watch live streams.
          </p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="viewer-view">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/live")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge variant="destructive" className="animate-pulse gap-1">
              <Radio className="w-3 h-3" />
              LIVE
            </Badge>
            <span className="text-lg font-semibold">{stream.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{viewerCount} viewers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{duration}m</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden bg-black">
              <div className="aspect-video relative">
                <video 
                  ref={remoteVideoRef}
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                />
                {(isConnecting || !isConnected) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                      <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-[#E84A5F]">
                        <AvatarImage src={stream.artist?.profileImageUrl || undefined} />
                        <AvatarFallback>{stream.artist?.stageName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-white mb-2">{stream.artist?.stageName}</p>
                      <p className="text-white/60 text-sm">
                        {isConnecting ? "Connecting to stream..." : "Waiting for video..."}
                      </p>
                    </div>
                  </div>
                )}
                {/* Stream info overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                </div>
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="mt-4 p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-[#E84A5F]">
                  <AvatarImage src={stream.artist?.profileImageUrl || undefined} />
                  <AvatarFallback>{stream.artist?.stageName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">{stream.artist?.stageName}</h2>
                  {stream.description && (
                    <p className="text-sm text-muted-foreground">{stream.description}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          <Card className="h-[600px] flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Live Chat</span>
            </div>
            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    Welcome to the chat! Say hi to {stream.artist?.stageName}
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-medium text-[#E84A5F]">{msg.userName}:</span>
                      <span className="text-foreground">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message..."
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  data-testid="input-viewer-chat"
                />
                <Button 
                  size="icon" 
                  onClick={sendChatMessage}
                  disabled={!newMessage.trim()}
                  data-testid="button-send-viewer-chat"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
