import { Home, TrendingUp, GraduationCap, Library, User, Search, Sparkles, BarChart3 } from "lucide-react";
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

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "New Releases", url: "/new-releases", icon: TrendingUp },
  { title: "Trending", url: "/trending", icon: TrendingUp },
  { title: "Discover by University", url: "/discover", icon: GraduationCap },
  { title: "Browse Genres", url: "/genres", icon: Sparkles },
];

const discoveryItems = [
  { title: "Recommended For You", url: "/recommendations", icon: Sparkles },
];

const libraryItems = [
  { title: "My Library", url: "/library", icon: Library },
  { title: "Artist Analytics", url: "/artist/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar({ isPublic }: { isPublic?: boolean } = {}) {
  const [location] = useLocation();

  const browseItems = isPublic ? mainNavItems.slice(0, 3) : mainNavItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <Link href={isPublic ? "/browse" : "/"} data-testid="link-home-logo">
          <div className="flex items-center gap-2 cursor-pointer hover-elevate">
            <img 
              src={logoUrl}
              alt="Campus Music"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold">Campus Music</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {browseItems.map((item) => (
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
