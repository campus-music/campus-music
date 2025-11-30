import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Music, Heart, ListMusic, UserPlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type ActionType = 'play' | 'like' | 'playlist' | 'follow' | 'tip';

interface TrackInfo {
  coverImageUrl?: string | null;
  title?: string;
  artistName?: string;
}

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionType;
  track?: TrackInfo;
}

const actionConfig: Record<ActionType, { icon: typeof Music; title: string; description: string }> = {
  play: {
    icon: Music,
    title: 'Keep the music playing',
    description: 'Sign up free to unlock full tracks from student artists worldwide.',
  },
  like: {
    icon: Heart,
    title: 'Save your favorites',
    description: 'Sign up free to like songs and build your personal music library.',
  },
  playlist: {
    icon: ListMusic,
    title: 'Create your playlists',
    description: 'Sign up free to organize your favorite tracks into custom playlists.',
  },
  follow: {
    icon: UserPlus,
    title: 'Follow this artist',
    description: 'Sign up free to follow your favorite student artists and stay updated.',
  },
  tip: {
    icon: DollarSign,
    title: 'Support this artist',
    description: 'Sign up free to send tips and support student musicians directly.',
  },
};

export function AuthPromptModal({ open, onOpenChange, action, track }: AuthPromptModalProps) {
  const [, navigate] = useLocation();
  const config = actionConfig[action];
  const Icon = config.icon;
  const hasCoverArt = track?.coverImageUrl;

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/signup');
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg p-0 overflow-hidden border-0",
          hasCoverArt ? "bg-transparent" : "bg-card",
          "[&>button]:text-white [&>button]:opacity-100 [&>button]:z-50"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </VisuallyHidden>
        
        {hasCoverArt ? (
          <div className="relative">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${track.coverImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-[#E84A5F]/30 backdrop-blur-xl" />
            
            <div className="relative z-10 p-8 pt-12">
              <div className="flex gap-6 items-start">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-[#E84A5F]/30 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src={track.coverImageUrl || undefined}
                    alt={track.title || 'Track cover'}
                    className="relative w-32 h-32 rounded-lg object-cover shadow-2xl ring-1 ring-white/10"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-[#E84A5F] rounded-full p-2 shadow-lg">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 pt-2">
                  <h2 className="text-2xl font-bold text-white mb-1" data-testid="text-auth-prompt-title">
                    {config.title}
                  </h2>
                  {track.title && (
                    <p className="text-white/60 text-sm mb-3">
                      {track.artistName ? `${track.title} • ${track.artistName}` : track.title}
                    </p>
                  )}
                  <p className="text-white/80 text-sm leading-relaxed" data-testid="text-auth-prompt-description">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-8">
                <Button
                  onClick={handleSignup}
                  className="bg-[#E84A5F] hover:bg-[#D43D50] text-white w-full h-12 text-base font-semibold shadow-lg shadow-[#E84A5F]/25"
                  data-testid="button-auth-prompt-signup"
                >
                  Sign Up Free
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="w-full text-white/80 hover:text-white hover:bg-white/10"
                  data-testid="button-auth-prompt-login"
                >
                  Already have an account? <span className="underline ml-1">Log In</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E84A5F]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E84A5F]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E84A5F] to-[#E84A5F]/70 shadow-lg shadow-[#E84A5F]/25">
                <Icon className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2" data-testid="text-auth-prompt-title">
                {config.title}
              </h2>
              <p className="text-muted-foreground mb-6" data-testid="text-auth-prompt-description">
                {config.description}
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSignup}
                  className="bg-[#E84A5F] hover:bg-[#D43D50] text-white w-full h-12 text-base font-semibold shadow-lg shadow-[#E84A5F]/25"
                  data-testid="button-auth-prompt-signup"
                >
                  Sign Up Free
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  className="w-full"
                  data-testid="button-auth-prompt-login"
                >
                  Already have an account? Log In
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
