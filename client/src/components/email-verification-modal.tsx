import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerified?: () => void;
}

export function EmailVerificationModal({ isOpen, email, onVerified }: EmailVerificationModalProps) {
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/verify-email', { code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: 'Email verified successfully!' });
      onVerified?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid code',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            Enter the verification code sent to {email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              data-testid="input-verification-code"
            />
          </div>

          <Button
            onClick={() => verifyMutation.mutate()}
            disabled={code.length !== 6 || verifyMutation.isPending}
            className="w-full"
            data-testid="button-verify-email"
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Verify Email'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Didn't receive a code? Check your spam folder
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
