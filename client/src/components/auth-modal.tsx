import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Headphones, Mic2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import logoUrl from '@assets/campus music logo_1764112870484.png';

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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent [&>button]:text-white [&>button]:opacity-100 [&>button]:z-50">
        <VisuallyHidden>
          <DialogTitle>{activeTab === 'login' ? 'Log In' : 'Sign Up'}</DialogTitle>
          <DialogDescription>
            {activeTab === 'login' ? 'Log in to your Campus Music account' : 'Create a new Campus Music account'}
          </DialogDescription>
        </VisuallyHidden>
        
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-[#E84A5F]/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E84A5F]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E84A5F]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 p-8 pt-10">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-3 bg-[#E84A5F]/20 rounded-full blur-xl opacity-60" />
                <img 
                  src={logoUrl} 
                  alt="Campus Music" 
                  className="relative h-20 w-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-1">
              {activeTab === 'login' ? 'Welcome back' : 'Join Campus Music'}
            </h2>
            <p className="text-white/60 text-center text-sm mb-6">
              {activeTab === 'login' 
                ? 'Sign in to continue to your music' 
                : 'Discover music from student artists worldwide'}
            </p>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-6">
              <button
                onClick={() => { setActiveTab('login'); setSignupType(null); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'login' 
                    ? 'bg-[#E84A5F] text-white shadow-lg shadow-[#E84A5F]/25' 
                    : 'text-white/60 hover:text-white'
                }`}
                data-testid="tab-login"
              >
                Log In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setSignupType(null); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signup' 
                    ? 'bg-[#E84A5F] text-white shadow-lg shadow-[#E84A5F]/25' 
                    : 'text-white/60 hover:text-white'
                }`}
                data-testid="tab-signup"
              >
                Sign Up
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/80">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                    data-testid="input-modal-login-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/80">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                    data-testid="input-modal-login-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#E84A5F] hover:bg-[#D43D50] text-white h-11 text-base font-semibold shadow-lg shadow-[#E84A5F]/25"
                  disabled={isLoading}
                  data-testid="button-modal-login"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <>
                {!signupType ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white/60 text-center">Choose how you want to join</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Card 
                        className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#E84A5F]/50 cursor-pointer transition-all" 
                        onClick={() => setSignupType('listener')}
                        data-testid="card-modal-listener"
                      >
                        <CardContent className="pt-6 pb-6">
                          <div className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E84A5F]/20">
                              <Headphones className="h-6 w-6 text-[#E84A5F]" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Listener</h3>
                            <p className="text-xs text-white/50">Any email</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#E84A5F]/50 cursor-pointer transition-all" 
                        onClick={() => setSignupType('artist')}
                        data-testid="card-modal-artist"
                      >
                        <CardContent className="pt-6 pb-6">
                          <div className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E84A5F]/20">
                              <Mic2 className="h-6 w-6 text-[#E84A5F]" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Artist</h3>
                            <p className="text-xs text-white/50">.edu email</p>
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
                      className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
                      data-testid="button-modal-back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>

                    <form onSubmit={handleSignup} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white/80">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupData.fullName}
                          onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                          data-testid="input-modal-signup-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white/80">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={signupType === 'artist' ? 'you@university.edu' : 'you@example.com'}
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                          data-testid="input-modal-signup-email"
                        />
                        {signupType === 'artist' && (
                          <p className="text-xs text-[#E84A5F]/80">Must use a .edu email</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-university" className="text-white/80">University</Label>
                        <Input
                          id="signup-university"
                          type="text"
                          placeholder="Stanford University"
                          value={signupData.universityName}
                          onChange={(e) => setSignupData({ ...signupData, universityName: e.target.value })}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                          data-testid="input-modal-signup-university"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-country" className="text-white/80">Country</Label>
                        <Input
                          id="signup-country"
                          type="text"
                          placeholder="United States"
                          value={signupData.country}
                          onChange={(e) => setSignupData({ ...signupData, country: e.target.value })}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                          data-testid="input-modal-signup-country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white/80">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="At least 8 characters"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E84A5F] focus:ring-[#E84A5F]/20"
                          data-testid="input-modal-signup-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-[#E84A5F] hover:bg-[#D43D50] text-white h-11 text-base font-semibold shadow-lg shadow-[#E84A5F]/25"
                        disabled={isLoading}
                        data-testid="button-modal-signup"
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
