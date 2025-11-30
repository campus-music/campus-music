import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, CreditCard, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { AuthPromptModal } from '@/components/auth-prompt-modal';

interface SupportModalProps {
  artistId: string;
  artistName: string;
  artistImageUrl?: string | null;
}

export function SupportModal({ artistId, artistName, artistImageUrl }: SupportModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [open, setOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [amount, setAmount] = useState('5');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tipStatus = params.get('tip');
    
    if (tipStatus === 'success') {
      toast({
        title: 'Thank you!',
        description: `Your support for ${artistName} has been sent successfully.`,
      });
      params.delete('tip');
      const newSearch = params.toString();
      navigate(window.location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
    } else if (tipStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your support payment was cancelled.',
        variant: 'destructive',
      });
      params.delete('tip');
      const newSearch = params.toString();
      navigate(window.location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
    }
  }, [search, artistName, toast, navigate]);

  const tipMutation = useMutation({
    mutationFn: async () => {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      const res = await apiRequest('POST', `/api/stripe/tip/${artistId}`, {
        amount: amountInCents,
        message: message || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment session',
        variant: 'destructive',
      });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      setAuthPromptOpen(true);
      return;
    }
    setOpen(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setOpen(false);
      setAuthPromptOpen(true);
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || amountValue < 1) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum tip amount is $1.00',
        variant: 'destructive',
      });
      return;
    }
    if (amountValue > 500) {
      toast({
        title: 'Invalid amount',
        description: 'Maximum tip amount is $500.00',
        variant: 'destructive',
      });
      return;
    }
    tipMutation.mutate();
  };

  const presetAmounts = [1, 5, 10, 25, 50];

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          data-testid={`button-support-${artistId}`}
        >
          <Heart className="h-4 w-4" />
          Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="modal-support">
        <DialogHeader>
          <DialogTitle>Support {artistName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === String(preset) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(String(preset))}
                  data-testid={`button-preset-${preset}`}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5.00"
                data-testid="input-support-amount"
              />
              <span className="flex items-center text-muted-foreground">USD</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Between $1.00 and $500.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let them know why you support their music..."
              className="resize-none"
              rows={3}
              maxLength={500}
              data-testid="textarea-support-message"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          <div className="bg-muted p-3 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold">${parseFloat(amount || '0').toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Secure payment via Stripe
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={tipMutation.isPending}
              className="flex-1 gap-2"
              data-testid="button-confirm-support"
            >
              {tipMutation.isPending ? (
                'Processing...'
              ) : (
                <>
                  Continue to Payment
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    
    <AuthPromptModal
      open={authPromptOpen}
      onOpenChange={setAuthPromptOpen}
      action="tip"
      artist={{
        imageUrl: artistImageUrl,
        name: artistName,
      }}
    />
    </>
  );
}
