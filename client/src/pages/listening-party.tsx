import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ListeningPartyWithDetails, Track, UserPoints } from "@shared/schema";
import { 
  Headphones, 
  Play, 
  Pause, 
  SkipForward,
  Users, 
  Copy, 
  Check, 
  Plus,
  Music,
  MapPin,
  Crown,
  LogOut,
  Disc3,
  Radio,
  Waves,
  ArrowLeft,
  Search,
  Sparkles
} from "lucide-react";

function WaveformAnimation() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function PartyPlayer({ party, isHost }: { party: ListeningPartyWithDetails; isHost: boolean }) {
  const { playTrack, togglePlayPause, currentTrack, isPlaying: audioPlaying } = useAudioPlayer();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const currentPartyTrack = party.currentTrack;
  
  const playbackMutation = useMutation({
    mutationFn: async (data: { trackId?: string; positionMs?: number; isPlaying?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/listening-parties/${party.id}/playback`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties', party.id] });
    },
  });
  
  const copyCode = async () => {
    await navigator.clipboard.writeText(party.code);
    setCopied(true);
    toast({ description: "Party code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handlePlayPause = () => {
    if (!isHost) {
      toast({ 
        variant: "destructive", 
        description: "Only the host can control playback" 
      });
      return;
    }
    playbackMutation.mutate({ isPlaying: !party.isPlaying });
  };
  
  useEffect(() => {
    if (currentPartyTrack && party.isPlaying) {
      if (!currentTrack || currentTrack.id !== currentPartyTrack.id) {
        playTrack(currentPartyTrack);
      }
    } else if (!party.isPlaying && audioPlaying) {
      togglePlayPause();
    }
  }, [currentPartyTrack, party.isPlaying]);
  
  return (
    <Card className="relative overflow-hidden border-green-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-background to-background" />
      
      {party.isPlaying && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse" />
      )}
      
      <CardContent className="relative p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative p-4 rounded-2xl ${party.isPlaying ? 'bg-green-500/20' : 'bg-muted'}`}>
              <Headphones className={`h-8 w-8 ${party.isPlaying ? 'text-green-500' : 'text-muted-foreground'}`} />
              {party.isPlaying && (
                <div className="absolute -top-1 -right-1">
                  <div className="p-1 rounded-full bg-green-500">
                    <Radio className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{party.title}</h2>
              {party.locationHint && (
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-4 w-4" />
                  {party.locationHint}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={party.isPlaying ? "default" : "secondary"} className={`gap-1.5 py-1.5 px-3 ${party.isPlaying ? 'bg-green-500' : ''}`}>
              {party.isPlaying ? <Waves className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {party.isPlaying ? "LIVE" : "Paused"}
            </Badge>
            
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-full px-4 py-2 transition-colors"
              data-testid="button-copy-party-code"
            >
              <code className="font-mono font-bold text-primary">{party.code}</code>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>
        
        {currentPartyTrack ? (
          <div className="flex items-center gap-5 bg-background/80 rounded-2xl p-5 border border-border/50">
            <div className="relative">
              <img
                src={currentPartyTrack.coverImageUrl || '/placeholder-album.png'}
                alt={currentPartyTrack.title}
                className={`w-20 h-20 rounded-xl object-cover shadow-lg ${party.isPlaying ? 'ring-2 ring-green-500/50' : ''}`}
              />
              {party.isPlaying && (
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-green-500">
                  <Waves className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold truncate">{currentPartyTrack.title}</p>
              <p className="text-muted-foreground truncate">
                {currentPartyTrack.artist?.stageName}
              </p>
              {party.isPlaying && (
                <div className="mt-2">
                  <WaveformAnimation />
                </div>
              )}
            </div>
            {isHost && (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant={party.isPlaying ? "secondary" : "default"}
                  onClick={handlePlayPause}
                  disabled={playbackMutation.isPending}
                  className="rounded-full"
                  data-testid="button-play-pause"
                >
                  {party.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {}}
                  className="rounded-full"
                  data-testid="button-skip"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isHost && (
              <Badge variant="outline" className="gap-1.5 py-2">
                <Crown className="h-3 w-3 text-yellow-500" />
                Host controls
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 bg-background/80 rounded-2xl p-10 border border-dashed border-muted-foreground/30">
            <div className="p-4 rounded-full bg-muted">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">No track playing</p>
              <p className="text-muted-foreground">Add songs to the queue to start listening together!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PartyMembers({ party }: { party: ListeningPartyWithDetails }) {
  const { user } = useAuth();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Listeners
          <Badge variant="secondary" className="ml-auto">{party.members?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {party.members?.map((member) => (
          <div
            key={member.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl ${member.userId === user?.id ? 'bg-primary/10' : 'bg-muted/30'}`}
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className={member.isHost ? "bg-yellow-500/20 text-yellow-500" : ""}>
                {member.user?.fullName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium flex-1">
              {member.user?.fullName}
              {member.userId === user?.id && <span className="text-muted-foreground"> (you)</span>}
            </span>
            {member.isHost && (
              <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-500">
                <Crown className="h-3 w-3" />
                Host
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PartyQueue({ party, isHost }: { party: ListeningPartyWithDetails; isHost: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: searchResults } = useQuery<Track[]>({
    queryKey: ['/api/tracks/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });
  
  const addToQueueMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const res = await apiRequest("POST", `/api/listening-parties/${party.id}/queue`, { trackId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties', party.id] });
      toast({ description: "Track added to queue!" });
      setSearchOpen(false);
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  const upNextTracks = party.queue?.filter(q => !q.played) || [];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Disc3 className="h-5 w-5 text-primary" />
            Up Next
            <Badge variant="secondary">{upNextTracks.length}</Badge>
          </CardTitle>
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" data-testid="button-add-to-queue">
                <Plus className="h-4 w-4" />
                Add Track
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Add Track to Queue
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search for tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11"
                  data-testid="input-search-tracks"
                />
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {searchResults?.length === 0 && searchQuery.length >= 2 && (
                      <p className="text-center text-muted-foreground py-8">No tracks found</p>
                    )}
                    {searchResults?.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => addToQueueMutation.mutate(track.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover-elevate text-left transition-colors"
                        disabled={addToQueueMutation.isPending}
                        data-testid={`button-add-track-${track.id}`}
                      >
                        <img
                          src={track.coverImageUrl || '/placeholder-album.png'}
                          alt={track.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{track.genre}</p>
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {upNextTracks.length > 0 ? (
          <div className="space-y-2">
            {upNextTracks.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-muted-foreground w-6 text-center">{index + 1}</span>
                <img
                  src={item.track?.coverImageUrl || '/placeholder-album.png'}
                  alt={item.track?.title}
                  className="w-11 h-11 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.track?.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Added by {item.addedBy?.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Disc3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Queue is empty</p>
            <p className="text-sm text-muted-foreground">Add tracks to listen together!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreatePartyDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/listening-parties", {
        title,
        description: description || null,
        locationHint: locationHint || null,
      });
      return res.json();
    },
    onSuccess: (party) => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties/active/me'] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setLocationHint("");
      navigate(`/listening-party/${party.id}`);
      toast({
        title: "Party Started!",
        description: "Share the code with friends to join",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-party">
          <Plus className="h-5 w-5" />
          Start a Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Headphones className="h-5 w-5 text-green-500" />
            </div>
            Start a Listening Party
          </DialogTitle>
          <DialogDescription>
            Listen to music in sync with friends nearby
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="party-title">Party Name</Label>
            <Input
              id="party-title"
              placeholder="Study vibes, Chill session..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              data-testid="input-party-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location-hint">
              Location Hint <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="location-hint"
              placeholder="Library 2nd floor, Jake's dorm..."
              value={locationHint}
              onChange={(e) => setLocationHint(e.target.value)}
              className="h-11"
              data-testid="input-location-hint"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Help nearby friends find you
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="What's the vibe?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              data-testid="input-party-description"
            />
          </div>
        </div>
        
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!title.trim() || createMutation.isPending}
          size="lg"
          className="w-full"
          data-testid="button-confirm-create-party"
        >
          {createMutation.isPending ? "Creating..." : "Start Party"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function JoinPartyDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/listening-parties/join", { code: code.toUpperCase() });
      return res.json();
    },
    onSuccess: (party) => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties/active/me'] });
      setOpen(false);
      setCode("");
      navigate(`/listening-party/${party.id}`);
      toast({
        title: "Joined the Party!",
        description: "Enjoy listening together",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2" data-testid="button-join-party">
          <Users className="h-5 w-5" />
          Join with Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Join a Party</DialogTitle>
          <DialogDescription className="text-center">
            Enter the 6-character code from your friend
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Input
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            className="text-center text-3xl font-mono tracking-[0.5em] h-16 bg-muted/50"
            maxLength={6}
            data-testid="input-join-party-code"
          />
        </div>
        
        <Button
          onClick={() => joinMutation.mutate()}
          disabled={code.length !== 6 || joinMutation.isPending}
          size="lg"
          className="w-full"
          data-testid="button-confirm-join-party"
        >
          {joinMutation.isPending ? "Joining..." : "Join Party"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PartyDetailView({ partyId }: { partyId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const { data: party, isLoading, refetch } = useQuery<ListeningPartyWithDetails>({
    queryKey: ['/api/listening-parties', partyId],
    refetchInterval: 3000,
  });
  
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/listening-parties/${partyId}/leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties/active/me'] });
      navigate('/listening-party');
      toast({ description: "Left the party" });
    },
  });
  
  const endMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/listening-parties/${partyId}/end`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening-parties/active/me'] });
      navigate('/listening-party');
      toast({ description: "Party ended" });
    },
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }
  
  if (!party) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Party Not Found</h3>
          <p className="text-muted-foreground mb-6">This party may have ended or doesn't exist.</p>
          <Button onClick={() => navigate('/listening-party')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Parties
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const isHost = party.hostUserId === user?.id;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/listening-party')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {isHost ? (
          <Button
            variant="destructive"
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
            data-testid="button-end-party"
          >
            End Party
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            data-testid="button-leave-party"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Party
          </Button>
        )}
      </div>
      
      <PartyPlayer party={party} isHost={isHost} />
      
      <div className="grid md:grid-cols-2 gap-4">
        <PartyMembers party={party} />
        <PartyQueue party={party} isHost={isHost} />
      </div>
    </div>
  );
}

function PartyCard({ party }: { party: ListeningPartyWithDetails }) {
  const [, navigate] = useLocation();
  
  return (
    <Card 
      className="hover-elevate cursor-pointer overflow-hidden border-green-500/20" 
      onClick={() => navigate(`/listening-party/${party.id}`)}
    >
      <div className={`h-1 ${party.isPlaying ? 'bg-green-500' : 'bg-muted'}`} />
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl ${party.isPlaying ? 'bg-green-500/20' : 'bg-muted'}`}>
            <Headphones className={`h-6 w-6 ${party.isPlaying ? 'text-green-500' : 'text-muted-foreground'}`} />
            {party.isPlaying && (
              <div className="absolute -top-1 -right-1 p-1 rounded-full bg-green-500">
                <Radio className="h-2 w-2 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{party.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              {party.members?.length || 0} listeners
              {party.locationHint && (
                <>
                  <span className="text-border">•</span>
                  <MapPin className="h-3.5 w-3.5" />
                  {party.locationHint}
                </>
              )}
            </p>
          </div>
          <Badge variant={party.isPlaying ? "default" : "secondary"} className={party.isPlaying ? "bg-green-500" : ""}>
            {party.isPlaying ? "LIVE" : "Paused"}
          </Badge>
        </div>
        
        {party.currentTrack && (
          <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-muted/30">
            <img
              src={party.currentTrack.coverImageUrl || '/placeholder-album.png'}
              alt={party.currentTrack.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{party.currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{party.currentTrack.artist?.stageName}</p>
            </div>
            {party.isPlaying && <WaveformAnimation />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ListeningPartyPage() {
  const params = useParams();
  const partyId = params.id as string | undefined;
  
  const { data: activeParties, isLoading } = useQuery<ListeningPartyWithDetails[]>({
    queryKey: ['/api/listening-parties/active/me'],
    enabled: !partyId,
  });
  
  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
  });
  
  if (partyId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <PartyDetailView partyId={partyId} />
      </div>
    );
  }
  
  const hasActiveParties = activeParties && activeParties.length > 0;
  
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-background p-8 border border-green-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Headphones className="h-8 w-8 text-green-500" />
              </div>
              Listening Parties
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-md">
              Listen to music together in real-time with friends. Create a party and share the code!
            </p>
          </div>
          
          <Card className="border-green-500/30 bg-background/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-green-500/20">
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-party-points">
                  {points?.listeningPartyPoints || 0}
                </p>
                <p className="text-xs text-muted-foreground">Party Points</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Active Parties */}
      {hasActiveParties && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-500" />
            Your Active Parties
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </div>
      )}
      
      {/* CTA Section */}
      <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
        <CardContent className="relative p-8 md:p-12 text-center space-y-6">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Headphones className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              {hasActiveParties ? "Start Another Party" : "Ready to Listen Together?"}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Create a listening party and invite friends to enjoy music together in perfect sync.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CreatePartyDialog />
            <JoinPartyDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
