import { useState } from "react";
import { FileText, Plus, Settings, ChevronRight, ClipboardCheck, CheckSquare, Users, CalendarDays, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { UserGroup } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [changelogOpen, setChangelogOpen] = useState(false);
  
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

  // Render version footer (shared across all states)
  const versionFooter = (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => setChangelogOpen(true)} data-testid="button-version">
            <Info className="w-4 h-4" />
            <span className="text-muted-foreground">Version 1.00</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );

  // Render changelog modal (shared across all states)
  const changelogModal = (
    <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">La Perle Borealis - Version 1.00</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-8rem)] pr-4">
          <div className="space-y-8">
            {/* Major Updates */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">Major Features</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium">Authentication & User Management</h4>
                  <p className="text-sm text-muted-foreground">Secure login/signup system with scrypt password hashing, session-based authentication, and role-based access control. Full user management with user groups, active/inactive status, and admin-protected deletion.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Training Reports System</h4>
                  <p className="text-sm text-muted-foreground">Create daily training reports with rich text notes (Goal, Training Notes, Follow-Up sections), track trainings by act, department, artist, location. Supports multi-location assignments, custom training names, and chronological list display with click-to-edit cards.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Settings Management</h4>
                  <p className="text-sm text-muted-foreground">Full CRUD operations for scenes, acts, departments, locations, artists, and technicians. Hierarchical organization with parent-child relationships. Drag-and-drop artist ordering with persistent sort order.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Report Template System</h4>
                  <p className="text-sm text-muted-foreground">Global header/footer template with image upload support for professional PDF exports with custom branding.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">PDF Export & Email Distribution</h4>
                  <p className="text-sm text-muted-foreground">Export reports to PDF with custom header including logos, title, date, and Stage Manager. Outlook integration with configurable email templates, TO/CC/BCC distribution lists, and customizable subject/body with date variables.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Show Lineup Management</h4>
                  <p className="text-sm text-muted-foreground">Visual stage layout builder with position assignments matching production format. Organize by scenes/acts (Prologue/Desert Flower, City, Spaceship/Tower Bridge). Manage EM team roster (DOD, CFW, PWD, SR PWD, CARPS, WARD, RIG, AQX, SM) with location assignments. Display OUT artists, show notes, technical notes, and dive heights. Drag-and-drop visual cues with searchable artist roster.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Schedule Management</h4>
                  <p className="text-sm text-muted-foreground">Full timeline-based daily schedule showing activities as horizontal blocks across time slots (7:00 AM - 11:45 PM). Per-artist weekly grid view with individual calls organized by artist rows. Support for Shows, Artist Calls, Rehearsals, Fittings, Meetings with color-coded distinction. Week navigation, day tabs, and PDF export for both views.</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Attendance System</h4>
                  <p className="text-sm text-muted-foreground">Public artist sign-in page with photo grid, 4-digit PIN, and server-side geofencing validation (100-meter radius from La Perle venue). Stage Manager dashboard with real-time tracking, weekly calendar, and manual sign-out. Tick sheets for meeting attendance with real-time updates via WebSocket. Artist photo URLs, status management (Active, Out, Long-Term OUT), and PIN setup during first sign-in.</p>
                </div>
              </div>
            </div>

            {/* Minor Updates */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">Minor Updates & Enhancements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Two-layer XSS protection with Tiptap escaping and DOMPurify sanitization for rich text notes</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Lead technician assignment per department for each training session</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Audit trail tracking (createdBy, updatedBy, timestamps) for all reports and trainings</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">One report per day enforcement with automatic reuse or creation</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Real-time WebSocket synchronization for attendance sign-in/sign-out and tick sheet updates</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Mobile-first responsive design with full mobile support for training reports, modals, and schedules</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Linear-inspired professional dark mode UI with Inter/JetBrains Mono fonts and cyan accent colors</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Hierarchical dropdowns for scene/act selection and multi-select locations in training modal</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Training cards with responsive layout - 3-column grid on desktop, single-column on mobile</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Chronological sorting of training sessions by start time, then end time</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Professional date formatting (e.g., "Wednesday, October 25, 2025") throughout the application</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Timezone-safe date parsing to prevent off-by-one day errors in non-UTC timezones</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Artist account linking restricted to users in "Artist" user group only</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Role-based sidebar navigation - artists see empty sidebar (reserved for Magic Carpet Notes), stage managers and admins see full navigation</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Toast notifications for all user actions (create, update, delete) with success and error states</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Training cards click-to-edit functionality with delete moved to modal footer</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">Schedule grid uses 15-minute base units (40px per slot) for precise activity positioning with hour/half-hour labels for readability</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">User deletion requires admin password confirmation and prevents deletion of users who have created/modified reports</p>
                </div>
              </div>
            </div>

            {/* Technical Stack */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">Technical Stack</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Frontend:</strong> React, Vite, Wouter, TanStack Query, shadcn/ui, Tiptap</p>
                <p><strong>Backend:</strong> Express.js, Drizzle ORM, Passport.js, scrypt</p>
                <p><strong>Database:</strong> PostgreSQL with session store</p>
                <p><strong>Real-time:</strong> WebSocket server for live attendance and tick sheet updates</p>
                <p><strong>Security:</strong> XSS protection with DOMPurify, role-based middleware authorization</p>
                <p><strong>Email:</strong> Microsoft Graph API via Replit Outlook connector</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  // Show loading state while fetching user group to prevent artists from seeing restricted menu
  if (isLoadingGroup) {
    return (
      <>
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
          {versionFooter}
        </Sidebar>
        {changelogModal}
      </>
    );
  }

  // Don't show navigation to artists (only Magic Carpet Notes when built)
  if (isArtist) {
    return (
      <>
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
          {versionFooter}
        </Sidebar>
        {changelogModal}
      </>
    );
  }

  return (
    <>
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
      {versionFooter}
    </Sidebar>
    {changelogModal}
  </>
  );
}
