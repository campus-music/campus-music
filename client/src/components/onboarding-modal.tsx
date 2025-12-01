import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Music, Sparkles, GraduationCap, X } from 'lucide-react';
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

  const skipMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/onboarding/complete', {});
    },
    onSuccess: () => {
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

  const handleSkip = () => {
    skipMutation.mutate();
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
        className="sm:max-w-xl max-h-[85vh] p-0 gap-0 overflow-hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Skip button in top right */}
        <button
          onClick={handleSkip}
          disabled={skipMutation.isPending}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted/80 transition-colors z-10"
          data-testid="button-skip-onboarding"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Welcome to Campus Music!</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Follow at least 5 artists to personalize your feed
            {universityName && (
              <span className="text-primary font-medium"> — artists from {universityName} are highlighted!</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[45vh] border-y border-border/30">
          <div className="p-4 space-y-5">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {sameUniversityArtists.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm text-foreground">From Your Campus</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {sameUniversityArtists.length} artists
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-foreground">Popular Artists</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {otherArtists.length} artists
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                    <Music className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No artists available yet</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      size="sm"
                      onClick={handleSkip}
                    >
                      Continue to Home
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {remainingToSelect > 0 ? (
                <>
                  <div className="flex -space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-2 w-2 rounded-full border border-background",
                          i < selectedArtists.size ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {remainingToSelect} more needed
                  </span>
                </>
              ) : (
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Ready!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={skipMutation.isPending}
                className="text-muted-foreground text-xs"
                data-testid="button-skip-onboarding-text"
              >
                Skip for now
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={selectedArtists.size < 5 || followMutation.isPending}
                size="sm"
                data-testid="button-complete-onboarding"
              >
                {followMutation.isPending ? 'Following...' : `Follow ${selectedArtists.size}`}
              </Button>
            </div>
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
        "relative p-2.5 rounded-lg border transition-all text-center group",
        isSelected 
          ? "border-primary bg-primary/10 ring-1 ring-primary/30" 
          : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
      )}
      data-testid={`card-artist-${artist.id}`}
    >
      {isSelected && (
        <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-primary shadow-sm">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            <AvatarImage src={artist.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-xs font-medium">
              {artist.stageName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isFromUniversity && (
            <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-primary">
              <GraduationCap className="h-2 w-2 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <div className="min-w-0 w-full space-y-0.5">
          <p className="font-medium text-xs truncate leading-tight">{artist.stageName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{artist.mainGenre}</p>
        </div>
      </div>
    </button>
  );
}
