import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Plus, Music } from 'lucide-react';
import type { TrackWithArtist, PlaylistWithTracks } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Library() {
  const { toast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: likedTracks, isLoading: likedLoading } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/liked'],
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery<PlaylistWithTracks[]>({
    queryKey: ['/api/playlists'],
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/playlists', { name, description: '', isPublic: false });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setDialogOpen(false);
      setNewPlaylistName('');
      toast({ title: 'Playlist created successfully' });
    },
  });

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      await createPlaylistMutation.mutateAsync(newPlaylistName);
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
                  <Button type="submit" className="w-full" data-testid="button-submit-playlist">
                    Create
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
                <div 
                  key={playlist.id} 
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
