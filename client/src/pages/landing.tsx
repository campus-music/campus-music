import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import logoUrl from '@assets/campus music logo_1764112870484.png';

export default function Landing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src={logoUrl} 
            alt="Campus Music Logo"
            className="h-10 w-10 object-contain"
            data-testid="img-header-logo"
          />
          <span className="text-xl font-bold text-gray-900">Campus Music</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/login')}
            data-testid="button-header-login"
            className="bg-transparent hover:bg-[#E84A5F] text-gray-700 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-[#E84A5F] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
          >
            Log In
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-transparent hover:bg-[#E84A5F] text-gray-700 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-[#E84A5F] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
            data-testid="button-header-signup"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="text-center flex flex-col items-center -translate-y-24">
          {/* Logo */}
          <img 
            src={logoUrl} 
            alt="Campus Music" 
            className="h-[28rem] w-[28rem] object-contain"
            data-testid="img-landing-logo"
          />

          {/* Title and Description */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 -mt-32">
            Campus Music
          </h1>
          
          <p className="text-base text-gray-500 mt-3 text-center">
            <span className="block">Discover incredible music from student artists across campuses. Support the</span>
            <span className="block">next generation of creators.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-4 items-center mt-4">
            <Button
              onClick={() => navigate('/browse')}
              className="bg-transparent hover:bg-[#E84A5F] text-gray-700 hover:text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 border border-gray-300 hover:border-[#E84A5F] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
              data-testid="button-start-listening"
            >
              Start Listening
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate('/artist-browse')}
              className="bg-transparent hover:bg-[#E84A5F] text-gray-700 hover:text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 border border-gray-300 hover:border-[#E84A5F] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
              data-testid="button-browse-artists"
            >
              Browse Artists
            </Button>
          </div>
        </div>
      </div>

      {/* Features Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 py-4 px-6">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">Discover Music</h3>
            <p className="text-xs text-gray-500">
              Browse student artists
            </p>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">Support Artists</h3>
            <p className="text-xs text-gray-500">
              Reach their audience
            </p>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">Share & Connect</h3>
            <p className="text-xs text-gray-500">
              Create playlists
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
