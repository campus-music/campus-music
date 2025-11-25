import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  trackId?: string;
  playlistId?: string;
  className?: string;
}

export function ShareButton({ trackId, playlistId, className }: ShareButtonProps) {
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (trackId) {
        const res = await apiRequest('POST', `/api/tracks/${trackId}/share`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      const shareUrl = trackId
        ? `${window.location.origin}?track=${trackId}`
        : `${window.location.origin}?playlist=${playlistId}`;

      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: 'Shared!',
          description: 'Link copied to clipboard',
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => shareMutation.mutate()}
      disabled={shareMutation.isPending}
      className={className}
      data-testid={`button-share-${trackId || playlistId}`}
    >
      <Share2 className="h-4 w-4 mr-2" />
      {shareMutation.isPending ? 'Sharing...' : 'Share'}
    </Button>
  );
}
