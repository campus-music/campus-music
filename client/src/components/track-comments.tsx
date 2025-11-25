import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { TrackComment } from '@shared/schema';

interface TrackCommentsProps {
  trackId: string;
}

export function TrackComments({ trackId }: TrackCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');

  const { data: comments, isLoading } = useQuery<TrackComment[]>({
    queryKey: ['/api/tracks', trackId, 'comments'],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', `/api/tracks/${trackId}/comments`, { content: text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks', trackId, 'comments'] });
      setContent('');
      toast({ title: 'Comment added!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest('DELETE', `/api/comments/${commentId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks', trackId, 'comments'] });
      toast({ title: 'Comment deleted' });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">Comments ({comments?.length || 0})</h3>
      </div>

      {user && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none"
            data-testid="textarea-comment"
          />
          <Button
            onClick={() => addCommentMutation.mutate(content)}
            disabled={!content.trim() || addCommentMutation.isPending}
            size="sm"
            data-testid="button-add-comment"
          >
            {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
              {user?.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  data-testid={`button-delete-comment-${comment.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
