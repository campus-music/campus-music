import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import logoUrl from '@assets/campus music logo_1764112870484.png';

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <img 
            src={logoUrl} 
            alt="Campus Music Logo"
            className="h-8 w-8 object-contain"
            data-testid="img-header-logo"
          />
          <span className="text-xl font-bold text-white">Campus Music</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            data-testid="button-header-login"
            className="text-slate-300 hover:text-white"
          >
            Log In
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            data-testid="button-header-signup"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 text-center space-y-12">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={logoUrl} 
              alt="Campus Music" 
              className="h-48 w-48 object-contain"
              data-testid="img-landing-logo"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Campus Music
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300">
              Discover incredible music from student artists across campuses. Support the next generation of creators.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate('/browse')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold text-lg"
              data-testid="button-start-listening"
            >
              Start Listening
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/browse')}
              className="border-slate-500 text-white hover:bg-slate-800 px-8 py-3 rounded-full font-semibold text-lg"
              data-testid="button-browse-artists"
            >
              Browse Artists
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl">🎵</div>
              <h3 className="font-semibold text-white">Discover Music</h3>
              <p className="text-sm text-slate-400">
                Browse tracks from talented student artists worldwide
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">👥</div>
              <h3 className="font-semibold text-white">Support Artists</h3>
              <p className="text-sm text-slate-400">
                Help the next generation of musicians reach their audience
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🎧</div>
              <h3 className="font-semibold text-white">Share & Connect</h3>
              <p className="text-sm text-slate-400">
                Create playlists, share tracks, and connect with artists
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
