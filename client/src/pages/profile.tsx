import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { ArtistProfile } from '@shared/schema';

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

  const { data: artistProfile } = useQuery<ArtistProfile>({
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

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync(formData);
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
                <div className="space-y-4">
                  <div>
                    <Label>Stage Name</Label>
                    <p className="text-lg font-semibold mt-1">{artistProfile.stageName}</p>
                  </div>
                  <div>
                    <Label>Main Genre</Label>
                    <p className="mt-1">{artistProfile.mainGenre}</p>
                  </div>
                  {artistProfile.bio && (
                    <div>
                      <Label>Bio</Label>
                      <p className="text-sm text-muted-foreground mt-1">{artistProfile.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
