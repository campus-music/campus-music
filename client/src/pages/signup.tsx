import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Headphones, Mic2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoUrl from '@assets/campus music logo_1764112870484.png';

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [signupType, setSignupType] = useState<'listener' | 'artist' | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    universityName: '',
    country: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (signupType === 'artist') {
        if (!formData.email.endsWith('.edu')) {
          toast({
            title: 'Invalid email',
            description: 'Student artists must use a .edu email address',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }
      
      await signup({ ...formData, role: signupType === 'artist' ? 'artist' : 'listener' });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up type selection screen
  if (!signupType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <img 
                src={logoUrl} 
                alt="Campus Music Logo"
                className="h-8 w-8 object-contain"
                data-testid="img-signup-choice-logo"
              />
              <span className="text-3xl font-bold">Campus Music</span>
            </div>
            <p className="text-muted-foreground text-lg">Choose how you want to join</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Listener Option */}
            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setSignupType('listener')} data-testid="card-signup-listener">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Headphones className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">I'm a Listener</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Discover and listen to music from student artists worldwide. Use any email.
                    </p>
                  </div>
                  <Button className="w-full rounded-full" data-testid="button-select-listener">
                    Continue as Listener
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Artist Option */}
            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setSignupType('artist')} data-testid="card-signup-artist">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Mic2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">I'm a Student Artist</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your music and reach the campus community. Requires .edu email.
                    </p>
                  </div>
                  <Button className="w-full rounded-full" data-testid="button-select-artist">
                    Continue as Artist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              onClick={() => setLocation('/login')}
              className="text-primary hover:underline cursor-pointer"
              data-testid="link-login"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign up form screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <img 
              src={logoUrl} 
              alt="Campus Music Logo"
              className="h-8 w-8 object-contain"
              data-testid="img-signup-form-logo"
            />
            <span className="text-3xl font-bold">Campus Music</span>
          </div>
          <p className="text-muted-foreground">
            {signupType === 'artist' ? 'Create artist account' : 'Create listener account'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              {signupType === 'artist'
                ? 'Join as a student artist and upload your music'
                : 'Join the campus music community as a listener'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  data-testid="input-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={signupType === 'artist' ? 'you@university.edu' : 'you@example.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground">
                  {signupType === 'artist'
                    ? 'Must use a .edu email for verification'
                    : 'Use any email to listen and enjoy music'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name</Label>
                <Input
                  id="universityName"
                  type="text"
                  placeholder="Stanford University"
                  value={formData.universityName}
                  onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                  required
                  data-testid="input-university"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  data-testid="input-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-signup"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setSignupType(null)}
              data-testid="button-back-to-choice"
            >
              Back to options
            </Button>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                onClick={() => setLocation('/login')}
                className="text-primary hover:underline cursor-pointer"
                data-testid="link-login"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
