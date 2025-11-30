import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, MapPin, Users, Zap } from "lucide-react";
import { Link } from "wouter";
import { SupportModal } from "@/components/support-modal";

interface Artist {
  id: string;
  stageName: string;
  bio: string;
  mainGenre: string;
  profileImageUrl: string | null;
  universityName: string;
  trackCount: number;
  streams: number;
  createdAt: string;
}

export default function ArtistBrowse() {
  const { data: allArtists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Sort artists for different categories
  const topArtists = [...allArtists]
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 6);

  const newArtists = [...allArtists]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const upcomingArtists = [...allArtists]
    .sort((a, b) => (b.trackCount || 0) - (a.trackCount || 0))
    .slice(0, 6);

  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <Link href={`/artist/${artist.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer transition-all h-full" data-testid={`card-artist-${artist.id}`}>
        <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          {artist.profileImageUrl ? (
            <img
              src={artist.profileImageUrl}
              alt={artist.stageName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="h-16 w-16 text-slate-500" />
          )}
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-white truncate" data-testid={`text-artist-name-${artist.id}`}>
              {artist.stageName}
            </h3>
            <p className="text-sm text-slate-400 truncate" data-testid={`text-artist-bio-${artist.id}`}>
              {artist.bio || "Student Artist"}
            </p>
          </div>

          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-genre-${artist.id}`}>
              {artist.mainGenre}
            </Badge>

            <div className="flex items-center gap-1 text-xs text-slate-400" data-testid={`text-university-${artist.id}`}>
              <MapPin className="h-3 w-3" />
              <span className="truncate">{artist.universityName}</span>
            </div>

            {artist.trackCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Music className="h-3 w-3" />
                <span>{artist.trackCount} tracks</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-full"
              data-testid={`button-follow-${artist.id}`}
            >
              Follow
            </Button>
            <SupportModal artistId={artist.id} artistName={artist.stageName} artistImageUrl={artist.profileImageUrl} />
          </div>
        </div>
      </Card>
    </Link>
  );

  const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-3 mb-6">
      <Icon className="h-6 w-6 text-primary" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-16">
        {/* Header */}
        <div className="space-y-3" data-testid="section-header">
          <h1 className="text-4xl font-bold text-white">Browse Artists</h1>
          <p className="text-lg text-slate-400">
            Discover talented student musicians from campuses worldwide
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Top Artists Section */}
            {topArtists.length > 0 && (
              <div>
                <SectionHeader title="Top Artists" icon={Zap} />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-testid="grid-top-artists"
                >
                  {topArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </div>
            )}

            {/* New Artists Section */}
            {newArtists.length > 0 && (
              <div>
                <SectionHeader title="New & Emerging" icon={Music} />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-testid="grid-new-artists"
                >
                  {newArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming/Prolific Artists Section */}
            {upcomingArtists.length > 0 && (
              <div>
                <SectionHeader title="Most Prolific" icon={Users} />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-testid="grid-upcoming-artists"
                >
                  {upcomingArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </div>
            )}

            {allArtists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  No artists found yet. Check back soon!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
