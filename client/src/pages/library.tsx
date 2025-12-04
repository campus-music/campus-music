import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Music, Image, X, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { TrackWithArtist, PlaylistWithTracks } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Library() {
  const { toast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: likedTracks, isLoading: likedLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/liked'],
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery<PlaylistWithTracks[]>({
    queryKey: ['/api/playlists'],
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max size is 5MB', variant: 'destructive' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
    setUploading(true);

    try {
      const urlRes = await apiRequest('POST', '/api/upload/signed-url', {
        filename: file.name,
        contentType: file.type,
        category: 'playlist-cover'
      });
      const { url } = await urlRes.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const objectPath = new URL(url).pathname;
      setCoverImageUrl(objectPath);
      toast({ title: 'Cover uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setCoverPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeCover = () => {
    setCoverImageUrl(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createPlaylistMutation = useMutation({
    mutationFn: async ({ name, coverImageUrl }: { name: string; coverImageUrl: string | null }) => {
      const res = await apiRequest('POST', '/api/playlists', { 
        name, 
        description: '', 
        isPublic: false,
        coverImageUrl 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setDialogOpen(false);
      setNewPlaylistName('');
      setCoverImageUrl(null);
      setCoverPreview(null);
      toast({ title: 'Playlist created successfully' });
    },
  });

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      await createPlaylistMutation.mutateAsync({ name: newPlaylistName, coverImageUrl });
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Library</h1>
        <p className="text-muted-foreground text-lg">
          Your saved tracks and playlists
        </p>
      </div>

      <Tabs defaultValue="liked" className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
          <TabsTrigger 
            value="liked" 
            data-testid="tab-liked-songs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Liked Songs
          </TabsTrigger>
          <TabsTrigger 
            value="playlists" 
            data-testid="tab-playlists"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked" className="mt-8">
          <div className="space-y-2">
            {likedLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : likedTracks && likedTracks.length > 0 ? (
              likedTracks.map((track, index) => (
                <TrackListItem key={track.id} track={track} index={index + 1} isLiked />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No liked songs yet. Start exploring and like some tracks!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="mt-8">
          <div className="mb-8">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full" data-testid="button-create-playlist">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Playlist</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div 
                        className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center cursor-pointer hover-elevate transition-all overflow-hidden border-2 border-dashed border-muted-foreground/30"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : coverPreview ? (
                          <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-xs text-muted-foreground mt-1">Add Cover</p>
                          </div>
                        )}
                      </div>
                      {coverPreview && !uploading && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removeCover}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                    <p className="text-xs text-muted-foreground">Optional: Click to add cover art</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="playlist-name">Playlist Name</Label>
                    <Input
                      id="playlist-name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="My awesome playlist"
                      data-testid="input-playlist-name"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={uploading || createPlaylistMutation.isPending}
                    data-testid="button-submit-playlist"
                  >
                    {createPlaylistMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {playlistsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist, index) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                  <div 
                    className="flex items-center gap-4 p-2 rounded-md hover-elevate transition-all cursor-pointer group"
                    data-testid={`card-playlist-${playlist.id}`}
                  >
                    <div className="text-sm text-muted-foreground w-6 text-right">
                      {index + 1}
                    </div>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                      {playlist.coverImageUrl ? (
                        <img 
                          src={playlist.coverImageUrl} 
                          alt={playlist.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.tracks?.length || 0} tracks
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No playlists yet. Create your first playlist!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
