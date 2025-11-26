import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Plus, Music } from 'lucide-react';
import type { PlaylistWithTracks } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function Playlists() {
  const { toast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: playlists, isLoading } = useQuery<PlaylistWithTracks[]>({
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
        <h1 className="text-4xl font-bold mb-2">Your Playlists</h1>
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
            <Link key={playlist.id} href={`/library?tab=playlists`}>
              <Card 
                className="overflow-hidden hover-elevate transition-all cursor-pointer h-64 flex flex-col" 
                data-testid={`card-playlist-${playlist.id}`}
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Music className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No playlists yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
