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
import { Camera, Music } from 'lucide-react';
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
      </Tabs>
    </div>
  );
}
