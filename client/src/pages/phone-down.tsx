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
import { Progress } from "@/components/ui/progress";
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
  Timer,
  Brain,
  Heart,
  Sparkles,
  Target,
  Flame
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

function CircularProgress({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <PhoneOff className="h-8 w-8 text-primary" />
      </div>
    </div>
  );
}

function ActiveChallengeCard({ challenge }: { challenge: PhoneDownChallengeWithParticipants }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const isHost = challenge.hostUserId === user?.id;
  const targetSeconds = challenge.targetDurationMinutes * 60;
  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100);
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  
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
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="absolute top-0 left-0 right-0 h-1">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/50 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <CircularProgress progress={progress} size={140} strokeWidth={10} />
            {canComplete && (
              <div className="absolute -top-1 -right-1">
                <div className="p-1.5 rounded-full bg-green-500 animate-pulse">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                {challenge.title || "Phone Down Challenge"}
                {challenge.isGroup && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Group
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground mt-1">
                {canComplete ? "You did it! Claim your reward." : "Stay focused, you're doing great!"}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-mono text-xl font-bold">{formatTime(remainingSeconds)}</span>
                <span className="text-sm text-muted-foreground">remaining</span>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <span className="text-sm text-muted-foreground">Code:</span>
                <code className="font-mono font-bold text-primary">{challenge.code}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={copyCode}
                  className="h-6 w-6"
                  data-testid="button-copy-code"
                >
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {challenge.participants && challenge.participants.length > 1 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                <span className="text-sm text-muted-foreground">With:</span>
                {challenge.participants.filter(p => p.userId !== user?.id).map((p) => (
                  <Badge key={p.id} variant="outline" className="gap-1">
                    {p.user?.fullName || "Friend"}
                    {p.completed && <Check className="h-3 w-3 text-green-500" />}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {isHost && (
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={!canComplete || completeMutation.isPending}
                size="lg"
                className={canComplete ? "bg-green-500 hover:bg-green-600" : ""}
                data-testid="button-complete-challenge"
              >
                <Trophy className="h-4 w-4 mr-2" />
                {canComplete ? "Claim Reward" : "In Progress"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="text-muted-foreground"
                data-testid="button-cancel-challenge"
              >
                Cancel Challenge
              </Button>
            </div>
          )}
        </div>
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
  
  const presetDurations = [15, 30, 60, 120];
  
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
        title: "Challenge Started!",
        description: "Put your phone down and be present.",
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
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-challenge">
          <Plus className="h-5 w-5" />
          Start Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/20">
              <PhoneOff className="h-5 w-5 text-primary" />
            </div>
            Start a Challenge
          </DialogTitle>
          <DialogDescription>
            Challenge yourself to disconnect and be present
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Name (optional)</Label>
            <Input
              id="title"
              placeholder="Study session, Coffee with friends..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              data-testid="input-challenge-title"
            />
          </div>
          
          <div className="space-y-4">
            <Label>Duration</Label>
            <div className="grid grid-cols-4 gap-2">
              {presetDurations.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={duration[0] === d ? "default" : "outline"}
                  onClick={() => setDuration([d])}
                  className="h-12"
                >
                  {d < 60 ? `${d}m` : `${d / 60}h`}
                </Button>
              ))}
            </div>
            <div className="pt-2">
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={5}
                max={180}
                step={5}
                className="w-full"
                data-testid="slider-duration"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>5 min</span>
                <span className="text-primary font-bold text-lg">{duration[0]} min</span>
                <span>3 hours</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="group" className="text-base cursor-pointer">Group Challenge</Label>
                <p className="text-sm text-muted-foreground">Friends can join with your code</p>
              </div>
            </div>
            <Switch
              id="group"
              checked={isGroup}
              onCheckedChange={setIsGroup}
              data-testid="switch-group"
            />
          </div>
          
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Earn {Math.round(duration[0] * 2)} points</p>
                <p className="text-sm text-muted-foreground">Complete this challenge to level up</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          size="lg"
          className="w-full"
          data-testid="button-confirm-create"
        >
          {createMutation.isPending ? "Starting..." : "Start Challenge"}
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
          Join with Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Join a Challenge</DialogTitle>
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
            data-testid="input-join-code"
          />
        </div>
        
        <Button
          onClick={() => joinMutation.mutate()}
          disabled={code.length !== 6 || joinMutation.isPending}
          size="lg"
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
  const isCompleted = challenge.status === 'completed';
  
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${isCompleted ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/20'} hover-elevate`}>
      <div className={`p-2.5 rounded-full ${isCompleted ? 'bg-green-500/20' : 'bg-muted'}`}>
        {isCompleted ? (
          <Trophy className="h-5 w-5 text-green-500" />
        ) : (
          <Smartphone className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{challenge.title || "Phone Down Challenge"}</p>
        <p className="text-sm text-muted-foreground">
          {challenge.actualDurationMinutes || challenge.targetDurationMinutes} min
          {challenge.participants && challenge.participants.length > 1 && 
            ` • ${challenge.participants.length} people`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500" : ""}>
          {isCompleted ? `+${(challenge.actualDurationMinutes || challenge.targetDurationMinutes) * 2} pts` : challenge.status}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(challenge.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
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
  const completedCount = history?.filter(c => c.status === 'completed').length || 0;
  
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <PhoneOff className="h-8 w-8 text-primary" />
              </div>
              Phone Down
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-md">
              The music app that helps you disconnect. Put your phone down and earn rewards for being present.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Card className="border-primary/30 bg-background/80 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-yellow-500/20">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-phone-down-points">
                    {points?.phoneDownPoints || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-500/30 bg-background/80 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-green-500/20">
                  <Flame className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Active Challenge */}
      {hasActiveChallenge && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Active Challenge
          </h2>
          {activeChallenges.map((challenge) => (
            <ActiveChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
      
      {/* CTA Section */}
      {!hasActiveChallenge && (
        <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative p-8 md:p-12 text-center space-y-6">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <PhoneOff className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to Disconnect?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                Start a challenge to put your phone down and be present with the people around you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <CreateChallengeDialog />
              <JoinChallengeDialog />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Benefits */}
      {!hasActiveChallenge && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Why Put Your Phone Down?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover-elevate bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 shrink-0">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Focus Better</h4>
                  <p className="text-sm text-muted-foreground">Improve concentration and reduce digital distractions</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-pink-500/20 shrink-0">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Connect More</h4>
                  <p className="text-sm text-muted-foreground">Be present with friends and build real relationships</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/20 shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Earn Rewards</h4>
                  <p className="text-sm text-muted-foreground">Collect points and unlock exclusive badges</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Challenge History
          </h2>
          {hasActiveChallenge && (
            <div className="flex gap-2">
              <CreateChallengeDialog />
              <JoinChallengeDialog />
            </div>
          )}
        </div>
        
        {loadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-2">
            {history.map((challenge) => (
              <ChallengeHistoryCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
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
