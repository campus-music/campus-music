import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

interface FollowButtonProps {
  artistId: string;
  className?: string;
}

export function FollowButton({ artistId, className }: FollowButtonProps) {
  const { toast } = useToast();

  const { data: isFollowing } = useQuery<boolean>({
    queryKey: ['/api/user/following', artistId],
    queryFn: async () => {
      const res = await fetch(`/api/user/following`, { credentials: 'include' });
      if (!res.ok) return false;
      const following = await res.json();
      return following.some((user: any) => user.id === artistId);
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const res = await apiRequest('DELETE', `/api/artists/${artistId}/follow`);
        return res.json();
      } else {
        const res = await apiRequest('POST', `/api/artists/${artistId}/follow`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/following'] });
      toast({
        title: isFollowing ? 'Unfollowed artist' : 'Following artist!',
        description: isFollowing ? 'Removed from your following list' : 'Added to your following list',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button
      variant={isFollowing ? 'default' : 'outline'}
      size="sm"
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
      className={className}
      data-testid={`button-follow-${artistId}`}
    >
      <Users className="h-4 w-4 mr-2" />
      {followMutation.isPending ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
