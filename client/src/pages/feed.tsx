import { useState, useRef, useCallback, createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Heart, MessageCircle, Share2, Music, Trash2, Send, X, Image as ImageIcon, 
  Upload, Play, Pause, TrendingUp, Sparkles, Mic, Camera, Star, Flame, Sticker, GraduationCap, HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ArtistPostWithDetails, TrackWithArtist, User, PostCommentWithUser, ArtistProfile, CommentSticker } from '@shared/schema';
import { Link } from 'wouter';

// Predefined stickers for comments (iMessage-style)
const STICKERS = [
  { id: 'fire', emoji: '🔥', name: 'Fire' },
  { id: 'heart', emoji: '❤️', name: 'Heart' },
  { id: 'laugh', emoji: '😂', name: 'Laugh' },
  { id: 'wow', emoji: '😮', name: 'Wow' },
  { id: 'clap', emoji: '👏', name: 'Clap' },
  { id: 'hundred', emoji: '💯', name: '100' },
  { id: 'music', emoji: '🎵', name: 'Music' },
  { id: 'headphones', emoji: '🎧', name: 'Headphones' },
  { id: 'mic', emoji: '🎤', name: 'Mic' },
  { id: 'guitar', emoji: '🎸', name: 'Guitar' },
  { id: 'crown', emoji: '👑', name: 'Crown' },
  { id: 'star', emoji: '⭐', name: 'Star' },
  { id: 'party', emoji: '🎉', name: 'Party' },
  { id: 'cool', emoji: '😎', name: 'Cool' },
  { id: 'think', emoji: '🤔', name: 'Think' },
  { id: 'mind_blown', emoji: '🤯', name: 'Mind Blown' },
];

const FeedAudioContext = createContext<{
  currentlyPlaying: string | null;
  setCurrentlyPlaying: (id: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
} | null>(null);

function useFeedAudio() {
  const context = useContext(FeedAudioContext);
  if (!context) throw new Error('useFeedAudio must be used within FeedAudioProvider');
  return context;
}

const POST_TYPES = [
  { value: 'update', label: 'Update', icon: Sparkles, color: 'bg-blue-500/10 text-blue-500' },
  { value: 'new_release', label: 'New Release', icon: Music, color: 'bg-primary/10 text-primary' },
  { value: 'behind_scenes', label: 'Behind the Scenes', icon: Camera, color: 'bg-purple-500/10 text-purple-500' },
  { value: 'live_show', label: 'Live Show', icon: Mic, color: 'bg-green-500/10 text-green-500' },
  { value: 'milestone', label: 'Milestone', icon: Star, color: 'bg-yellow-500/10 text-yellow-500' },
];

export default function Feed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('latest');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: artistProfile, isLoading: isLoadingProfile } = useQuery<ArtistProfile | null>({
    queryKey: ['/api/artist/profile'],
    queryFn: async () => {
      const response = await fetch('/api/artist/profile');
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return response.json();
    },
    enabled: user?.role === 'artist',
  });
  
  const isArtist = user?.role === 'artist' && artistProfile !== undefined && artistProfile !== null;
  
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

  const trendingPosts = posts?.slice().sort((a, b) => {
    const aScore = a.likeCount * 2 + a.commentCount * 3 + a.shareCount * 5;
    const bScore = b.likeCount * 2 + b.commentCount * 3 + b.shareCount * 5;
    return bScore - aScore;
  }).slice(0, 5);

  return (
    <FeedAudioContext.Provider value={{ currentlyPlaying, setCurrentlyPlaying, audioRef }}>
    <div className="max-w-3xl mx-auto pb-32 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Artist Feed</h1>
            <p className="text-sm text-muted-foreground">See what artists are sharing</p>
          </div>
        </div>
      </div>

      {user?.role === 'artist' && isLoadingProfile && <ComposerSkeleton />}
      {isArtist && artistProfile && <PostComposer artistProfile={artistProfile} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="latest" className="gap-2" data-testid="tab-latest">
            <Sparkles className="h-4 w-4" />
            Latest
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2" data-testid="tab-trending">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="space-y-6 mt-0">
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
        </TabsContent>

        <TabsContent value="trending" className="space-y-6 mt-0">
          {isLoading ? (
            <FeedSkeleton />
          ) : trendingPosts && trendingPosts.length > 0 ? (
            <div className="space-y-6">
              {trendingPosts.map((post, index) => (
                <div key={post.id} className="relative">
                  {index < 3 && (
                    <div className="absolute -left-3 -top-2 z-10">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : ''}
                      `}>
                        {index + 1}
                      </div>
                    </div>
                  )}
                  <PostCard post={post} currentUserId={user?.id} showHotBadge={index === 0} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyFeed isArtist={isArtist} />
          )}
        </TabsContent>
      </Tabs>
      <audio ref={audioRef} className="hidden" onEnded={() => setCurrentlyPlaying(null)} />
    </div>
    </FeedAudioContext.Provider>
  );
}

function PostComposer({ artistProfile }: { artistProfile: ArtistProfile }) {
  const [caption, setCaption] = useState('');
  const [trackId, setTrackId] = useState<string | undefined>(undefined);
  const [mediaUrl, setMediaUrl] = useState('');
  const [postType, setPostType] = useState('update');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [usingTrackCover, setUsingTrackCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: myTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/artists', artistProfile.id, 'tracks'],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/artist/${artistProfile.id}`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      return response.json();
    },
  });

  // Auto-fill track cover art when a track is selected
  const handleTrackSelect = useCallback((newTrackId: string | undefined) => {
    setTrackId(newTrackId);
    
    if (newTrackId && myTracks) {
      const selectedTrack = myTracks.find(t => t.id === newTrackId);
      if (selectedTrack?.coverArtUrl && !selectedImage) {
        setImagePreview(selectedTrack.coverArtUrl);
        setMediaUrl(selectedTrack.coverArtUrl);
        setUsingTrackCover(true);
      }
    } else if (usingTrackCover) {
      // Clear the auto-filled cover when track is deselected
      setImagePreview(null);
      setMediaUrl('');
      setUsingTrackCover(false);
    }
  }, [myTracks, selectedImage, usingTrackCover]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview && !usingTrackCover) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setMediaUrl('');
    setUsingTrackCover(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreview, usingTrackCover]);

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          category: 'post-images',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { url } = await response.json();
      const isLocalUpload = url.startsWith('/api/upload/local/');
      
      const objectPath = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (isLocalUpload) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result.objectPath);
              } catch {
                reject(new Error('Invalid response from upload'));
              }
            } else {
              resolve(url.split('?')[0]);
            }
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
      
      return objectPath;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: { caption: string; trackId?: string; mediaUrl?: string; postType?: string }) => {
      return apiRequest('POST', '/api/posts', data);
    },
    onSuccess: () => {
      setCaption('');
      setTrackId(undefined);
      setMediaUrl('');
      setPostType('update');
      removeImage();
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    },
  });

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    
    // Validate: New Release posts require either an image or a linked track
    if (postType === 'new_release' && !selectedImage && !mediaUrl && !trackId) {
      alert('New Release posts require album art or a linked track');
      return;
    }
    
    let finalMediaUrl = mediaUrl;
    
    if (selectedImage) {
      try {
        finalMediaUrl = await uploadImage(selectedImage);
      } catch (error) {
        alert('Failed to upload image');
        return;
      }
    }
    
    createPostMutation.mutate({
      caption: caption.trim(),
      trackId: trackId,
      mediaUrl: finalMediaUrl || undefined,
      postType,
    });
  };

  const selectedPostType = POST_TYPES.find(t => t.value === postType);

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={artistProfile.profileImageUrl || undefined} alt={artistProfile.stageName || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {artistProfile.stageName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {POST_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={postType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPostType(type.value)}
                    className={`gap-1.5 ${postType === type.value ? '' : 'hover:bg-muted'}`}
                    data-testid={`button-post-type-${type.value}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
            
            <Textarea
              placeholder={
                postType === 'new_release' ? "Tell your fans about your new release..." :
                postType === 'behind_scenes' ? "Share what's happening behind the scenes..." :
                postType === 'live_show' ? "Announce your upcoming show..." :
                postType === 'milestone' ? "Celebrate your achievement..." :
                "Share an update with your fans..."
              }
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none min-h-[100px] border-0 focus-visible:ring-0 text-base bg-muted/30"
              data-testid="input-post-caption"
            />
            
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-h-48 rounded-lg object-cover aspect-square"
                />
                {usingTrackCover && (
                  <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                    <Music className="h-3 w-3 mr-1" />
                    From linked track
                  </Badge>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeImage}
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {postType === 'new_release' && !imagePreview && !trackId && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-amber-500 flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  New Release posts require album art or a linked track
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">What's a linked track?</p>
                    <p className="text-sm text-muted-foreground">
                      When you upload music to your artist profile, you can link those tracks to your posts. 
                      The track's cover art will automatically be used, and fans can play it directly from the feed.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Go to <span className="text-primary">Profile</span> to upload your first track!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
              </div>
            )}
            
            <div className="flex items-center gap-3 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                data-testid="input-image-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
                data-testid="button-add-image"
              >
                <ImageIcon className="h-4 w-4" />
                Add Album Art
              </Button>
              
              {myTracks && myTracks.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={trackId || ''} onValueChange={(value) => handleTrackSelect(value || undefined)}>
                    <SelectTrigger className="w-[220px]" data-testid="select-track-for-post">
                      <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Link a track" />
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
                    <Button variant="ghost" size="icon" onClick={() => handleTrackSelect(undefined)} data-testid="button-clear-track">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        {selectedPostType && (
          <Badge variant="secondary" className={selectedPostType.color}>
            <selectedPostType.icon className="h-3 w-3 mr-1" />
            {selectedPostType.label}
          </Badge>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!caption.trim() || createPostMutation.isPending || isUploading}
          className="gap-2"
          data-testid="button-create-post"
        >
          {createPostMutation.isPending ? (
            <>Posting...</>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PostCard({ post, currentUserId, showHotBadge }: { post: ArtistPostWithDetails; currentUserId?: string; showHotBadge?: boolean }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { currentlyPlaying, setCurrentlyPlaying, audioRef } = useFeedAudio();
  const isPlaying = currentlyPlaying === post.id;
  
  const isMyPost = post.artist?.userId === currentUserId;

  const postTypeInfo = POST_TYPES.find(t => t.value === (post as any).postType) || POST_TYPES[0];

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
      const previousLikeCount = likeCount;
      
      setIsLiked(!wasLiked);
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
      
      return { previousIsLiked, previousLikeCount };
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

  const togglePlay = () => {
    if (!audioRef.current || !post.track?.audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      audioRef.current.src = post.track.audioUrl;
      audioRef.current.play();
      setCurrentlyPlaying(post.id);
    }
  };

  return (
    <Card className="border-border/50 overflow-hidden group" data-testid={`post-card-${post.id}`}>
      {showHotBadge && (
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse" />
      )}
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <Link href={`/artist/${post.artistId}`} className="flex items-center gap-3 group/link">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover/link:ring-primary/30 transition-all">
              <AvatarImage src={post.artist?.profileImageUrl || undefined} alt={post.artist?.stageName || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {post.artist?.stageName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {showHotBadge && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                <Flame className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold group-hover/link:text-primary transition-colors" data-testid="text-post-artist-name">
                {post.artist?.stageName}
              </p>
              <Badge variant="secondary" className={`text-xs ${postTypeInfo.color}`}>
                <postTypeInfo.icon className="h-3 w-3 mr-1" />
                {postTypeInfo.label}
              </Badge>
            </div>
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
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="button-delete-post"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-base whitespace-pre-wrap leading-relaxed" data-testid="text-post-caption">{post.caption}</p>
        
        {post.mediaUrl && !imageError && (
          <div className="relative rounded-xl overflow-hidden max-w-md mx-auto">
            <div className="aspect-square">
              <img
                src={post.mediaUrl}
                alt="Album art"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}
        
        {post.track && (
          <div className="relative">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/80 to-muted/40 border border-border/50">
              <div className="relative group/cover">
                <img
                  src={post.track.coverImageUrl || '/placeholder-album.png'}
                  alt={post.track.title}
                  className="w-20 h-20 rounded-lg object-cover shadow-lg"
                />
                {post.track.audioUrl && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute inset-0 m-auto h-10 w-10 rounded-full opacity-0 group-hover/cover:opacity-100 transition-opacity shadow-lg"
                    onClick={togglePlay}
                    data-testid="button-play-track"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/track/${post.track.id}`} className="hover:text-primary transition-colors">
                  <p className="font-semibold truncate" data-testid="text-linked-track-title">{post.track.title}</p>
                </Link>
                <p className="text-sm text-muted-foreground truncate">{post.track.artist?.stageName}</p>
                <div className="flex items-center gap-2 mt-2">
                  {post.track.genre && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {post.track.genre}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    {isPlaying ? 'Playing...' : 'Click to preview'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center gap-1 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`gap-2 transition-all ${isLiked ? 'text-[#E84A5F]' : ''}`}
          data-testid="button-like-post"
        >
          <Heart
            className={`h-5 w-5 transition-all ${isLiked ? 'fill-[#E84A5F] text-[#E84A5F] scale-110' : ''}`}
          />
          <span data-testid="text-like-count">{likeCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className={`gap-2 ${showComments ? 'text-primary' : ''}`}
          data-testid="button-toggle-comments"
        >
          <MessageCircle className={`h-5 w-5 ${showComments ? 'fill-primary/20' : ''}`} />
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
    <div className="border-t px-6 py-4 space-y-4 bg-muted/20">
      {currentUserId && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="input-comment"
          />
          <Button
            size="icon"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="rounded-full"
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
            <CommentWithStickers 
              key={comment.id} 
              comment={comment} 
              currentUserId={currentUserId}
              postId={postId}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
      )}
    </div>
  );
}

// Individual comment with sticker support
function CommentWithStickers({ 
  comment, 
  currentUserId,
  postId 
}: { 
  comment: PostCommentWithUser; 
  currentUserId?: string;
  postId: string;
}) {
  const [hiddenStickers, setHiddenStickers] = useState<Set<string>>(new Set());
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);

  // Fetch stickers for this comment
  const { data: stickers } = useQuery<CommentSticker[]>({
    queryKey: ['/api/comments', comment.id, 'stickers'],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${comment.id}/stickers`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Add sticker mutation
  const addStickerMutation = useMutation({
    mutationFn: async (data: { stickerId: string; positionX: number; positionY: number }) => {
      return apiRequest('POST', `/api/comments/${comment.id}/stickers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', comment.id, 'stickers'] });
      setStickerPickerOpen(false);
    },
  });

  // Delete sticker mutation
  const deleteStickerMutation = useMutation({
    mutationFn: async (stickerId: string) => {
      return apiRequest('DELETE', `/api/stickers/${stickerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', comment.id, 'stickers'] });
    },
  });

  // Handle sticker placement with random position near corners
  const handleAddSticker = (stickerId: string) => {
    // Random position in the top-right area of the comment (rounded to integers)
    const positionX = Math.round(70 + Math.random() * 25); // 70-95%
    const positionY = Math.round(Math.random() * 60); // 0-60%
    addStickerMutation.mutate({ stickerId, positionX, positionY });
  };

  // Handle press and hold to hide stickers
  const handlePressStart = (stickerId: string) => {
    setHiddenStickers(prev => new Set(prev).add(stickerId));
  };

  const handlePressEnd = (stickerId: string) => {
    setHiddenStickers(prev => {
      const next = new Set(prev);
      next.delete(stickerId);
      return next;
    });
  };

  const getStickerEmoji = (stickerId: string) => {
    return STICKERS.find(s => s.id === stickerId)?.emoji || '✨';
  };

  return (
    <div 
      ref={commentRef}
      className="relative flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
      data-testid={`comment-${comment.id}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={undefined} alt={comment.user?.fullName} />
        <AvatarFallback className="text-xs">{comment.user?.fullName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{comment.user?.fullName}</p>
          {comment.user?.universityName && comment.user?.showUniversity !== false && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5 h-5" data-testid={`badge-university-${comment.id}`}>
              <GraduationCap className="h-3 w-3 mr-1" />
              {comment.user.universityName.length > 25 
                ? comment.user.universityName.substring(0, 22) + '...' 
                : comment.user.universityName}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">
            {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
      </div>

      {/* Sticker button - appears on hover */}
      {currentUserId && (
        <Popover open={stickerPickerOpen} onOpenChange={setStickerPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              data-testid={`button-add-sticker-${comment.id}`}
            >
              <Sticker className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Add a sticker</p>
            <div className="grid grid-cols-4 gap-1">
              {STICKERS.map((sticker) => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  className="h-10 w-10 text-xl p-0 hover:scale-110 transition-transform"
                  onClick={() => handleAddSticker(sticker.id)}
                  data-testid={`sticker-option-${sticker.id}`}
                  title={sticker.name}
                >
                  {sticker.emoji}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">Press and hold stickers to peek underneath</p>
          </PopoverContent>
        </Popover>
      )}

      {/* Render stickers overlaid on comment */}
      {stickers && stickers.map((sticker) => (
        <div
          key={sticker.id}
          className={`absolute text-2xl cursor-pointer select-none transition-all duration-150 z-10 ${
            hiddenStickers.has(sticker.id) ? 'opacity-20 scale-75' : 'opacity-100 hover:scale-110'
          }`}
          style={{
            left: `${sticker.positionX}%`,
            top: `${sticker.positionY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={() => handlePressStart(sticker.id)}
          onMouseUp={() => handlePressEnd(sticker.id)}
          onMouseLeave={() => handlePressEnd(sticker.id)}
          onTouchStart={() => handlePressStart(sticker.id)}
          onTouchEnd={() => handlePressEnd(sticker.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (sticker.userId === currentUserId) {
              deleteStickerMutation.mutate(sticker.id);
            }
          }}
          title={hiddenStickers.has(sticker.id) ? 'Release to show sticker' : 'Press and hold to peek underneath. Right-click to remove your sticker.'}
          data-testid={`sticker-${sticker.id}`}
        >
          {getStickerEmoji(sticker.stickerId)}
        </div>
      ))}
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
        <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No friends to share with</p>
        <Link href="/social">
          <Button variant="outline">Find Friends</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {friends.map((friend) => (
        <Button
          key={friend.id}
          variant="ghost"
          className="w-full justify-start gap-3 h-auto py-3"
          onClick={() => shareMutation.mutate(friend.id)}
          disabled={shareMutation.isPending}
          data-testid={`button-share-to-${friend.id}`}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback>{friend.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium">{friend.fullName}</p>
            <p className="text-xs text-muted-foreground">{friend.email}</p>
          </div>
        </Button>
      ))}
    </div>
  );
}

function EmptyFeed({ isArtist }: { isArtist: boolean }) {
  return (
    <Card className="border-border/50 py-16">
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Music className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground max-w-sm">
            {isArtist
              ? "Share your first update with your fans! Post about new releases, behind the scenes content, or upcoming shows."
              : "Follow artists to see their latest updates here."}
          </p>
        </div>
        {!isArtist && (
          <Link href="/search">
            <Button className="mt-4">
              <Music className="h-4 w-4 mr-2" />
              Discover Artists
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function ComposerSkeleton() {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </CardHeader>
      <CardFooter className="flex justify-end border-t pt-4">
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="flex gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
