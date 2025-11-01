import { useState } from "react";
import { FileText, Plus, Settings, ChevronRight, ClipboardCheck, CheckSquare, Users, CalendarDays, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { UserGroup } from "@shared/schema";

type UserPermission = {
  id: string;
  userId: string;
  feature: string;
  canView: number;
  canCreate: number;
  canEdit: number;
};
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
  
  // Fetch user permissions from database
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery<UserPermission[]>({
    queryKey: [`/api/permissions/user/${user?.id}`],
    enabled: !!user?.id && user?.role !== 'admin',
  });
  
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
  
  // Helper function to check if user has permission to view a feature
  const canView = (feature: string): boolean => {
    // Admins can see everything
    if (user?.role === 'admin') return true;
    
    // Check database permissions
    const permission = permissions?.find(p => p.feature === feature);
    return permission?.canView === 1;
  };

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
          <div className="space-y-6">
            {/* Reports */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Reports</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Daily Training Reports</p>
                  <p>Create and manage daily training reports with three customizable sections: Goal, Training Notes, and Follow-Up. Track which scenes, acts, departments, artists, and locations were involved in each training session.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Training Sessions</p>
                  <p>Add multiple training sessions to each daily report. Assign lead technicians for each department, select multiple locations, and choose which artists participated. Training cards are displayed chronologically and can be clicked to edit. Delete trainings from within the edit modal.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Rich Text Formatting</p>
                  <p>Format your notes with bold, italic, underline, bullet lists, numbered lists, and text alignment. All formatting is preserved when exporting to PDF or sending via email.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">PDF Export</p>
                  <p>Export reports to PDF with custom header and footer branding. The PDF includes your uploaded logos, report date, Stage Manager on duty, and all training sessions with their details. File naming follows the format: ART-SM-TRN La Perle Training Report YYYYMMDD.pdf</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Email Distribution</p>
                  <p>Connect your Outlook account to send reports via email. Configure distribution lists (TO, CC, BCC), customize the subject line and email body. The date in the subject line automatically updates to match the report date.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Report Template</p>
                  <p>Upload custom logos and branding for your report header and footer. This template is applied to all PDF exports automatically.</p>
                </div>
              </div>
            </div>

            {/* Lineups */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Lineups</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Show Lineups</p>
                  <p>View and manage show lineups with show number, date, time, showcaller, and status. Create new lineups or edit existing ones.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Visual Stage Layout</p>
                  <p>Build lineups using a visual stage layout that matches the production format. Positions are organized by scenes and acts: Show Info, Prologue/Desert Flower, City, Spaceship/Tower Bridge, etc.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Artist Assignments</p>
                  <p>Assign artists to stage positions with their roles. Search through the artist roster to quickly find and assign performers. Visual drag-and-drop cues guide you through the assignment process.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">EM Team Management</p>
                  <p>Manage the full EM team roster including DOD, CFW, PWD, SR PWD, CARPS, WARD, RIG, AQX, and SM. Assign locations to each team member for the show.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Show Notes</p>
                  <p>Track OUT artists, add show notes and technical notes. Configure dive heights and other show-specific details all in one place.</p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Schedule</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Full Schedule View</p>
                  <p>See the entire day's schedule at a glance with a timeline from 7:00 AM to 11:45 PM. Activities appear as horizontal blocks showing title, time, location, and participants. Shows, artist calls, rehearsals, fittings, and meetings each have their own color coding.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">By Artist View</p>
                  <p>View the weekly schedule organized by artist. See each artist's individual calls and activities in their own row. Navigate between weeks and select specific days using the tab system.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Activity Management</p>
                  <p>Create and manage different types of activities: Shows, Artist Calls, Rehearsals, Fittings, and Meetings. Each activity shows its time range, location, and which artists or groups are involved.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Schedule Export</p>
                  <p>Export both the full schedule and per-artist views to PDF for distribution or printing.</p>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Attendance</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Artist Sign-In</p>
                  <p>Artists can sign themselves in using a public sign-in page. They select their photo, enter their 4-digit PIN, and the system validates they're at the venue (within 100 meters of La Perle). Artists set their PIN during their first sign-in.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Stage Manager Dashboard</p>
                  <p>Track artist attendance in real-time with the weekly calendar view. See who's signed in, when they arrived, and manually sign out artists when needed. All sign-ins and sign-outs update instantly across all devices.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Tick Sheets</p>
                  <p>Take attendance for meetings and rehearsals using tick sheets. Mark artists as present or absent. All changes sync in real-time so everyone on the team sees the same information.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Artist Status</p>
                  <p>Manage artist status (Active, Out, Long-Term OUT) and upload artist photos for the sign-in page.</p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Settings</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Production Setup</p>
                  <p>Configure scenes, acts, departments, locations, artists, and technicians. Organize locations by type (e.g., Studio, Pool, Backstage) and acts by scene. Drag and drop to reorder artists in your preferred display order.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">User Management</p>
                  <p>Create and manage user accounts for the team. Assign users to groups (Artist, Stage Management, Admin, etc.) which determines their access level. Activate or deactivate user accounts as needed.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">User Groups</p>
                  <p>Create custom user groups to organize your team. Users are displayed grouped by their assigned group for easy management.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Artist Accounts</p>
                  <p>Link user accounts to artist profiles. Only users in the "Artist" group can be linked to artist profiles, preventing accidental misassignment.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Archive & Restore</p>
                  <p>Archive artist profiles and their linked user accounts to remove them from visibility throughout the app while maintaining their data for potential restoration. Archiving is transactional - both the artist and their user account are archived together atomically. View archived artists separately and unarchive when needed.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Access Control</p>
                  <p>Stage managers and admins have full access to all features. Artists have access to sign-in and their personal schedule views. User deletion requires admin password confirmation for security.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Profile Settings</p>
                  <p>Update your name, email, position, and password from your profile page.</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  // Show loading state while fetching permissions
  if (isLoadingGroup || (isLoadingPermissions && user?.role !== 'admin')) {
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
              {/* Reports - only show if user has permission */}
              {canView('reports') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/"} data-testid="nav-reports">
                    <Link href="/" className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      <span>Reports</span>
                      {location === "/" && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Lineups - only show if user has permission */}
              {canView('lineups') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/lineups")} data-testid="nav-lineups">
                    <Link href="/lineups" className="flex items-center gap-3">
                      <Users className="w-4 h-4" />
                      <span>Lineups</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                      {location.startsWith("/lineups") && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Schedule with sub-menu - only show if user has permission */}
              {canView('schedules') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/schedule")} data-testid="nav-schedule">
                    <Link href="/schedule/full" className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4" />
                      <span>Schedule</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
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
              )}

              {/* Attendance - only show if user has permission */}
              {canView('attendance_dashboard') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/attendance")} data-testid="nav-attendance">
                    <Link href="/attendance/dashboard" className="flex items-center gap-3">
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Attendance</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Settings - show if user has any settings permission */}
              {(canView('settings_artists') || canView('settings_departments') || canView('settings_locations') || 
                canView('settings_technicians') || canView('settings_acts') || canView('settings_users') || 
                canView('settings_report_template')) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/settings")} data-testid="nav-settings">
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                      {location.startsWith("/settings") && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
