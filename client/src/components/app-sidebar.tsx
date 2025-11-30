import { Home, TrendingUp, GraduationCap, Library, User, Search, Sparkles, BarChart3, ListMusic, Users, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";

const browseItems = [
  { title: "Home", url: "/", publicUrl: "/browse", icon: Home },
  { title: "Search", url: "/search", publicUrl: "/search", icon: Search },
  { title: "Trending", url: "/trending", publicUrl: "/all-trending", icon: TrendingUp },
  { title: "Discover by University", url: "/discover", publicUrl: "/discover", icon: GraduationCap },
  { title: "Browse Genres", url: "/genres", publicUrl: "/genres", icon: Sparkles },
];

const discoveryItems = [
  { title: "Recommended For You", url: "/recommendations", icon: Sparkles },
];

const libraryItems = [
  { title: "Playlists", url: "/playlists", icon: ListMusic },
  { title: "My Library", url: "/library", icon: Library },
  { title: "Artist Analytics", url: "/artist/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

const artistCollabItems = [
  { title: "Artist Friends", url: "/friends", icon: Users },
  { title: "Artist Messages", url: "/messages", icon: MessageCircle },
];

const socialItems = [
  { title: "Connect", url: "/social", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageCircle },
];

export function AppSidebar({ isPublic }: { isPublic?: boolean } = {}) {
  const [location] = useLocation();

  const getUrl = (item: { url: string; publicUrl?: string }) => 
    isPublic && item.publicUrl ? item.publicUrl : item.url;

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
      <SidebarContent>
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

        {/* Discovery & Library Sections - Only for logged-in users */}
        {!isPublic && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Discovery</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {discoveryItems.map((item) => (
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
    </Sidebar>
  );
}
