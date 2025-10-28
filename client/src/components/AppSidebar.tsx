import { FileText, Plus, Settings, ChevronRight, ClipboardCheck, CheckSquare, Users, CalendarDays } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { UserGroup } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Fetch user group to determine permissions
  const { data: userGroup, isLoading: isLoadingGroup } = useQuery<UserGroup>({
    queryKey: ["/api/user-groups", user?.userGroupId],
    enabled: !!user?.userGroupId,
    queryFn: async () => {
      const response = await fetch(`/api/user-groups/${user?.userGroupId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user group");
      return response.json();
    },
  });

  // Check if user is an artist (case-insensitive)
  const isArtist = userGroup?.name?.toLowerCase() === "artist";

  // Show loading state while fetching user group to prevent artists from seeing restricted menu
  if (isLoadingGroup) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Loading... */}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Don't show navigation to artists (only Magic Carpet Notes when built)
  if (isArtist) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Artist-specific menu items will go here (Magic Carpet Notes, etc.) */}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Reports */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"} data-testid="nav-reports">
                  <Link href="/" className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <span>Reports</span>
                    {location === "/" && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Lineups */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/lineups")} data-testid="nav-lineups">
                  <Link href="/lineups" className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Lineups</span>
                    {location.startsWith("/lineups") && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Schedule with sub-menu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/schedule")} data-testid="nav-schedule">
                  <Link href="/schedule/full" className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4" />
                    <span>Schedule</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location === "/schedule/full"} data-testid="nav-schedule-full">
                      <Link href="/schedule/full" className="flex items-center gap-3">
                        <span>Full Schedule</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location === "/schedule/artists"} data-testid="nav-schedule-artists">
                      <Link href="/schedule/artists" className="flex items-center gap-3">
                        <span>By Artist</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {/* Attendance with sub-menu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/attendance")} data-testid="nav-attendance">
                  <Link href="/attendance/dashboard" className="flex items-center gap-3">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Attendance</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location === "/attendance/dashboard"} data-testid="nav-attendance-dashboard">
                      <Link href="/attendance/dashboard" className="flex items-center gap-3">
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location === "/attendance/tickoff"} data-testid="nav-attendance-tickoff">
                      <Link href="/attendance/tickoff" className="flex items-center gap-3">
                        <span>Tick Off</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/settings")} data-testid="nav-settings">
                  <Link href="/settings" className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                    {location.startsWith("/settings") && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
