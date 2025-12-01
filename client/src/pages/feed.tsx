import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Share2, Music, Trash2, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ArtistPostWithDetails, TrackWithArtist, User, PostCommentWithUser, ArtistProfile } from '@shared/schema';
import { Link } from 'wouter';

export default function Feed() {
  const { user } = useAuth();
  
  const { data: artistProfile } = useQuery<ArtistProfile | null>({
    queryKey: ['/api/artist/profile'],
    queryFn: async () => {
      const response = await fetch('/api/artist/profile');
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return response.json();
    },
    enabled: user?.role === 'artist',
  });
  
  const isArtist = user?.role === 'artist' && !!artistProfile;
  
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const { data: posts, isLoading } = useQuery<ArtistPostWithDetails[]>({
    queryKey: ['/api/feed', offset, limit],
    queryFn: async () => {
      const response = await fetch(`/api/feed?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
  });

  return (
    <div className="max-w-2xl mx-auto pb-32 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Music className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Artist Feed</h1>
      </div>

      {isArtist && <PostComposer artistProfile={artistProfile} />}

      {isLoading ? (
        <FeedSkeleton />
      ) : posts && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id} />
          ))}
        </div>
      ) : (
        <EmptyFeed isArtist={isArtist} />
      )}
    </div>
  );
}

function PostComposer({ artistProfile }: { artistProfile: ArtistProfile }) {
  const [caption, setCaption] = useState('');
  const [trackId, setTrackId] = useState<string | undefined>(undefined);
  const [mediaUrl, setMediaUrl] = useState('');
  
  const { data: myTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/artists', artistProfile.id, 'tracks'],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/artist/${artistProfile.id}`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      return response.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { caption: string; trackId?: string; mediaUrl?: string }) => {
      return apiRequest('POST', '/api/posts', data);
    },
    onSuccess: () => {
      setCaption('');
      setTrackId(undefined);
      setMediaUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const handleSubmit = () => {
    if (!caption.trim()) return;
    createPostMutation.mutate({
      caption: caption.trim(),
      trackId: trackId,
      mediaUrl: mediaUrl.trim() || undefined,
    });
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={artistProfile.profileImageUrl || undefined} alt={artistProfile.stageName || undefined} />
            <AvatarFallback>{artistProfile.stageName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Share an update with your fans..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none min-h-[100px] border-0 focus-visible:ring-0 text-base"
              data-testid="input-post-caption"
            />
            
            {myTracks && myTracks.length > 0 && (
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                <Select value={trackId || ''} onValueChange={(value) => setTrackId(value || undefined)}>
                  <SelectTrigger className="w-[260px]" data-testid="select-track-for-post">
                    <SelectValue placeholder="Link a track (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {myTracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {trackId && (
                  <Button variant="ghost" size="icon" onClick={() => setTrackId(undefined)} data-testid="button-clear-track">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!caption.trim() || createPostMutation.isPending}
          data-testid="button-create-post"
        >
          {createPostMutation.isPending ? 'Posting...' : 'Post'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PostCard({ post, currentUserId }: { post: ArtistPostWithDetails; currentUserId?: string }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const isMyPost = post.artist?.userId === currentUserId;

  const likeMutation = useMutation({
    mutationFn: async ({ wasLiked }: { wasLiked: boolean }) => {
      if (wasLiked) {
        await apiRequest('DELETE', `/api/posts/${post.id}/like`);
      } else {
        await apiRequest('POST', `/api/posts/${post.id}/like`);
      }
    },
    onMutate: async ({ wasLiked }) => {
      const previousIsLiked = wasLiked;
      const previousLikeCount = wasLiked ? likeCount : likeCount;
      
      setIsLiked(!wasLiked);
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
      
      return { previousIsLiked, previousLikeCount: wasLiked ? likeCount : likeCount };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        setIsLiked(context.previousIsLiked);
        setLikeCount(context.previousLikeCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiRequest('DELETE', `/api/posts/${post.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/feed'] }),
  });

  const handleLike = () => {
    if (!currentUserId) return;
    likeMutation.mutate({ wasLiked: isLiked });
  };

  return (
    <Card className="border-border/50 overflow-hidden" data-testid={`post-card-${post.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <Link href={`/artist/${post.artistId}`} className="flex items-center gap-3 group">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.artist?.profileImageUrl || undefined} alt={post.artist?.stageName || undefined} />
            <AvatarFallback>{post.artist?.stageName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold group-hover:text-primary transition-colors" data-testid="text-post-artist-name">
              {post.artist?.stageName}
            </p>
            <p className="text-xs text-muted-foreground">
              {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>
        {isMyPost && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-post"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-base whitespace-pre-wrap" data-testid="text-post-caption">{post.caption}</p>
        
        {post.track && (
          <Link href={`/track/${post.track.id}`} className="block">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <img
                src={post.track.coverImageUrl || '/placeholder-album.png'}
                alt={post.track.title}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid="text-linked-track-title">{post.track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{post.track.artist?.stageName}</p>
                {post.track.genre && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {post.track.genre}
                  </span>
                )}
              </div>
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {post.mediaUrl && (
          <img
            src={post.mediaUrl}
            alt="Post media"
            className="w-full rounded-lg object-cover max-h-96"
          />
        )}
      </CardContent>
      
      <CardFooter className="flex items-center gap-1 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className="gap-2"
          data-testid="button-like-post"
        >
          <Heart
            className={`h-5 w-5 transition-all ${isLiked ? 'fill-[#E84A5F] text-[#E84A5F]' : ''}`}
          />
          <span data-testid="text-like-count">{likeCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2"
          data-testid="button-toggle-comments"
        >
          <MessageCircle className="h-5 w-5" />
          <span data-testid="text-comment-count">{post.commentCount}</span>
        </Button>
        
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-share-post">
              <Share2 className="h-5 w-5" />
              <span data-testid="text-share-count">{post.shareCount}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share with Friends</DialogTitle>
            </DialogHeader>
            <SharePostDialog postId={post.id} onClose={() => setShowShareDialog(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
      
      {showComments && <CommentsSection postId={post.id} currentUserId={currentUserId} />}
    </Card>
  );
}

function CommentsSection({ postId, currentUserId }: { postId: string; currentUserId?: string }) {
  const [newComment, setNewComment] = useState('');
  
  const { data: comments, isLoading } = useQuery<PostCommentWithUser[]>({
    queryKey: ['/api/posts', postId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !currentUserId) return;
    addCommentMutation.mutate(newComment.trim());
  };

  return (
    <div className="border-t px-6 py-4 space-y-4">
      {currentUserId && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="input-comment"
          />
          <Button
            size="icon"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            data-testid="button-submit-comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} alt={comment.user?.fullName} />
                <AvatarFallback>{comment.user?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{comment.user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
      )}
    </div>
  );
}

function SharePostDialog({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { data: friends, isLoading } = useQuery<User[]>({
    queryKey: ['/api/friends'],
  });

  const shareMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      return apiRequest('POST', `/api/posts/${postId}/share`, { toUserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      onClose();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No friends to share with</p>
        <Link href="/social">
          <Button variant="outline">Find Friends</Button>
        </Link>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-80">
      <div className="space-y-2 pr-4">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={undefined} alt={friend.fullName} />
                <AvatarFallback>{friend.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{friend.fullName}</p>
                <p className="text-sm text-muted-foreground">{friend.universityName}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => shareMutation.mutate(friend.id)}
              disabled={shareMutation.isPending}
              data-testid={`button-share-to-${friend.id}`}
            >
              Share
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function EmptyFeed({ isArtist }: { isArtist: boolean }) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Music className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground max-w-sm">
          {isArtist
            ? "Share an update with your fans! Post about your latest track or music news."
            : "Follow artists to see their latest updates here."}
        </p>
      </CardContent>
    </Card>
  );
}
