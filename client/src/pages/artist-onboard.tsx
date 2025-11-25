import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

export default function ArtistOnboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    stageName: '',
    bio: '',
    mainGenre: '',
    socialLinks: '',
  });

  const isEduEmail = user?.email?.endsWith('.edu') || false;

  const createArtistMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isEduEmail) {
        throw new Error('Only .edu email addresses can create artist profiles');
      }
      const res = await apiRequest('POST', '/api/artist', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artist/profile'] });
      toast({ title: 'Artist profile created successfully!' });
      setLocation('/artist/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create artist profile',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEduEmail) {
      toast({
        title: 'Invalid Email',
        description: 'You must have a .edu email address to become an artist on Campus Music',
        variant: 'destructive',
      });
      return;
    }
    await createArtistMutation.mutateAsync(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary rounded-md p-3">
              <Music className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">Become an Artist</span>
          </div>
          <p className="text-muted-foreground">
            Share your music with students around the world
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Artist Profile</CardTitle>
            <CardDescription>
              Tell us about yourself and your music
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEduEmail && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must have a .edu email address to upload music. Your current email is: <strong>{user?.email}</strong>
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stageName">Stage Name *</Label>
                <Input
                  id="stageName"
                  type="text"
                  placeholder="Your artist name"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  required
                  data-testid="input-stage-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainGenre">Main Genre *</Label>
                <Input
                  id="mainGenre"
                  type="text"
                  placeholder="e.g., Pop, Hip-Hop, Rock, Electronic"
                  value={formData.mainGenre}
                  onChange={(e) => setFormData({ ...formData, mainGenre: e.target.value })}
                  required
                  data-testid="input-main-genre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell your story..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  data-testid="input-bio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialLinks">Social Links (optional)</Label>
                <Input
                  id="socialLinks"
                  type="text"
                  placeholder="Instagram, Twitter, SoundCloud links"
                  value={formData.socialLinks}
                  onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                  data-testid="input-social-links"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createArtistMutation.isPending || !isEduEmail}
                  data-testid="button-create-artist-profile"
                >
                  {createArtistMutation.isPending ? 'Creating...' : 'Create Artist Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/profile')}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
