import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ListPlus, Plus, Music } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PlaylistWithTracks } from '@shared/schema';

interface AddToPlaylistProps {
  trackId: string;
  trackTitle: string;
}

export function AddToPlaylist({ trackId, trackTitle }: AddToPlaylistProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { data: playlists } = useQuery<PlaylistWithTracks[]>({
    queryKey: ['/api/playlists'],
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const res = await apiRequest('POST', `/api/playlists/${playlistId}/tracks`, { trackId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ title: `Added "${trackTitle}" to playlist` });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to add to playlist', variant: 'destructive' });
    },
  });

  const createAndAddMutation = useMutation({
    mutationFn: async (name: string) => {
      const createRes = await apiRequest('POST', '/api/playlists', { name, description: '', isPublic: false });
      const playlist = await createRes.json();
      const addRes = await apiRequest('POST', `/api/playlists/${playlist.id}/tracks`, { trackId });
      return addRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ title: `Added "${trackTitle}" to new playlist` });
      setDialogOpen(false);
      setShowCreateForm(false);
      setNewPlaylistName('');
    },
    onError: () => {
      toast({ title: 'Failed to create playlist', variant: 'destructive' });
    },
  });

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createAndAddMutation.mutate(newPlaylistName.trim());
    }
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          handleOpenDialog();
        }}
        data-testid={`button-add-to-playlist-${trackId}`}
      >
        <ListPlus className="h-4 w-4 mr-2" />
        Add to Playlist
      </DropdownMenuItem>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              Add "{trackTitle}" to an existing playlist or create a new one.
            </DialogDescription>
          </DialogHeader>
          
          {!showCreateForm ? (
            <div className="space-y-4">
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {playlists && playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        type="button"
                        onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                        disabled={addToPlaylistMutation.isPending}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover-elevate text-left transition-colors"
                        data-testid={`playlist-option-${playlist.id}`}
                      >
                        <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {playlist.tracks?.length || 0} tracks
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No playlists yet. Create your first one below!
                    </p>
                  )}
                </div>
              </ScrollArea>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
                data-testid="button-show-create-form"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Playlist
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-playlist-name">Playlist Name</Label>
                <Input
                  id="new-playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My awesome playlist"
                  autoFocus
                  data-testid="input-new-playlist-name"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateForm(false)}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!newPlaylistName.trim() || createAndAddMutation.isPending}
                  data-testid="button-create-and-add"
                >
                  {createAndAddMutation.isPending ? 'Creating...' : 'Create & Add'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
