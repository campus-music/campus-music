import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SupportModalProps {
  artistId: string;
  artistName: string;
}

export function SupportModal({ artistId, artistName }: SupportModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('5');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [message, setMessage] = useState('');

  const supportMutation = useMutation({
    mutationFn: async () => {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      const res = await apiRequest('POST', '/api/support', {
        artistId,
        amount: amountInCents,
        paymentMethod,
        message: message || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artist', artistId, 'supports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artist', artistId, 'wallet'] });
      toast({
        title: 'Success!',
        description: `You supported ${artistName} with $${amount}. Thank you!`,
      });
      setOpen(false);
      setAmount('5');
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send support',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    supportMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.50"
                max="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5.00"
                data-testid="input-support-amount"
              />
              <span className="flex items-center text-muted-foreground">USD</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Between $0.50 and $5,000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe (Card)</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
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
              data-testid="textarea-support-message"
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="text-muted-foreground">
              You will send <strong className="text-foreground">${parseFloat(amount || '0').toFixed(2)}</strong> to {artistName}
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
              disabled={supportMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-support"
            >
              {supportMutation.isPending ? 'Processing...' : 'Send Support'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
