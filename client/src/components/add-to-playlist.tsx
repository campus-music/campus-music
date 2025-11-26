import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PlaylistWithTracks } from '@shared/schema';

interface AddToPlaylistProps {
  trackId: string;
  trackTitle: string;
}

export function AddToPlaylist({ trackId, trackTitle }: AddToPlaylistProps) {
  const { toast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      setDropdownOpen(false);
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
      setDialogOpen(false);
      setNewPlaylistName('');
      toast({ title: `Added "${trackTitle}" to new playlist` });
      setDropdownOpen(false);
    },
  });

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setDropdownOpen(true);
        }}
        data-testid={`button-add-to-playlist-${trackId}`}
      >
        Add to playlist
      </Button>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Save to playlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {playlists && playlists.length > 0 ? (
          <>
            {playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                data-testid={`menu-item-add-to-${playlist.id}`}
              >
                {playlist.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start pl-2">
              <Plus className="h-3 w-3 mr-2" />
              Create new playlist
            </Button>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPlaylistName.trim()) {
                  createAndAddMutation.mutate(newPlaylistName);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-playlist-name">Playlist Name</Label>
                <Input
                  id="new-playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My awesome playlist"
                  data-testid="input-new-playlist-name"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-create-and-add">
                Create & Add
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
