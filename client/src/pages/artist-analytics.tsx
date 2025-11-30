import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Music, Play, Heart, Globe } from 'lucide-react';
import type { ArtistProfile } from '@shared/schema';

interface AnalyticsData {
  totalPlays: number;
  totalLikes: number;
  trackCount: number;
  streams: Record<string, number>;
  topTracks: { trackId: string; plays: number }[];
  listenerCountries: Record<string, number>;
}

export default function ArtistAnalytics() {
  const { user } = useAuth();
  const artistId = user?.id;

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user,
  });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/artists', artistId, 'analytics'],
    enabled: !!artistId,
  });

  if (!user || user.role !== 'artist') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You must be an artist to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            {artistProfile?.stageName} - Performance Metrics
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                  <p className="text-3xl font-bold">{analytics.totalPlays.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-3xl font-bold">{analytics.totalLikes.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tracks</p>
                  <p className="text-3xl font-bold">{analytics.trackCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {analytics.topTracks.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Top Tracks Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topTracks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trackId" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="plays" fill="#E84A5F" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {Object.keys(analytics.listenerCountries).length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Listeners by Country</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.listenerCountries).map(([name, value]) => ({
                      name,
                      value,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#E84A5F"
                    dataKey="value"
                  >
                    {Object.entries(analytics.listenerCountries).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#E84A5F', '#D43D50', '#F06575', '#C73045', '#FF7A8A'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          No analytics data available yet
        </div>
      )}
    </div>
  );
}
