import { Home, TrendingUp, GraduationCap, Library, User, Search, Sparkles, BarChart3, ListMusic, Users, MessageCircle, Newspaper, Radio, PhoneOff, Headphones, Music2, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoUrl from '@assets/campus music logo_1764112870484.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { ArtistProfile } from "@shared/schema";

const browseItems = [
  { title: "Home", url: "/", publicUrl: "/browse", icon: Home },
  { title: "Search", url: "/search", publicUrl: "/search", icon: Search },
  { title: "Trending", url: "/trending", publicUrl: "/all-trending", icon: TrendingUp },
  { title: "Discover by University", url: "/discover", publicUrl: "/discover", icon: GraduationCap },
  { title: "Browse Genres", url: "/genres", publicUrl: "/genres", icon: Sparkles },
];

const libraryItems = [
  { title: "Playlists", url: "/playlists", icon: ListMusic },
  { title: "My Library", url: "/library", icon: Library },
  { title: "Artist Analytics", url: "/artist/analytics", icon: BarChart3 },
];

const artistCollabItems = [
  { title: "Artist Friends", url: "/friends", icon: Users },
  { title: "Artist Messages", url: "/messages", icon: MessageCircle },
];

const socialItems = [
  { title: "Artist Feed", url: "/feed", icon: Newspaper },
  { title: "Live Streams", url: "/live", icon: Radio },
  { title: "Connect", url: "/social", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageCircle },
];

const realConnectionItems = [
  { title: "Phone Down", url: "/phone-down", icon: PhoneOff },
  { title: "Listening Parties", url: "/listening-party", icon: Headphones },
  { title: "Live Concerts", url: "/concerts", publicUrl: "/concerts", icon: Music2 },
];

export function AppSidebar({ isPublic }: { isPublic?: boolean } = {}) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user && user.role === 'artist',
  });

  const profileImageUrl = artistProfile?.profileImageUrl;

  const getUrl = (item: { url: string; publicUrl?: string }) => 
    isPublic && item.publicUrl ? item.publicUrl : item.url;

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href={isPublic ? "/browse" : "/"} data-testid="link-home-logo">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full group-hover:bg-primary/40 transition-all" />
              <img 
                src={logoUrl}
                alt="Campus Music"
                className="h-9 w-9 object-contain relative z-10"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Campus Music
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="pb-24">
        {/* Browse Section - Available to everyone */}
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {browseItems.map((item) => {
                const itemUrl = getUrl(item);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === itemUrl || location === item.url}>
                      <Link href={itemUrl} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sections for logged-in users only */}
        {!isPublic && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Social</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {socialItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || location.startsWith(item.url + '/')}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Real Connection</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {realConnectionItems.map((item) => {
                    const itemUrl = isPublic && 'publicUrl' in item && item.publicUrl ? item.publicUrl : item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === itemUrl || location.startsWith(itemUrl + '/')}>
                          <Link href={itemUrl} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Artist Collaboration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {artistCollabItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || location.startsWith(item.url + '/')}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Library</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {libraryItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* User Footer - Only for logged-in users */}
      {!isPublic && user && (
        <SidebarFooter className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Link href="/profile" data-testid="link-user-avatar">
              <Avatar className="h-10 w-10 cursor-pointer hover-elevate border border-border">
                <AvatarImage src={profileImageUrl || undefined} alt={user.fullName} />
                <AvatarFallback className="bg-primary/20 text-sm font-medium">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              data-testid="button-logout-sidebar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      )}

      {/* Public Footer - Login prompt */}
      {isPublic && (
        <SidebarFooter className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation('/login')}
              data-testid="button-login-sidebar"
            >
              Log In
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setLocation('/signup')}
              data-testid="button-signup-sidebar"
            >
              Sign Up
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
