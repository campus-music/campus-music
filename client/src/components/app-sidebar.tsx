import { Home, TrendingUp, GraduationCap, Library, Search, Sparkles, BarChart3, ListMusic, Users, MessageCircle, Newspaper, Radio, PhoneOff, Headphones, Music2 } from "lucide-react";
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
  { title: "Campuses", url: "/discover", publicUrl: "/discover", icon: GraduationCap },
  { title: "Trending", url: "/trending", publicUrl: "/all-trending", icon: TrendingUp },
  { title: "Genres", url: "/genres", publicUrl: "/genres", icon: Sparkles },
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
  const { user } = useAuth();

  // Fetch artist profile to get profile image for artists
  const { data: artistProfile } = useQuery<ArtistProfile | null>({
    queryKey: ['/api/artist/profile'],
    queryFn: async () => {
      const response = await fetch('/api/artist/profile');
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return response.json();
    },
    enabled: user?.role === 'artist',
  });

  const getUrl = (item: { url: string; publicUrl?: string }) => 
    isPublic && item.publicUrl ? item.publicUrl : item.url;

  // Get profile image - prefer artist profile image, fallback to user profile image
  const profileImageUrl = artistProfile?.profileImageUrl || user?.profileImageUrl;

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
        <SidebarFooter className="p-4 pb-20 border-t border-border">
          <Link href="/profile" data-testid="link-user-profile" className="block">
            <div className="flex items-center gap-3 hover-elevate rounded-lg p-2 -m-2 cursor-pointer">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profileImageUrl || undefined} alt={user.fullName} />
                <AvatarFallback className="bg-primary/20 text-sm font-medium">
                  {user.fullName?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </Link>
        </SidebarFooter>
      )}

      {/* Public Footer - Login prompt */}
      {isPublic && (
        <SidebarFooter className="p-4 pb-20 border-t border-border">
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
