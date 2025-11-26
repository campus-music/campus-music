import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AudioPlayer } from "@/components/audio-player";
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
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isPublic={isPublic} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {isPublic && !user && (
              <div className="flex items-center gap-3 ml-auto">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  data-testid="button-header-login"
                  size="sm"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  size="sm"
                  className="rounded-full"
                  data-testid="button-header-signup"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AudioPlayer />
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
      
      <Route path="/search">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Search />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/new-releases">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <NewReleases />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/trending">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Trending />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route path="/discover">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Discover />
            </AppLayout>
          )} />
        )}
      </Route>
      
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

      <Route path="/genres">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <Genres />
            </AppLayout>
          )} />
        )}
      </Route>

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

      <Route path="/artist/:id">
        {() => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <ArtistDetail />
            </AppLayout>
          )} />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AudioPlayerProvider>
            <Router />
          </AudioPlayerProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
