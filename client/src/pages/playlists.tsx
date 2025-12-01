import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrackListItem } from '@/components/track-list-item';
import { Plus, Music, Trash2, ChevronLeft, ListMusic } from 'lucide-react';
import type { PlaylistWithTracks } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Playlists() {
  const { toast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const { data: playlists, isLoading } = useQuery<PlaylistWithTracks[]>({
    queryKey: ['/api/playlists'],
  });

  const selectedPlaylist = playlists?.find(p => p.id === selectedPlaylistId);

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

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setSelectedPlaylistId(null);
      toast({ title: 'Playlist deleted' });
    },
  });

  const removeTrackMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ title: 'Track removed from playlist' });
    },
  });

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      await createPlaylistMutation.mutateAsync(newPlaylistName);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (selectedPlaylist) {
      removeTrackMutation.mutate({ playlistId: selectedPlaylist.id, trackId });
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {selectedPlaylist ? (
        // Playlist Detail View
        <>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlaylistId(null)}
              data-testid="button-back-to-playlists"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Playlists
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">{selectedPlaylist.name}</h1>
                <Badge variant="secondary">
                  {selectedPlaylist.tracks?.length || 0} {selectedPlaylist.tracks?.length === 1 ? 'track' : 'tracks'}
                </Badge>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                data-testid={`button-delete-playlist-${selectedPlaylist.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Playlist
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
              selectedPlaylist.tracks.map((track, index) => (
                <div key={track.id} className="flex items-center gap-2 group">
                  <div className="flex-1">
                    <TrackListItem track={track} index={index + 1} />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveTrack(track.id)}
                    data-testid={`button-remove-${track.id}`}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracks in this playlist yet</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Playlists List View
        <>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Your Playlists</h1>
            <p className="text-muted-foreground text-lg">
              Create and manage your music collections
            </p>
          </div>

          <div>
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="overflow-hidden hover-elevate transition-all cursor-pointer flex flex-col group"
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  data-testid={`card-playlist-${playlist.id}`}
                >
                  <div 
                    className="h-24 relative flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, hsl(351 76% 60% / 0.15), hsl(var(--card)) 70%)'
                    }}
                  >
                    <ListMusic className="h-6 w-6 text-primary/50" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                      data-testid={`button-delete-${playlist.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-3 flex flex-col">
                    <h3 className="font-semibold truncate text-sm">{playlist.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No playlists yet. Create your first one!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
