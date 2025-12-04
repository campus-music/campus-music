import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackListItem } from '@/components/track-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { ObjectUploader } from '@/components/ObjectUploader';
import { ChevronLeft, Music, Trash2, ListMusic, ImagePlus } from 'lucide-react';
import type { PlaylistWithTracks, TrackWithArtist } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: playlist, isLoading } = useQuery<PlaylistWithTracks>({
    queryKey: ['/api/playlists', id],
    enabled: !!id,
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ title: 'Playlist deleted' });
      navigate('/library');
    },
  });

  const removeTrackMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', id] });
      toast({ title: 'Track removed from playlist' });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, coverImageUrl }: { playlistId: string; coverImageUrl: string }) => {
      const res = await apiRequest('PATCH', `/api/playlists/${playlistId}`, { coverImageUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', id] });
      toast({ title: 'Playlist cover updated' });
    },
  });

  const getUploadParameters = async () => {
    const res = await apiRequest('POST', '/api/objects/upload', {});
    const data = await res.json();
    return { method: 'PUT' as const, url: data.uploadURL };
  };

  const handleCoverImageUploaded = (result: { successful: Array<{ uploadURL: string }>; failed: Array<{ error: string }> }) => {
    if (result.successful.length > 0 && id) {
      updatePlaylistMutation.mutate({ playlistId: id, coverImageUrl: result.successful[0].uploadURL });
    }
  };

  const handleDeletePlaylist = () => {
    if (id && confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylistMutation.mutate(id);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (id) {
      removeTrackMutation.mutate({ playlistId: id, trackId });
    }
  };

  const { data: likedTracks } = useQuery<TrackWithArtist[]>({
    queryKey: ['/api/tracks/liked'],
  });

  const [localLikedIds, setLocalLikedIds] = useState<Set<string>>(new Set());
  
  const likedTrackIds = new Set([
    ...(likedTracks?.map(t => t.id) || []),
    ...Array.from(localLikedIds)
  ]);

  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest('DELETE', `/api/tracks/${trackId}/like`, {});
      } else {
        await apiRequest('POST', `/api/tracks/${trackId}/like`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/liked'] });
    },
  });

  const handleLike = (trackId: string) => {
    const isLiked = likedTrackIds.has(trackId);
    
    setLocalLikedIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
    
    likeMutation.mutate({ trackId, isLiked });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-32">
        <Skeleton className="h-10 w-40" />
        <div className="flex items-start gap-6">
          <Skeleton className="h-40 w-40 rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Playlist not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/library')}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/library')}
          data-testid="button-back-to-library"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
      </div>

      <div className="flex items-start gap-6">
        <div className="relative group">
          <div className="h-40 w-40 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {playlist.coverImageUrl ? (
              <img
                src={playlist.coverImageUrl}
                alt={playlist.name}
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
              {playlist.coverImageUrl ? 'Change Cover' : 'Add Cover'}
            </ObjectUploader>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-[10rem]">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" data-testid="text-playlist-name">{playlist.name}</h1>
            <Badge variant="secondary">
              {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'track' : 'tracks'}
            </Badge>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={handleDeletePlaylist}
            data-testid="button-delete-playlist"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Playlist
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {playlist.tracks && playlist.tracks.length > 0 ? (
          playlist.tracks.map((track, index) => (
            <div key={track.id} className="flex items-center gap-2 group">
              <div className="flex-1">
                <TrackListItem 
                  track={track} 
                  index={index + 1}
                  isLiked={likedTrackIds.has(track.id)}
                  onLike={() => handleLike(track.id)}
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveTrack(track.id)}
                data-testid={`button-remove-track-${track.id}`}
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
            <p className="text-sm mt-1">Add tracks from the browse or search pages</p>
          </div>
        )}
      </div>
    </div>
  );
}
