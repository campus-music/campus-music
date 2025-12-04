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
  Disc3
} from "lucide-react";

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
    <Card className="bg-gradient-to-br from-primary/10 to-background">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${party.isPlaying ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
              <Headphones className={`h-6 w-6 ${party.isPlaying ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{party.title}</h2>
              {party.locationHint && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {party.locationHint}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <code className="font-mono font-bold">{party.code}</code>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyCode}
                className="h-6 w-6"
                data-testid="button-copy-party-code"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
        
        {currentPartyTrack ? (
          <div className="flex items-center gap-4 bg-background/50 rounded-lg p-4">
            <img
              src={currentPartyTrack.coverImageUrl || '/placeholder-album.png'}
              alt={currentPartyTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentPartyTrack.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentPartyTrack.artist?.stageName}
              </p>
            </div>
            {isHost && (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePlayPause}
                  disabled={playbackMutation.isPending}
                  data-testid="button-play-pause"
                >
                  {party.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {/* skip to next in queue */}}
                  data-testid="button-skip"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 bg-background/50 rounded-lg p-8">
            <Music className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No track playing. Add songs to the queue!</p>
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
          <Users className="h-5 w-5" />
          Listeners ({party.members?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {party.members?.map((member) => (
            <Badge
              key={member.id}
              variant={member.isHost ? "default" : "secondary"}
              className="gap-1 py-1 px-2"
            >
              {member.isHost && <Crown className="h-3 w-3" />}
              {member.user?.fullName}
              {member.userId === user?.id && " (you)"}
            </Badge>
          ))}
        </div>
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
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Disc3 className="h-5 w-5" />
            Up Next
          </CardTitle>
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1" data-testid="button-add-to-queue">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Track to Queue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-tracks"
                />
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {searchResults?.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => addToQueueMutation.mutate(track.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover-elevate text-left"
                        disabled={addToQueueMutation.isPending}
                        data-testid={`button-add-track-${track.id}`}
                      >
                        <img
                          src={track.coverImageUrl || '/placeholder-album.png'}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{track.genre}</p>
                        </div>
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
        {party.queue && party.queue.length > 0 ? (
          <div className="space-y-2">
            {party.queue.filter(q => !q.played).map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                <img
                  src={item.track?.coverImageUrl || '/placeholder-album.png'}
                  alt={item.track?.title}
                  className="w-10 h-10 rounded object-cover"
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
          <p className="text-center text-muted-foreground py-4">
            Queue is empty. Add some tracks!
          </p>
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
        <Button size="lg" className="gap-2" data-testid="button-create-party">
          <Plus className="h-5 w-5" />
          Start a Party
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Start a Listening Party
          </DialogTitle>
          <DialogDescription>
            Listen to music together in real-time with friends nearby
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
              data-testid="input-party-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location-hint">Location Hint (optional)</Label>
            <Input
              id="location-hint"
              placeholder="Library 2nd floor, Jake's dorm..."
              value={locationHint}
              onChange={(e) => setLocationHint(e.target.value)}
              data-testid="input-location-hint"
            />
            <p className="text-xs text-muted-foreground">
              Help nearby friends find you
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
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
          Join Party
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Listening Party</DialogTitle>
          <DialogDescription>
            Enter the 6-character code from your friend
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            className="text-center text-2xl font-mono tracking-widest"
            maxLength={6}
            data-testid="input-join-party-code"
          />
        </div>
        
        <Button
          onClick={() => joinMutation.mutate()}
          disabled={code.length !== 6 || joinMutation.isPending}
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
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    );
  }
  
  if (!party) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Party not found or has ended</p>
          <Button onClick={() => navigate('/listening-party')} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const isHost = party.hostUserId === user?.id;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/listening-party')}>
          Back
        </Button>
        {isHost ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
            data-testid="button-end-party"
          >
            End Party
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            data-testid="button-leave-party"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave
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
      <div className="max-w-4xl mx-auto space-y-6">
        <PartyDetailView partyId={partyId} />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Headphones className="h-8 w-8 text-primary" />
            Listening Parties
          </h1>
          <p className="text-muted-foreground mt-1">
            Listen to music together with friends in real-time
          </p>
        </div>
        
        <Card className="bg-gradient-to-br from-green-500/20 to-background border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <Music className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Party Points</p>
              <p className="text-2xl font-bold" data-testid="text-party-points">
                {points?.listeningPartyPoints || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {activeParties && activeParties.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Active Parties</h2>
          {activeParties.map((party) => (
            <Card key={party.id} className="hover-elevate cursor-pointer" onClick={() => window.location.href = `/listening-party/${party.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${party.isPlaying ? 'bg-green-500/20' : 'bg-muted'}`}>
                      <Headphones className={`h-5 w-5 ${party.isPlaying ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{party.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {party.members?.length || 0} listeners
                      </p>
                    </div>
                  </div>
                  <Badge>{party.isPlaying ? "Playing" : "Paused"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Headphones className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Start a Listening Party</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create a shared music experience with friends. Everyone hears the same track at the same time!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <CreatePartyDialog />
              <JoinPartyDialog />
            </div>
          </CardContent>
        </Card>
      )}
      
      {(!activeParties || activeParties.length === 0) && (
        <div className="flex justify-center gap-4">
          <CreatePartyDialog />
          <JoinPartyDialog />
        </div>
      )}
    </div>
  );
}
