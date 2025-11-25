import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Heart, Upload, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Track } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    audioUrl: '',
    coverImageUrl: '',
    durationSeconds: 180,
  });

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['/api/artist/tracks'],
  });

  const { data: stats } = useQuery<{ totalPlays: number; totalLikes: number; trackCount: number }>({
    queryKey: ['/api/artist/stats'],
  });

  const uploadTrackMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/tracks', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artist/tracks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artist/stats'] });
      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        genre: '',
        audioUrl: '',
        coverImageUrl: '',
        durationSeconds: 180,
      });
      toast({ title: 'Track uploaded successfully!' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadTrackMutation.mutateAsync(formData);
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Artist Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your tracks and view your stats
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-upload-track">
              <Upload className="h-4 w-4 mr-2" />
              Upload Track
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Track</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Song name"
                  required
                  data-testid="input-track-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Pop, Hip-Hop, Rock"
                  required
                  data-testid="input-track-genre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about this track..."
                  rows={3}
                  data-testid="input-track-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioUrl">Audio File URL *</Label>
                <Input
                  id="audioUrl"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  placeholder="https://example.com/audio.mp3"
                  required
                  data-testid="input-audio-url"
                />
                <p className="text-xs text-muted-foreground">
                  For demo purposes, use a publicly accessible audio URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  data-testid="input-cover-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) })}
                  min="1"
                  required
                  data-testid="input-track-duration"
                />
              </div>

              <Button type="submit" className="w-full" disabled={uploadTrackMutation.isPending} data-testid="button-submit-track">
                {uploadTrackMutation.isPending ? 'Uploading...' : 'Upload Track'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-plays">
              {stats?.totalPlays || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-likes">
              {stats?.totalLikes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-track-count">
              {stats?.trackCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tracks && tracks.length > 0 ? (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-md hover-elevate"
                  data-testid={`track-item-${track.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.genre}</p>
                  </div>
                  <Badge variant="secondary">{track.universityName}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No tracks uploaded yet. Upload your first track to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
