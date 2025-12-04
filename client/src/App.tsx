import { useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import type { ArtistProfile } from "@shared/schema";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { AuthModal } from "@/components/auth-modal";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import NewReleases from "@/pages/new-releases";
import Trending from "@/pages/trending";
import Discover from "@/pages/discover";
import Library from "@/pages/library";
import Profile from "@/pages/profile";
import ArtistOnboard from "@/pages/artist-onboard";
import ArtistDashboard from "@/pages/artist-dashboard";
import Search from "@/pages/search";
import Genres from "@/pages/genres";
import Recommendations from "@/pages/recommendations";
import ArtistAnalytics from "@/pages/artist-analytics";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ArtistBrowse from "@/pages/artist-browse";
import ArtistDetail from "@/pages/artist-detail";
import Playlists from "@/pages/playlists";
import PlaylistDetail from "@/pages/playlist-detail";
import AllTrending from "@/pages/all-trending";
import AllReleases from "@/pages/all-releases";
import AllArtists from "@/pages/all-artists";
import BestOfCampus from "@/pages/best-of-campus";
import ArtistFriends from "@/pages/artist-friends";
import ArtistMessages from "@/pages/artist-messages";
import Social from "@/pages/social";
import Chat from "@/pages/chat";
import Feed from "@/pages/feed";
import Live from "@/pages/live";
import LiveStream from "@/pages/live-stream";
import PhoneDown from "@/pages/phone-down";
import ListeningParty from "@/pages/listening-party";
import Concerts from "@/pages/concerts";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/landing" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function AppLayout({ children, isPublic }: { children: React.ReactNode; isPublic?: boolean }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user && user.role === 'artist',
  });

  const openLogin = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profileImageUrl = artistProfile?.profileImageUrl;

  const showPublicSidebar = isPublic && !user;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isPublic={showPublicSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3 ml-auto">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 hover-elevate rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid="user-avatar-header"
                  aria-label={`View profile for ${user.fullName}`}
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={profileImageUrl || undefined} alt={user.fullName} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:block">{user.fullName}</span>
                </button>
              ) : isPublic ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={openLogin}
                    data-testid="button-header-login"
                    size="sm"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={openSignup}
                    size="sm"
                    className="rounded-full"
                    data-testid="button-header-signup"
                  >
                    Sign Up
                  </Button>
                </>
              ) : null}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AudioPlayer />
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/signup" component={() => <PublicRoute component={Signup} />} />
      <Route path="/browse" component={() => (
        <AppLayout isPublic>
          <Home />
        </AppLayout>
      )} />
      
      <Route path="/artist-browse" component={() => (
        <AppLayout isPublic>
          <ArtistBrowse />
        </AppLayout>
      )} />
      
      <Route path="/">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Home />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/search" component={() => (
        <AppLayout isPublic>
          <Search />
        </AppLayout>
      )} />
      
      <Route path="/new-releases" component={() => (
        <AppLayout isPublic>
          <NewReleases />
        </AppLayout>
      )} />
      
      <Route path="/trending" component={() => (
        <AppLayout isPublic>
          <Trending />
        </AppLayout>
      )} />
      
      <Route path="/discover" component={() => (
        <AppLayout isPublic>
          <Discover />
        </AppLayout>
      )} />
      
      <Route path="/library">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Library />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/playlists">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Playlists />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/playlist/:id">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <PlaylistDetail />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/profile">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Profile />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/artist/onboard">
        {() => <ProtectedRoute component={ArtistOnboard} />}
      </Route>
      
      <Route path="/artist/dashboard">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistDashboard />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/genres" component={() => (
        <AppLayout isPublic>
          <Genres />
        </AppLayout>
      )} />

      <Route path="/recommendations">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Recommendations />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/artist/analytics">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistAnalytics />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/artist/:id" component={() => (
        <AppLayout isPublic>
          <ArtistDetail />
        </AppLayout>
      )} />

      <Route path="/all-trending" component={() => (
        <AppLayout isPublic>
          <AllTrending />
        </AppLayout>
      )} />

      <Route path="/all-releases" component={() => (
        <AppLayout isPublic>
          <AllReleases />
        </AppLayout>
      )} />

      <Route path="/all-artists" component={() => (
        <AppLayout isPublic>
          <AllArtists />
        </AppLayout>
      )} />

      <Route path="/best-of-campus" component={() => (
        <AppLayout isPublic>
          <BestOfCampus />
        </AppLayout>
      )} />

      <Route path="/friends">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistFriends />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/messages">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistMessages />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/messages/:connectionId">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistMessages />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/social">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Social />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/chat">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Chat />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/chat/:connectionId">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Chat />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/feed">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Feed />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/live">
        {() => (
          <AppLayout>
            <Live />
          </AppLayout>
        )}
      </Route>

      <Route path="/live/:streamId">
        {() => (
          <AppLayout>
            <LiveStream />
          </AppLayout>
        )}
      </Route>

      <Route path="/phone-down">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <PhoneDown />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/listening-party">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ListeningParty />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/listening-party/:id">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ListeningParty />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/concerts">
        {() => (
          <AppLayout>
            <Concerts />
          </AppLayout>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              <Router />
            </AudioPlayerProvider>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
