import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Heart, Upload, Music } from 'lucide-react';
import type { Track } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { TrackUploader } from '@/components/track-uploader';

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['/api/artist/tracks'],
  });

  const { data: stats } = useQuery<{ totalPlays: number; totalLikes: number; trackCount: number }>({
    queryKey: ['/api/artist/stats'],
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Artist Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your tracks and view your stats
          </p>
        </div>
        <Button size="lg" onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-track">
          <Upload className="h-4 w-4 mr-2" />
          Upload Track
        </Button>
        <TrackUploader open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
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
