import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Music, Users, Sparkles, GraduationCap } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface SuggestedArtist {
  id: string;
  stageName: string;
  profileImageUrl: string | null;
  mainGenre: string;
  universityName: string;
  trackCount: number;
  streams: number;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  universityName?: string;
}

export function OnboardingModal({ isOpen, onComplete, universityName }: OnboardingModalProps) {
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());

  const { data: suggestedArtists, isLoading } = useQuery<SuggestedArtist[]>({
    queryKey: ['/api/onboarding/suggested-artists'],
    enabled: isOpen,
  });

  const followMutation = useMutation({
    mutationFn: async (artistIds: string[]) => {
      return apiRequest('POST', '/api/onboarding/follow-artists', { artistIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/from-following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onComplete();
    },
  });

  const toggleArtist = (artistId: string) => {
    setSelectedArtists(prev => {
      const next = new Set(prev);
      if (next.has(artistId)) {
        next.delete(artistId);
      } else {
        next.add(artistId);
      }
      return next;
    });
  };

  const handleComplete = () => {
    if (selectedArtists.size >= 5) {
      followMutation.mutate(Array.from(selectedArtists));
    }
  };

  const remainingToSelect = Math.max(0, 5 - selectedArtists.size);

  const sameUniversityArtists = suggestedArtists?.filter(a => 
    universityName && a.universityName.toLowerCase().includes(universityName.toLowerCase())
  ) || [];
  
  const otherArtists = suggestedArtists?.filter(a => 
    !universityName || !a.universityName.toLowerCase().includes(universityName.toLowerCase())
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] p-0 gap-0" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Campus Music!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Follow at least 5 artists to personalize your music feed. 
            {universityName && (
              <span className="text-primary"> We've highlighted artists from {universityName}!</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {sameUniversityArtists.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">From Your University</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sameUniversityArtists.map((artist) => (
                        <ArtistCard
                          key={artist.id}
                          artist={artist}
                          isSelected={selectedArtists.has(artist.id)}
                          onClick={() => toggleArtist(artist.id)}
                          isFromUniversity
                        />
                      ))}
                    </div>
                  </div>
                )}

                {otherArtists.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">Popular Artists</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {otherArtists.map((artist) => (
                        <ArtistCard
                          key={artist.id}
                          artist={artist}
                          isSelected={selectedArtists.has(artist.id)}
                          onClick={() => toggleArtist(artist.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(!suggestedArtists || suggestedArtists.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No artists available yet. Check back soon!</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={onComplete}
                    >
                      Continue to Home
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/50 bg-card/50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {remainingToSelect > 0 ? (
                <span className="text-muted-foreground">
                  Select <span className="font-semibold text-primary">{remainingToSelect}</span> more artist{remainingToSelect !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-primary font-medium flex items-center gap-1">
                  <Check className="h-4 w-4" /> Ready to go!
                </span>
              )}
            </div>
            <Button 
              onClick={handleComplete}
              disabled={selectedArtists.size < 5 || followMutation.isPending}
              className="min-w-32"
              data-testid="button-complete-onboarding"
            >
              {followMutation.isPending ? 'Following...' : `Follow ${selectedArtists.size} Artists`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ArtistCardProps {
  artist: SuggestedArtist;
  isSelected: boolean;
  onClick: () => void;
  isFromUniversity?: boolean;
}

function ArtistCard({ artist, isSelected, onClick, isFromUniversity }: ArtistCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all text-left",
        "hover-elevate active-elevate-2",
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-border/50 bg-card hover:border-border"
      )}
      data-testid={`card-artist-${artist.id}`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center gap-2">
        <Avatar className="h-14 w-14">
          <AvatarImage src={artist.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-lg">
            {artist.stageName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1 min-w-0 w-full">
          <p className="font-medium text-sm truncate">{artist.stageName}</p>
          <Badge variant="secondary" className="text-xs truncate max-w-full">
            {artist.mainGenre}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{artist.trackCount} tracks</span>
          {isFromUniversity && (
            <Badge variant="outline" className="text-xs px-1 py-0 border-primary/50 text-primary">
              <GraduationCap className="h-3 w-3 mr-0.5" />
              Same campus
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
