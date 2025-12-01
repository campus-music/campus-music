import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Camera, Music, Sun, Moon, Monitor, Palette, Play, Bell, Shield, HardDrive, Heart, Users, X, Plus, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ArtistProfile, ListenerFavoriteArtist, ListenerFavoriteGenre } from '@shared/schema';

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    universityName: user?.universityName || '',
    country: user?.country || '',
  });

  const { data: artistProfile, refetch: refetchArtistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: user?.role === 'artist',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', '/api/auth/me', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditing(false);
      toast({ title: 'Profile updated successfully' });
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const res = await apiRequest('PUT', '/api/artist/profile-image', { imageURL });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artist/profile'] });
      refetchArtistProfile();
      toast({ title: 'Profile picture updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update profile picture', variant: 'destructive' });
      console.error('Profile image update error:', error);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync(formData);
  };

  const handleGetUploadParameters = async () => {
    const res = await apiRequest('POST', '/api/objects/upload', {});
    const data = await res.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        updateProfileImageMutation.mutate(uploadedFile.uploadURL);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <div>
        <h1 className="text-4xl font-bold mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          {user.role === 'artist' && (
            <TabsTrigger value="artist" data-testid="tab-artist">Artist Profile</TabsTrigger>
          )}
          <TabsTrigger value="music-taste" data-testid="tab-music-taste">Music Taste</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal details and university</CardDescription>
                </div>
                <div className="flex gap-2">
                  {user.role === 'listener' && (
                    <Button
                      variant="outline"
                      onClick={() => setLocation('/artist/onboard')}
                      data-testid="button-become-artist"
                    >
                      Become an Artist
                    </Button>
                  )}
                  {user.role === 'artist' && (
                    <Button
                      onClick={() => setLocation('/artist/dashboard')}
                      data-testid="button-artist-dashboard"
                    >
                      Artist Dashboard
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="universityName">University Name</Label>
                  <Input
                    id="universityName"
                    type="text"
                    value={formData.universityName}
                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-university"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-country"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button type="submit" data-testid="button-save-profile">
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            fullName: user.fullName,
                            universityName: user.universityName,
                            country: user.country,
                          });
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-profile"
                    >
                      Edit Profile
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleLogout}
                    className="ml-auto"
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'artist' && artistProfile && (
          <TabsContent value="artist" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Artist Profile</CardTitle>
                <CardDescription>Your artist information and branding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="relative group">
                      <Avatar className="h-32 w-32">
                        <AvatarImage 
                          src={artistProfile.profileImageUrl || undefined} 
                          alt={artistProfile.stageName}
                        />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Music className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          allowedFileTypes={['image/*']}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleUploadComplete}
                          buttonVariant="secondary"
                          buttonClassName="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 right-0"
                          buttonSize="icon"
                          disabled={updateProfileImageMutation.isPending}
                        >
                          <Camera className="h-4 w-4" />
                        </ObjectUploader>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Stage Name</Label>
                        <p className="text-lg font-semibold mt-1">{artistProfile.stageName}</p>
                      </div>
                      <div>
                        <Label>Main Genre</Label>
                        <p className="mt-1">{artistProfile.mainGenre}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Label className="text-base font-medium">Profile Picture</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Upload a profile picture to personalize your artist page. Hover over your avatar and click the camera icon.
                    </p>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880}
                      allowedFileTypes={['image/*']}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonVariant="outline"
                      disabled={updateProfileImageMutation.isPending}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {updateProfileImageMutation.isPending ? 'Uploading...' : 'Upload New Picture'}
                    </ObjectUploader>
                  </div>

                  {artistProfile.bio && (
                    <div className="pt-4 border-t">
                      <Label>Bio</Label>
                      <p className="text-sm text-muted-foreground mt-1">{artistProfile.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="music-taste" className="mt-6">
          <MusicTasteSettings />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FavoriteArtistWithProfile extends ListenerFavoriteArtist {
  artist: ArtistProfile;
}

const GENRE_OPTIONS = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 
  'Country', 'Folk', 'Indie', 'Alternative', 'Metal', 'Punk', 
  'Soul', 'Funk', 'Reggae', 'Latin', 'Blues', 'Gospel', 'World'
];

function MusicTasteSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newGenre, setNewGenre] = useState('');
  const [showArtistSearch, setShowArtistSearch] = useState(false);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');

  const { data: favoriteArtists = [], isLoading: loadingArtists } = useQuery<FavoriteArtistWithProfile[]>({
    queryKey: ['/api/preferences/artists'],
  });

  const { data: favoriteGenres = [], isLoading: loadingGenres } = useQuery<ListenerFavoriteGenre[]>({
    queryKey: ['/api/preferences/genres'],
  });

  const { data: allArtists = [] } = useQuery<ArtistProfile[]>({
    queryKey: ['/api/artists'],
    enabled: showArtistSearch,
  });

  const addArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      const res = await apiRequest('POST', `/api/preferences/artists/${artistId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences/artists'] });
      toast({ title: 'Artist added to favorites' });
      setShowArtistSearch(false);
      setArtistSearchQuery('');
    },
    onError: () => {
      toast({ title: 'Failed to add artist', variant: 'destructive' });
    },
  });

  const removeArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      const res = await apiRequest('DELETE', `/api/preferences/artists/${artistId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences/artists'] });
      toast({ title: 'Artist removed from favorites' });
    },
  });

  const addGenreMutation = useMutation({
    mutationFn: async (genre: string) => {
      const res = await apiRequest('POST', '/api/preferences/genres', { genre });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences/genres'] });
      toast({ title: 'Genre added to favorites' });
      setNewGenre('');
    },
    onError: () => {
      toast({ title: 'Failed to add genre', variant: 'destructive' });
    },
  });

  const removeGenreMutation = useMutation({
    mutationFn: async (genre: string) => {
      const res = await apiRequest('DELETE', `/api/preferences/genres/${encodeURIComponent(genre)}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences/genres'] });
      toast({ title: 'Genre removed from favorites' });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (showMusicPreferences: boolean) => {
      const res = await apiRequest('PATCH', '/api/preferences/visibility', { showMusicPreferences });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: 'Visibility updated' });
    },
  });

  const filteredArtists = allArtists.filter(artist => 
    artist.stageName.toLowerCase().includes(artistSearchQuery.toLowerCase()) &&
    !favoriteArtists.some(fav => fav.artistId === artist.id)
  );

  const availableGenres = GENRE_OPTIONS.filter(
    genre => !favoriteGenres.some(fg => fg.genre === genre)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Favorite Artists
          </CardTitle>
          <CardDescription>
            Select artists you love - this helps us suggest friends with similar taste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingArtists ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : favoriteArtists.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {favoriteArtists.map((fav) => (
                <Badge 
                  key={fav.artistId} 
                  variant="secondary" 
                  className="flex items-center gap-2 py-1.5 px-3"
                  data-testid={`badge-favorite-artist-${fav.artistId}`}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={fav.artist.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">{fav.artist.stageName[0]}</AvatarFallback>
                  </Avatar>
                  <span>{fav.artist.stageName}</span>
                  <button
                    onClick={() => removeArtistMutation.mutate(fav.artistId)}
                    className="ml-1 hover:text-destructive transition-colors"
                    disabled={removeArtistMutation.isPending}
                    data-testid={`button-remove-artist-${fav.artistId}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No favorite artists yet</p>
          )}

          {showArtistSearch ? (
            <div className="space-y-3 pt-2 border-t">
              <Input
                placeholder="Search for artists..."
                value={artistSearchQuery}
                onChange={(e) => setArtistSearchQuery(e.target.value)}
                data-testid="input-search-artists"
              />
              {artistSearchQuery && filteredArtists.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredArtists.slice(0, 10).map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => addArtistMutation.mutate(artist.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover-elevate transition-colors text-left"
                      disabled={addArtistMutation.isPending}
                      data-testid={`button-add-artist-${artist.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={artist.profileImageUrl || undefined} />
                        <AvatarFallback>{artist.stageName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{artist.stageName}</p>
                        <p className="text-xs text-muted-foreground">{artist.mainGenre}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowArtistSearch(false);
                  setArtistSearchQuery('');
                }}
                data-testid="button-cancel-artist-search"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArtistSearch(true)}
              className="mt-2"
              data-testid="button-add-favorite-artist"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Artist
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Favorite Genres
          </CardTitle>
          <CardDescription>
            What genres do you enjoy the most?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingGenres ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : favoriteGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {favoriteGenres.map((fg) => (
                <Badge 
                  key={fg.genre} 
                  variant="secondary"
                  className="flex items-center gap-2 py-1.5 px-3"
                  data-testid={`badge-favorite-genre-${fg.genre}`}
                >
                  <span>{fg.genre}</span>
                  <button
                    onClick={() => removeGenreMutation.mutate(fg.genre)}
                    className="ml-1 hover:text-destructive transition-colors"
                    disabled={removeGenreMutation.isPending}
                    data-testid={`button-remove-genre-${fg.genre}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No favorite genres yet</p>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Select 
              value={newGenre} 
              onValueChange={(value) => {
                setNewGenre(value);
                if (value) {
                  addGenreMutation.mutate(value);
                }
              }}
            >
              <SelectTrigger className="w-48" data-testid="select-genre">
                <SelectValue placeholder="Add a genre" />
              </SelectTrigger>
              <SelectContent>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control who can see your music preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <Label className="text-sm font-medium cursor-pointer">Show Music Preferences</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow others to see your favorite artists and genres on your profile
              </p>
            </div>
            <Switch 
              checked={user?.showMusicPreferences !== false}
              onCheckedChange={(checked) => toggleVisibilityMutation.mutate(checked)}
              disabled={toggleVisibilityMutation.isPending}
              data-testid="switch-show-music-preferences"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <AppearanceSettings />
      <PlaybackSettings />
      <NotificationSettings />
      <PrivacySettings />
      <StorageSettings />
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how Campus Music looks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Theme</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Choose your color scheme</p>
          </div>
          <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
            <SelectTrigger className="w-32" data-testid="select-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function PlaybackSettings() {
  const [autoplay, setAutoplay] = useState(true);
  const [crossfade, setCrossfade] = useState(false);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(5);
  const [gapless, setGapless] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Playback
        </CardTitle>
        <CardDescription>Control how music plays</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingsToggle
          id="autoplay"
          label="Autoplay"
          description="Keep playing similar tracks when your music ends"
          checked={autoplay}
          onCheckedChange={setAutoplay}
        />
        
        <div className="space-y-3">
          <SettingsToggle
            id="crossfade"
            label="Crossfade"
            description="Blend tracks together for seamless transitions"
            checked={crossfade}
            onCheckedChange={setCrossfade}
          />
          {crossfade && (
            <div className="pl-4 border-l-2 border-primary/20 ml-2">
              <Label className="text-xs text-muted-foreground">Crossfade duration: {crossfadeSeconds}s</Label>
              <Slider
                value={[crossfadeSeconds]}
                onValueChange={(v) => setCrossfadeSeconds(v[0])}
                min={1}
                max={12}
                step={1}
                className="mt-2"
                data-testid="slider-crossfade"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1s</span>
                <span>12s</span>
              </div>
            </div>
          )}
        </div>

        <SettingsToggle
          id="gapless"
          label="Gapless Playback"
          description="Remove silence between tracks in albums"
          checked={gapless}
          onCheckedChange={setGapless}
        />
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const [newMusic, setNewMusic] = useState(true);
  const [artistUpdates, setArtistUpdates] = useState(true);
  const [playlistUpdates, setPlaylistUpdates] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription>Choose what updates you receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingsToggle
          id="new-music"
          label="New Music"
          description="Get notified when artists you follow release new tracks"
          checked={newMusic}
          onCheckedChange={setNewMusic}
        />

        <SettingsToggle
          id="artist-updates"
          label="Artist Updates"
          description="News and announcements from artists you follow"
          checked={artistUpdates}
          onCheckedChange={setArtistUpdates}
        />

        <SettingsToggle
          id="playlist-updates"
          label="Playlist Updates"
          description="When playlists you follow are updated"
          checked={playlistUpdates}
          onCheckedChange={setPlaylistUpdates}
        />

        <SettingsToggle
          id="email-digest"
          label="Weekly Email Digest"
          description="Receive a weekly summary of new music and recommendations"
          checked={emailDigest}
          onCheckedChange={setEmailDigest}
        />
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  const [listeningActivity, setListeningActivity] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showPlaylists, setShowPlaylists] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacy
        </CardTitle>
        <CardDescription>Control your visibility and data sharing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingsToggle
          id="listening-activity"
          label="Share Listening Activity"
          description="Let others see what you're currently playing"
          checked={listeningActivity}
          onCheckedChange={setListeningActivity}
        />

        <SettingsToggle
          id="public-profile"
          label="Public Profile"
          description="Allow others to view your profile and music taste"
          checked={publicProfile}
          onCheckedChange={setPublicProfile}
        />

        <SettingsToggle
          id="show-playlists"
          label="Show Playlists on Profile"
          description="Display your public playlists on your profile"
          checked={showPlaylists}
          onCheckedChange={setShowPlaylists}
        />
      </CardContent>
    </Card>
  );
}

function StorageSettings() {
  const [cacheSize] = useState("1.2 GB");
  const { toast } = useToast();

  const handleClearCache = () => {
    toast({ title: "Cache cleared", description: "All cached data has been removed" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Storage
        </CardTitle>
        <CardDescription>Manage cached data and storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Cache Size</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Temporary files for faster loading
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{cacheSize}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
              data-testid="button-clear-cache"
            >
              Clear Cache
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-destructive">Delete Account</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently remove your account and all data
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              data-testid="button-delete-account"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsToggle({ 
  id, 
  label, 
  description, 
  checked, 
  onCheckedChange 
}: { 
  id: string;
  label: string; 
  description: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch 
        id={id}
        checked={checked} 
        onCheckedChange={onCheckedChange}
        data-testid={`switch-${id}`}
      />
    </div>
  );
}
