import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import logoUrl from '@assets/campus music logo_1764112870484.png';
import notationUrl from '@assets/musical notations symbols_1764118955236.png';

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col overflow-hidden relative">
      {/* Floating Musical Notation Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top line flowing right to left */}
        <div className="absolute top-20 w-full h-24 overflow-hidden">
          <img 
            src={notationUrl}
            alt="Musical notations"
            className="h-full w-96 object-cover opacity-20 animate-scroll-left"
          />
        </div>
        {/* Middle line flowing right to left with delay */}
        <div className="absolute top-1/3 w-full h-20 overflow-hidden">
          <img 
            src={notationUrl}
            alt="Musical notations"
            className="h-full w-96 object-cover opacity-15 animate-scroll-left-delayed"
          />
        </div>
        {/* Bottom line flowing right to left */}
        <div className="absolute top-1/2 w-full h-24 overflow-hidden">
          <img 
            src={notationUrl}
            alt="Musical notations"
            className="h-full w-96 object-cover opacity-20 animate-scroll-left"
          />
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0 relative z-10">
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
            className="text-slate-300 hover:text-white text-sm"
          >
            Log In
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm"
            data-testid="button-header-signup"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative z-20">
        <div className="w-full px-6 text-center flex flex-col items-center justify-center">
          {/* Logo */}
          <div className="flex justify-center flex-shrink-0 mb-4">
            <img 
              src={logoUrl} 
              alt="Campus Music" 
              className="h-32 w-32 object-contain"
              data-testid="img-landing-logo"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-3 max-w-2xl flex-shrink-0">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Campus Music
            </h1>
            
            <p className="text-sm md:text-base text-slate-400">
              Discover incredible music from student artists across campuses. Support the next generation of creators.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center flex-shrink-0 mt-6">
            <Button
              size="sm"
              onClick={() => navigate('/browse')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold text-sm"
              data-testid="button-start-listening"
            >
              Start Listening
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/artist-browse')}
              className="border-slate-500 text-white hover:bg-slate-800 px-6 py-2 rounded-full font-semibold text-sm"
              data-testid="button-browse-artists"
            >
              Browse Artists
            </Button>
          </div>
        </div>
      </div>

      {/* Features Footer */}
      <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/50 py-3 px-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          <div className="text-center space-y-0.5">
            <div className="text-sm">🎵</div>
            <h3 className="text-2xs font-semibold text-white">Discover Music</h3>
            <p className="text-2xs text-slate-400 line-clamp-1">
              Browse student artists
            </p>
          </div>

          <div className="text-center space-y-0.5">
            <div className="text-sm">👥</div>
            <h3 className="text-2xs font-semibold text-white">Support Artists</h3>
            <p className="text-2xs text-slate-400 line-clamp-1">
              Reach their audience
            </p>
          </div>

          <div className="text-center space-y-0.5">
            <div className="text-sm">🎧</div>
            <h3 className="text-2xs font-semibold text-white">Share & Connect</h3>
            <p className="text-2xs text-slate-400 line-clamp-1">
              Create playlists
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
