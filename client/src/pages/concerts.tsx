import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { LiveConcertWithDetails, ArtistProfile, UserPoints } from "@shared/schema";
import { 
  Music2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Plus,
  Star,
  Check,
  Heart,
  Ticket,
  Building,
  DollarSign,
  QrCode,
  Sparkles,
  Radio,
  PartyPopper
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture, isToday } from "date-fns";

function ConcertCard({ concert, featured = false }: { concert: LiveConcertWithDetails; featured?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isUpcoming = isFuture(new Date(concert.startTime));
  const isHappeningNow = !isUpcoming && (!concert.endTime || isFuture(new Date(concert.endTime)));
  const isPastEvent = isPast(new Date(concert.endTime || concert.startTime)) && !isHappeningNow;
  const isEventToday = isToday(new Date(concert.startTime));
  
  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'interested') => {
      const res = await apiRequest("POST", `/api/concerts/${concert.id}/rsvp`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/concerts/my-university'] });
      toast({ description: "RSVP updated!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  const cancelRsvpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/concerts/${concert.id}/rsvp`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/concerts/my-university'] });
      toast({ description: "RSVP cancelled" });
    },
  });
  
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/concerts/${concert.id}/check-in`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
      toast({
        title: "Checked In!",
        description: "Enjoy the show! +50 points awarded.",
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
    <Card className={`hover-elevate overflow-hidden ${featured ? 'border-primary/30' : ''} ${isHappeningNow ? 'border-green-500/50 ring-1 ring-green-500/20' : ''}`}>
      {isHappeningNow && (
        <div className="h-1.5 bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse" />
      )}
      {!isHappeningNow && (
        <div className="h-1.5 bg-gradient-to-r from-primary/80 to-primary/30" />
      )}
      
      <CardContent className="p-5 space-y-4">
        {/* Header with Artist */}
        <div className="flex items-start gap-4">
          <Avatar className={`h-14 w-14 ring-2 ${isHappeningNow ? 'ring-green-500/50' : 'ring-primary/20'}`}>
            <AvatarImage src={concert.artist?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {concert.artist?.stageName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold truncate">{concert.title}</h3>
              {isHappeningNow && (
                <Badge variant="default" className="bg-green-500 gap-1 animate-pulse">
                  <Radio className="h-3 w-3" />
                  LIVE NOW
                </Badge>
              )}
              {isEventToday && !isHappeningNow && isUpcoming && (
                <Badge variant="default" className="bg-yellow-500 gap-1">
                  <Clock className="h-3 w-3" />
                  TODAY
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="secondary">Past Event</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{concert.artist?.stageName}</p>
          </div>
          {(concert.ticketPrice ?? 0) > 0 ? (
            <Badge variant="outline" className="gap-1 shrink-0 border-yellow-500/30 text-yellow-500">
              <DollarSign className="h-3 w-3" />
              {concert.ticketPrice}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 shrink-0 border-green-500/30 text-green-500">
              FREE
            </Badge>
          )}
        </div>
        
        {/* Event Details Grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="p-1.5 rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">
              {format(new Date(concert.startTime), 'EEE, MMM d')}
              <span className="text-foreground font-medium"> at {format(new Date(concert.startTime), 'h:mm a')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <div className="p-1.5 rounded-lg bg-muted">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground truncate">{concert.venue}</span>
          </div>
          {concert.universityName && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="p-1.5 rounded-lg bg-muted">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground truncate">{concert.universityName}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm">
            <div className="p-1.5 rounded-lg bg-muted">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{concert.rsvpCount || 0}</span> attending
              {concert.capacity && (
                <span className="text-border"> / {concert.capacity} spots</span>
              )}
            </span>
          </div>
        </div>
        
        {/* Description */}
        {concert.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 rounded-lg p-3">
            {concert.description}
          </p>
        )}
        
        {/* RSVP Buttons */}
        {user && isUpcoming && !isHappeningNow && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {concert.userRsvpStatus === 'going' ? (
              <>
                <Badge variant="default" className="gap-1.5 py-1.5 px-3 bg-green-500">
                  <Check className="h-3.5 w-3.5" />
                  You're Going!
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelRsvpMutation.mutate()}
                  disabled={cancelRsvpMutation.isPending}
                  className="text-muted-foreground"
                >
                  Cancel RSVP
                </Button>
              </>
            ) : concert.userRsvpStatus === 'interested' ? (
              <>
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Heart className="h-3.5 w-3.5 text-pink-500" />
                  Interested
                </Badge>
                <Button
                  size="sm"
                  onClick={() => rsvpMutation.mutate('going')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-going-${concert.id}`}
                >
                  <Ticket className="h-4 w-4 mr-1.5" />
                  I'm Going
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelRsvpMutation.mutate()}
                  disabled={cancelRsvpMutation.isPending}
                  className="text-muted-foreground"
                >
                  Remove
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => rsvpMutation.mutate('going')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-going-${concert.id}`}
                >
                  <Ticket className="h-4 w-4 mr-1.5" />
                  I'm Going
                </Button>
                <Button
                  variant="outline"
                  onClick={() => rsvpMutation.mutate('interested')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-interested-${concert.id}`}
                >
                  <Heart className="h-4 w-4 mr-1.5" />
                  Interested
                </Button>
              </>
            )}
          </div>
        )}
        
        {/* Check-in Button */}
        {user && isHappeningNow && concert.userRsvpStatus === 'going' && !concert.userCheckedIn && (
          <Button
            size="lg"
            className="w-full bg-green-500 hover:bg-green-600 gap-2"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            data-testid={`button-check-in-${concert.id}`}
          >
            <QrCode className="h-5 w-5" />
            Check In & Earn 50 Points
          </Button>
        )}
        
        {/* Checked In Badge */}
        {concert.userCheckedIn && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="p-1.5 rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-green-500">You're Checked In!</span>
            <PartyPopper className="h-5 w-5 text-yellow-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateConcertDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const { toast } = useToast();
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/concerts", {
        title,
        description: description || null,
        venue,
        address: address || null,
        startTime,
        endTime: endTime || null,
        capacity: capacity ? parseInt(capacity) : null,
        ticketPrice: ticketPrice ? parseFloat(ticketPrice) : 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/concerts/my-university'] });
      setOpen(false);
      resetForm();
      toast({
        title: "Concert Created!",
        description: "Your event is now visible to students",
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
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVenue("");
    setAddress("");
    setStartTime("");
    setEndTime("");
    setCapacity("");
    setTicketPrice("");
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-concert">
          <Plus className="h-5 w-5" />
          Create Concert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/20">
              <Music2 className="h-5 w-5 text-primary" />
            </div>
            Create a Concert
          </DialogTitle>
          <DialogDescription>
            Promote your campus performance and connect with fans
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="concert-title">Event Title</Label>
            <Input
              id="concert-title"
              placeholder="My Album Release Party"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              data-testid="input-concert-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              placeholder="Student Center Ballroom"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="h-11"
              data-testid="input-concert-venue"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="address"
              placeholder="123 Campus Drive"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
              data-testid="input-concert-address"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11"
                data-testid="input-concert-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">
                End Time <span className="text-muted-foreground text-xs">(opt.)</span>
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11"
                data-testid="input-concert-end"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-muted-foreground text-xs">(opt.)</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                placeholder="100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="h-11"
                data-testid="input-concert-capacity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-price">Ticket Price ($)</Label>
              <Input
                id="ticket-price"
                type="number"
                step="0.01"
                placeholder="0 = free"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="h-11"
                data-testid="input-concert-price"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Tell people what to expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-concert-description"
            />
          </div>
        </div>
        
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!title.trim() || !venue.trim() || !startTime || createMutation.isPending}
          size="lg"
          className="w-full"
          data-testid="button-confirm-create-concert"
        >
          {createMutation.isPending ? "Creating..." : "Create Concert"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function ConcertsPage() {
  const { user } = useAuth();
  
  const { data: myConcerts, isLoading: loadingMy } = useQuery<LiveConcertWithDetails[]>({
    queryKey: ['/api/concerts/my-university'],
    enabled: !!user,
  });
  
  const { data: allConcerts, isLoading: loadingAll } = useQuery<LiveConcertWithDetails[]>({
    queryKey: ['/api/concerts'],
  });
  
  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user && user.role === 'artist',
  });
  
  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
  });
  
  const isArtist = user?.role === 'artist' && artistProfile;
  
  const universityConcerts = myConcerts?.filter(c => isFuture(new Date(c.startTime))) || [];
  const upcomingConcerts = allConcerts?.filter(c => isFuture(new Date(c.startTime))) || [];
  const liveConcerts = allConcerts?.filter(c => {
    const now = new Date();
    const start = new Date(c.startTime);
    const end = c.endTime ? new Date(c.endTime) : null;
    return start <= now && (!end || end > now);
  }) || [];
  
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-background p-8 border border-purple-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Music2 className="h-8 w-8 text-purple-500" />
              </div>
              Campus Concerts
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-md">
              Discover live music events on campus. RSVP, attend, and earn points for checking in!
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Card className="border-purple-500/30 bg-background/80 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-concert-points">
                    {points?.concertPoints || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Concert Points</p>
                </div>
              </CardContent>
            </Card>
            
            {isArtist && <CreateConcertDialog />}
          </div>
        </div>
      </div>
      
      {/* Live Now Section */}
      {liveConcerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-500 animate-pulse" />
            Happening Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {liveConcerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} featured />
            ))}
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs defaultValue={user ? "my-university" : "all"} className="space-y-6">
        <TabsList className="bg-muted/50">
          {user && <TabsTrigger value="my-university">My University</TabsTrigger>}
          <TabsTrigger value="all">All Concerts</TabsTrigger>
        </TabsList>
        
        {user && (
          <TabsContent value="my-university" className="space-y-4">
            {user?.universityName && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Building className="h-3.5 w-3.5" />
                {user.universityName}
              </Badge>
            )}
            
            {loadingMy ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-1.5 bg-muted" />
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-muted rounded w-2/3" />
                          <div className="h-4 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-24 bg-muted rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : universityConcerts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {universityConcerts.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Music2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Concerts</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {user?.universityName 
                      ? `No concerts scheduled at ${user.universityName} yet. Be the first to create one!`
                      : "Set your university in your profile to see local events."}
                  </p>
                  {isArtist && <CreateConcertDialog />}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="all" className="space-y-4">
          {loadingAll ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-1.5 bg-muted" />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-2/3" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-24 bg-muted rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingConcerts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingConcerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Music2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Upcoming Concerts</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to create a campus concert event!
                </p>
                {isArtist && <CreateConcertDialog />}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
