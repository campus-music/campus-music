import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrackListItem } from '@/components/track-list-item';
import { Plus, Music, Trash2, ChevronLeft, ListMusic, ImagePlus } from 'lucide-react';
import type { PlaylistWithTracks } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ObjectUploader } from '@/components/ObjectUploader';

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

  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, coverImageUrl }: { id: string; coverImageUrl: string }) => {
      const res = await apiRequest('PATCH', `/api/playlists/${id}`, { coverImageUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ title: 'Playlist cover updated' });
    },
  });

  const getUploadParameters = async () => {
    const res = await apiRequest('POST', '/api/objects/upload', {});
    const data = await res.json();
    return { method: 'PUT' as const, url: data.uploadURL };
  };

  const handleCoverImageUploaded = (result: { successful: Array<{ uploadURL: string }>; failed: Array<{ error: string }> }) => {
    if (result.successful.length > 0 && selectedPlaylistId) {
      updatePlaylistMutation.mutate({ id: selectedPlaylistId, coverImageUrl: result.successful[0].uploadURL });
    }
  };

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

          <div className="flex items-start gap-6">
            <div className="relative group">
              <div className="h-40 w-40 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {selectedPlaylist.coverImageUrl ? (
                  <img
                    src={selectedPlaylist.coverImageUrl}
                    alt={selectedPlaylist.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
                    <ListMusic className="h-16 w-16 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <ObjectUploader
                  allowedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                  maxFileSize={5 * 1024 * 1024}
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleCoverImageUploaded}
                  buttonVariant="secondary"
                  buttonSize="sm"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {selectedPlaylist.coverImageUrl ? 'Change Cover' : 'Add Cover'}
                </ObjectUploader>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between min-h-[10rem]">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">{selectedPlaylist.name}</h1>
                <Badge variant="secondary">
                  {selectedPlaylist.tracks?.length || 0} {selectedPlaylist.tracks?.length === 1 ? 'track' : 'tracks'}
                </Badge>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-fit"
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

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-14 w-14 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-4 p-2 rounded-md hover-elevate cursor-pointer group"
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  data-testid={`card-playlist-${playlist.id}`}
                >
                  <div className="h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-muted relative">
                    {playlist.coverImageUrl ? (
                      <img
                        src={playlist.coverImageUrl}
                        alt={playlist.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <ListMusic className="h-6 w-6 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(playlist.id);
                    }}
                    data-testid={`button-delete-${playlist.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
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
