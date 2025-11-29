import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Music, Heart, ListMusic, UserPlus, DollarSign } from 'lucide-react';

type ActionType = 'play' | 'like' | 'playlist' | 'follow' | 'tip';

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionType;
}

const actionConfig: Record<ActionType, { icon: typeof Music; title: string; description: string }> = {
  play: {
    icon: Music,
    title: 'Sign up to listen to full tracks',
    description: 'Create a free account to enjoy unlimited music from student artists worldwide.',
  },
  like: {
    icon: Heart,
    title: 'Sign up to save your favorites',
    description: 'Create a free account to like songs and build your personal music library.',
  },
  playlist: {
    icon: ListMusic,
    title: 'Sign up to create playlists',
    description: 'Create a free account to organize your favorite tracks into custom playlists.',
  },
  follow: {
    icon: UserPlus,
    title: 'Sign up to follow artists',
    description: 'Create a free account to follow your favorite student artists and stay updated.',
  },
  tip: {
    icon: DollarSign,
    title: 'Sign up to support artists',
    description: 'Create a free account to send tips and support student musicians directly.',
  },
};

export function AuthPromptModal({ open, onOpenChange, action }: AuthPromptModalProps) {
  const [, navigate] = useLocation();
  const config = actionConfig[action];
  const Icon = config.icon;

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E84A5F]/10">
            <Icon className="h-8 w-8 text-[#E84A5F]" />
          </div>
          <DialogTitle className="text-xl" data-testid="text-auth-prompt-title">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center" data-testid="text-auth-prompt-description">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleSignup}
            className="bg-[#E84A5F] hover:bg-[#D43D50] text-white w-full"
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
      </DialogContent>
    </Dialog>
  );
}
