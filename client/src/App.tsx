import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "@/pages/not-found";

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
    return <Redirect to="/login" />;
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

function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
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
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/signup" component={() => <PublicRoute component={Signup} />} />
      
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
