import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Headphones, Mic2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [signupType, setSignupType] = useState<'listener' | 'artist' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync activeTab when defaultTab prop changes (e.g., when opening modal)
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    universityName: '',
    country: '',
  });

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({ fullName: '', email: '', password: '', universityName: '', country: '' });
    setSignupType(null);
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForms();
    }
    onOpenChange(newOpen);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      handleOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (signupType === 'artist') {
        if (!signupData.email.endsWith('.edu')) {
          toast({
            title: 'Invalid email',
            description: 'Student artists must use a .edu email address',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }
      
      await signup({ ...signupData, role: signupType === 'artist' ? 'artist' : 'listener' });
      toast({
        title: 'Welcome to Campus Music!',
        description: 'Your account has been created successfully.',
      });
      handleOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Campus Music</DialogTitle>
          <DialogDescription className="text-center">
            Music platform for university students
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'signup'); setSignupType(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Log In</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="input-modal-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  data-testid="input-modal-login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-modal-login"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            {!signupType ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Choose how you want to join</p>
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => setSignupType('listener')}
                    data-testid="card-modal-listener"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Headphones className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold">Listener</h3>
                        <p className="text-xs text-muted-foreground">Any email</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => setSignupType('artist')}
                    data-testid="card-modal-artist"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Mic2 className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold">Artist</h3>
                        <p className="text-xs text-muted-foreground">.edu email</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSignupType(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-modal-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                      data-testid="input-modal-signup-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={signupType === 'artist' ? 'you@university.edu' : 'you@example.com'}
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      data-testid="input-modal-signup-email"
                    />
                    {signupType === 'artist' && (
                      <p className="text-xs text-muted-foreground">Must use a .edu email</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-university">University</Label>
                    <Input
                      id="signup-university"
                      type="text"
                      placeholder="Stanford University"
                      value={signupData.universityName}
                      onChange={(e) => setSignupData({ ...signupData, universityName: e.target.value })}
                      required
                      data-testid="input-modal-signup-university"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-country">Country</Label>
                    <Input
                      id="signup-country"
                      type="text"
                      placeholder="United States"
                      value={signupData.country}
                      onChange={(e) => setSignupData({ ...signupData, country: e.target.value })}
                      required
                      data-testid="input-modal-signup-country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      data-testid="input-modal-signup-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-modal-signup"
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
