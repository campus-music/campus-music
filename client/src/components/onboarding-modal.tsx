import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Music, Sparkles, GraduationCap, X, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestedArtists, isLoading } = useQuery<SuggestedArtist[]>({
    queryKey: ['/api/onboarding/suggested-artists'],
    enabled: isOpen,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery<SuggestedArtist[]>({
    queryKey: [`/api/onboarding/search?q=${encodeURIComponent(debouncedQuery)}`],
    enabled: isOpen && debouncedQuery.length >= 2 && debouncedQuery.length <= 100,
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
  const isSearchActive = debouncedQuery.length >= 2;

  const sameUniversityArtists = useMemo(() => 
    suggestedArtists?.filter(a => 
      universityName && a.universityName.toLowerCase().includes(universityName.toLowerCase())
    ) || [],
    [suggestedArtists, universityName]
  );
  
  const otherArtists = useMemo(() =>
    suggestedArtists?.filter(a => 
      !universityName || !a.universityName.toLowerCase().includes(universityName.toLowerCase())
    ) || [],
    [suggestedArtists, universityName]
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-xl max-h-[85vh] p-0 gap-0 overflow-hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Welcome to Campus Music!</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Follow at least 5 artists to personalize your feed
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              disabled={skipMutation.isPending}
              className="h-8 w-8 shrink-0"
              data-testid="button-close-onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by artist name or university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
              data-testid="input-search-artists"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[40vh] border-y border-border/30">
          <div className="p-4 space-y-5">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : isSearchActive ? (
              // Search Results
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-foreground">
                    {isSearching ? 'Searching...' : `Results for "${debouncedQuery}"`}
                  </h3>
                </div>
                {isSearching ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {searchResults.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        isSelected={selectedArtists.has(artist.id)}
                        onClick={() => toggleArtist(artist.id)}
                        showUniversity
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No artists found for "{debouncedQuery}"</p>
                    <p className="text-xs mt-1">Try a different name or university</p>
                  </div>
                )}
              </div>
            ) : (
              // Default Suggested Artists
              <>
                {sameUniversityArtists.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm text-foreground">From Your Campus</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {sameUniversityArtists.length}
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
                        {otherArtists.length}
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
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 w-4 rounded-full transition-colors",
                          i < selectedArtists.size ? "bg-primary" : "bg-muted-foreground/20"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {remainingToSelect} more
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
                data-testid="button-skip-onboarding"
              >
                Skip
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
  showUniversity?: boolean;
}

function ArtistCard({ artist, isSelected, onClick, isFromUniversity, showUniversity }: ArtistCardProps) {
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
          {showUniversity ? (
            <p className="text-[10px] text-muted-foreground truncate">{artist.universityName}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground truncate">{artist.mainGenre}</p>
          )}
        </div>
      </div>
    </button>
  );
}
