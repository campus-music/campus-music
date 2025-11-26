import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import logoUrl from '@assets/campus music logo_1764112870484.png';

const MusicalStaff = () => (
  <svg viewBox="0 0 1200 100" className="w-full h-20" preserveAspectRatio="none">
    {/* Subtle wavy staff lines */}
    {[35, 65].map((baseY) => (
      <path 
        key={`line-${baseY}`}
        d={`M 0 ${baseY}
           Q 75 ${baseY - 8}, 150 ${baseY}
           Q 225 ${baseY + 8}, 300 ${baseY}
           Q 375 ${baseY - 8}, 450 ${baseY}
           Q 525 ${baseY + 8}, 600 ${baseY}
           Q 675 ${baseY - 8}, 750 ${baseY}
           Q 825 ${baseY + 8}, 900 ${baseY}
           Q 975 ${baseY - 8}, 1050 ${baseY}
           Q 1125 ${baseY + 8}, 1200 ${baseY}`}
        stroke="rgba(255,255,255,0.08)" 
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

const MusicalSymbols = () => (
  <div className="flex gap-40 animate-scroll-symbols">
    {/* Eighth note 1 */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="45" r="4.5" fill="rgba(255,255,255,0.7)"/>
      <line x1="14.5" y1="45" x2="14.5" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <path d="M 14.5 15 Q 20 17 20 24" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
    </svg>
    
    {/* Quarter note */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="45" r="5" fill="rgba(255,255,255,0.7)"/>
      <line x1="15" y1="45" x2="15" y2="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
    </svg>

    {/* Half note */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="40" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <line x1="15" y1="40" x2="15" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
    </svg>

    {/* Treble clef */}
    <svg viewBox="0 0 35 80" className="w-6 h-8 flex-shrink-0 opacity-30">
      <circle cx="18" cy="50" r="3" fill="rgba(255,255,255,0.7)"/>
      <circle cx="18" cy="20" r="3" fill="rgba(255,255,255,0.7)"/>
      <path d="M 18 28 Q 12 35 18 42 Q 24 35 18 28" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
    </svg>

    {/* Double eighth notes */}
    <svg viewBox="0 0 45 60" className="w-6 h-8 flex-shrink-0 opacity-30">
      <circle cx="8" cy="45" r="4" fill="rgba(255,255,255,0.7)"/>
      <line x1="12" y1="45" x2="12" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <circle cx="20" cy="42" r="4" fill="rgba(255,255,255,0.7)"/>
      <line x1="24" y1="42" x2="24" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <path d="M 12 18 L 24 15 L 24 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
    </svg>

    {/* Quarter note 2 */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="45" r="5" fill="rgba(255,255,255,0.7)"/>
      <line x1="15" y1="45" x2="15" y2="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
    </svg>

    {/* Whole note */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="40" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
    </svg>

    {/* Eighth note 2 */}
    <svg viewBox="0 0 30 60" className="w-5 h-8 flex-shrink-0 opacity-30">
      <circle cx="10" cy="45" r="4.5" fill="rgba(255,255,255,0.7)"/>
      <line x1="14.5" y1="45" x2="14.5" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <path d="M 14.5 15 Q 20 17 20 24" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
    </svg>
  </div>
);

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col overflow-hidden relative">
      {/* Background - Removed */}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-600/40 flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <img 
            src={logoUrl} 
            alt="Campus Music Logo"
            className="h-8 w-8 object-contain cursor-pointer"
            onClick={() => navigate('/')}
            data-testid="img-header-logo"
          />
          <span className="text-xl font-bold text-white">Campus Music</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/login')}
            data-testid="button-header-login"
            className="text-slate-300 hover:text-white text-xs"
          >
            Log In
          </Button>
          <Button
            size="icon"
            onClick={() => navigate('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
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

      {/* Wavy Notation Separator with Symbols - Bottom */}
      <div className="flex-shrink-0 h-20 relative z-10 bg-gradient-to-t from-slate-900/50 to-transparent overflow-hidden">
        <MusicalStaff />
        <div className="absolute left-0 w-full overflow-hidden pl-20" style={{ top: '50%', transform: 'translateY(-55%)' }}>
          <MusicalSymbols />
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
