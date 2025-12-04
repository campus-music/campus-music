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
  QrCode
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";

function ConcertCard({ concert, onRsvp }: { concert: LiveConcertWithDetails; onRsvp?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isUpcoming = isFuture(new Date(concert.startTime));
  const isHappeningNow = !isUpcoming && (!concert.endTime || isFuture(new Date(concert.endTime)));
  
  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'interested') => {
      const res = await apiRequest("POST", `/api/concerts/${concert.id}/rsvp`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/concerts/my-university'] });
      toast({ description: "RSVP updated!" });
      onRsvp?.();
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
        description: "Enjoy the show! Points awarded.",
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
    <Card className="hover-elevate overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src={concert.artist?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {concert.artist?.stageName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold truncate">{concert.title}</h3>
              {isHappeningNow && (
                <Badge variant="default" className="bg-green-500 animate-pulse">LIVE NOW</Badge>
              )}
              {isPast(new Date(concert.endTime || concert.startTime)) && !isHappeningNow && (
                <Badge variant="secondary">Past</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{concert.artist?.stageName}</p>
          </div>
          {(concert.ticketPrice ?? 0) > 0 && (
            <Badge variant="outline" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {concert.ticketPrice}
            </Badge>
          )}
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{format(new Date(concert.startTime), 'EEE, MMM d • h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{concert.venue}</span>
          </div>
          {concert.universityName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{concert.universityName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>
              {concert.rsvpCount || 0} attending
              {concert.capacity && ` / ${concert.capacity} spots`}
            </span>
          </div>
        </div>
        
        {concert.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{concert.description}</p>
        )}
        
        {user && isUpcoming && (
          <div className="flex flex-wrap gap-2 pt-2">
            {concert.userRsvpStatus === 'going' ? (
              <>
                <Badge variant="default" className="gap-1 bg-green-500">
                  <Check className="h-3 w-3" />
                  Going
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelRsvpMutation.mutate()}
                  disabled={cancelRsvpMutation.isPending}
                >
                  Cancel RSVP
                </Button>
              </>
            ) : concert.userRsvpStatus === 'interested' ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Heart className="h-3 w-3" />
                  Interested
                </Badge>
                <Button
                  size="sm"
                  onClick={() => rsvpMutation.mutate('going')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-going-${concert.id}`}
                >
                  I'm Going
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelRsvpMutation.mutate()}
                  disabled={cancelRsvpMutation.isPending}
                >
                  Remove
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => rsvpMutation.mutate('going')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-going-${concert.id}`}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  I'm Going
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rsvpMutation.mutate('interested')}
                  disabled={rsvpMutation.isPending}
                  data-testid={`button-rsvp-interested-${concert.id}`}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Interested
                </Button>
              </>
            )}
          </div>
        )}
        
        {user && isHappeningNow && concert.userRsvpStatus === 'going' && !concert.userCheckedIn && (
          <Button
            className="w-full"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            data-testid={`button-check-in-${concert.id}`}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Check In & Earn Points
          </Button>
        )}
        
        {concert.userCheckedIn && (
          <Badge variant="default" className="w-full justify-center gap-2 py-2 bg-green-500">
            <Check className="h-4 w-4" />
            Checked In!
          </Badge>
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
        <Button size="lg" className="gap-2" data-testid="button-create-concert">
          <Plus className="h-5 w-5" />
          Create Concert
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" />
            Create a Live Concert
          </DialogTitle>
          <DialogDescription>
            Promote your campus performance and connect with fans
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="concert-title">Event Title</Label>
            <Input
              id="concert-title"
              placeholder="My Album Release Party"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              data-testid="input-concert-venue"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              placeholder="123 Campus Drive"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                data-testid="input-concert-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time (optional)</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                data-testid="input-concert-end"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                data-testid="input-concert-capacity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-price">Ticket Price ($)</Label>
              <Input
                id="ticket-price"
                type="number"
                step="0.01"
                placeholder="0 (free)"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                data-testid="input-concert-price"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
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
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Music2 className="h-8 w-8 text-primary" />
            Live Concerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and attend live music events on campus
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Card className="bg-gradient-to-br from-purple-500/20 to-background border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concert Points</p>
                <p className="text-2xl font-bold" data-testid="text-concert-points">
                  {points?.concertPoints || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {isArtist && <CreateConcertDialog />}
        </div>
      </div>
      
      <Tabs defaultValue="my-university" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-university">My University</TabsTrigger>
          <TabsTrigger value="all">All Concerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-university" className="space-y-4">
          {user?.universityName && (
            <Badge variant="secondary" className="gap-1">
              <Building className="h-3 w-3" />
              {user.universityName}
            </Badge>
          )}
          
          {loadingMy ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-20 bg-muted rounded" />
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
            <Card>
              <CardContent className="p-8 text-center">
                <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Concerts</h3>
                <p className="text-muted-foreground mb-4">
                  {user?.universityName 
                    ? `No concerts scheduled at ${user.universityName} yet.`
                    : "Check out all concerts or set your university in your profile."}
                </p>
                {isArtist && (
                  <CreateConcertDialog />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {loadingAll ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-20 bg-muted rounded" />
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
            <Card>
              <CardContent className="p-8 text-center">
                <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Concerts</h3>
                <p className="text-muted-foreground">
                  Be the first to create a campus concert event!
                </p>
                {isArtist && (
                  <div className="mt-4">
                    <CreateConcertDialog />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
