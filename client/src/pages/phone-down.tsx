import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import type { PhoneDownChallengeWithParticipants, UserPoints } from "@shared/schema";
import { 
  Smartphone, 
  PhoneOff,
  Clock, 
  Trophy, 
  Users, 
  Zap, 
  Copy, 
  Check, 
  Plus,
  History,
  Star,
  Timer
} from "lucide-react";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function ActiveChallengeCard({ challenge }: { challenge: PhoneDownChallengeWithParticipants }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const isHost = challenge.hostUserId === user?.id;
  const targetSeconds = challenge.targetDurationMinutes * 60;
  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100);
  
  useEffect(() => {
    const startTime = new Date(challenge.startedAt).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [challenge.startedAt]);
  
  const copyCode = async () => {
    await navigator.clipboard.writeText(challenge.code);
    setCopied(true);
    toast({ description: "Challenge code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/phone-down-challenges/${challenge.id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-down-challenges/active/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/phone-down-challenges/history/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
      toast({
        title: "Challenge Complete!",
        description: "Great job putting your phone down! Points awarded.",
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
  
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/phone-down-challenges/${challenge.id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-down-challenges/active/me'] });
      toast({ description: "Challenge cancelled" });
    },
  });
  
  const canComplete = elapsedSeconds >= targetSeconds;
  
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <PhoneOff className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {challenge.title || "Phone Down Challenge"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4" />
                {challenge.participants?.length || 0} participants
              </CardDescription>
            </div>
          </div>
          <Badge variant={canComplete ? "default" : "secondary"} className="text-lg px-4 py-2">
            <Timer className="h-4 w-4 mr-2" />
            {formatTime(Math.max(0, targetSeconds - elapsedSeconds))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">Join Code:</span>
            <code className="font-mono font-bold text-lg">{challenge.code}</code>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyCode}
              className="h-8 w-8"
              data-testid="button-copy-code"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Goal: {challenge.targetDurationMinutes} min</span>
          </div>
        </div>
        
        {challenge.participants && challenge.participants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {challenge.participants.map((p) => (
              <Badge key={p.id} variant="outline" className="gap-1">
                {p.user?.fullName || "Unknown"}
                {p.completed && <Check className="h-3 w-3 text-green-500" />}
              </Badge>
            ))}
          </div>
        )}
        
        {isHost && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={!canComplete || completeMutation.isPending}
              className="flex-1"
              data-testid="button-complete-challenge"
            >
              <Trophy className="h-4 w-4 mr-2" />
              {canComplete ? "Complete Challenge" : "Wait for Timer"}
            </Button>
            <Button
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-challenge"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState([30]);
  const [title, setTitle] = useState("");
  const [isGroup, setIsGroup] = useState(true);
  const { toast } = useToast();
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/phone-down-challenges", {
        targetDurationMinutes: duration[0],
        title: title || null,
        isGroup,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-down-challenges/active/me'] });
      setOpen(false);
      setTitle("");
      setDuration([30]);
      toast({
        title: "Challenge Created!",
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
        <Button size="lg" className="gap-2" data-testid="button-create-challenge">
          <Plus className="h-5 w-5" />
          Start Challenge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneOff className="h-5 w-5 text-primary" />
            Start Phone Down Challenge
          </DialogTitle>
          <DialogDescription>
            Challenge yourself and friends to put your phones down and be present.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Name (optional)</Label>
            <Input
              id="title"
              placeholder="Study session, Coffee date..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-challenge-title"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Duration</Label>
              <span className="text-2xl font-bold text-primary">{duration[0]} min</span>
            </div>
            <Slider
              value={duration}
              onValueChange={setDuration}
              min={5}
              max={180}
              step={5}
              className="w-full"
              data-testid="slider-duration"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span>1 hour</span>
              <span>3 hours</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="group">Group Challenge</Label>
              <p className="text-sm text-muted-foreground">Allow friends to join</p>
            </div>
            <Switch
              id="group"
              checked={isGroup}
              onCheckedChange={setIsGroup}
              data-testid="switch-group"
            />
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Points Earned
            </h4>
            <p className="text-sm text-muted-foreground">
              Complete this challenge to earn <span className="font-bold text-primary">{Math.round(duration[0] * 2)}</span> points
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full"
          data-testid="button-confirm-create"
        >
          {createMutation.isPending ? "Creating..." : "Start Challenge"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function JoinChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/phone-down-challenges/join", { code: code.toUpperCase() });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-down-challenges/active/me'] });
      setOpen(false);
      setCode("");
      toast({
        title: "Joined Challenge!",
        description: "Put your phone down and be present!",
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
        <Button variant="outline" size="lg" className="gap-2" data-testid="button-join-challenge">
          <Users className="h-5 w-5" />
          Join Challenge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Challenge</DialogTitle>
          <DialogDescription>
            Enter the 6-character code shared by your friend
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Challenge Code</Label>
            <Input
              id="code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              data-testid="input-join-code"
            />
          </div>
        </div>
        
        <Button
          onClick={() => joinMutation.mutate()}
          disabled={code.length !== 6 || joinMutation.isPending}
          className="w-full"
          data-testid="button-confirm-join"
        >
          {joinMutation.isPending ? "Joining..." : "Join Challenge"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ChallengeHistoryCard({ challenge }: { challenge: PhoneDownChallengeWithParticipants }) {
  const statusColor = 
    challenge.status === 'completed' ? 'text-green-500' :
    challenge.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500';
  
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${challenge.status === 'completed' ? 'bg-green-500/20' : 'bg-muted'}`}>
              {challenge.status === 'completed' ? (
                <Trophy className="h-5 w-5 text-green-500" />
              ) : (
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">{challenge.title || "Phone Down Challenge"}</p>
              <p className="text-sm text-muted-foreground">
                {challenge.actualDurationMinutes || challenge.targetDurationMinutes} min • {challenge.participants?.length || 1} participants
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={statusColor}>
              {challenge.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(challenge.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PhoneDownPage() {
  const { data: activeChallenges, isLoading: loadingActive } = useQuery<PhoneDownChallengeWithParticipants[]>({
    queryKey: ['/api/phone-down-challenges/active/me'],
  });
  
  const { data: history, isLoading: loadingHistory } = useQuery<PhoneDownChallengeWithParticipants[]>({
    queryKey: ['/api/phone-down-challenges/history/me'],
  });
  
  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
  });
  
  const hasActiveChallenge = activeChallenges && activeChallenges.length > 0;
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PhoneOff className="h-8 w-8 text-primary" />
            Phone Down Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Put your phone down and be present with friends
          </p>
        </div>
        
        <Card className="bg-gradient-to-br from-primary/20 to-background border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Down Points</p>
              <p className="text-2xl font-bold" data-testid="text-phone-down-points">
                {points?.phoneDownPoints || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {!hasActiveChallenge && (
        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <PhoneOff className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Disconnect?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start a phone down challenge with friends. Earn points for staying present and build meaningful connections.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <CreateChallengeDialog />
              <JoinChallengeDialog />
            </div>
          </CardContent>
        </Card>
      )}
      
      {hasActiveChallenge && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Active Challenges
          </h2>
          {activeChallenges.map((challenge) => (
            <ActiveChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Challenge History
          </h2>
          {!hasActiveChallenge && (
            <div className="flex gap-2">
              <CreateChallengeDialog />
              <JoinChallengeDialog />
            </div>
          )}
        </div>
        
        {loadingHistory ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="grid gap-3">
            {history.map((challenge) => (
              <ChallengeHistoryCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No challenges yet. Start your first phone down challenge!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
