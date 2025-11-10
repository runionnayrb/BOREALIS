import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { userRoles, pageNames } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Shield, Zap, Users, Lock, ToggleLeft, UserCog } from "lucide-react";
import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  userGroupId: string | null;
};

type UserGroup = {
  id: string;
  name: string;
  sortOrder: number;
};

type UserPermission = {
  id: string;
  userId: string;
  feature: string;
  canView: number;
  canCreate: number;
  canEdit: number;
};

type SystemSetting = {
  id: string;
  settingKey: string;
  settingValue: string;
  category: string;
  description: string | null;
};

type RolePageAccess = {
  id: string;
  role: string;
  page: string;
  canAccess: number;
};

const PAGES = [...pageNames];

const PAGE_LABELS: Record<string, string> = {
  'admin': 'Admin Dashboard',
  'reports': 'Reports',
  'attendance_dashboard': 'Attendance Dashboard',
  'attendance_ticksheet': 'Tick Sheet',
  'lineups': 'Lineups',
  'lineups_training_programs': 'Training Programs',
  'lineups_competencies': 'Competencies',
  'lineups_positions': 'Positions',
  'lineups_rules': 'Rules & Automation',
  'lineups_restrictions': 'Restrictions',
  'schedule_full': 'Full Schedule',
  'schedule_weekly': 'Weekly Schedule',
  'settings': 'Settings',
  'profile': 'Profile',
};

const ROLES = [...userRoles];

const ROLE_LABELS: Record<string, string> = {
  'admin': 'Admin',
  'stage_management': 'Stage Management',
  'technical': 'Technical',
  'coaching': 'Coaching',
  'performance_wellness': 'Performance Wellness',
  'read_only': 'Read Only',
  'artist': 'Artist',
};

const FEATURES = [
  'reports',
  'schedules',
  'lineups',
  'lineups_training_programs',
  'lineups_competencies',
  'attendance_dashboard',
  'attendance_ticksheet',
  'attendance_signin',
  'settings_artists',
  'settings_technicians',
  'settings_departments',
  'settings_locations',
  'settings_acts',
  'settings_users',
  'settings_report_template',
] as const;

const FEATURE_LABELS: Record<string, string> = {
  'reports': 'Reports',
  'schedules': 'Schedules',
  'lineups': 'Lineups',
  'lineups_training_programs': 'Training Programs',
  'lineups_competencies': 'Competencies',
  'attendance_dashboard': 'Attendance',
  'attendance_ticksheet': 'Tick Sheet',
  'attendance_signin': 'Sign-In',
  'settings_artists': 'Artists',
  'settings_technicians': 'Technicians',
  'settings_departments': 'Departments',
  'settings_locations': 'Locations',
  'settings_acts': 'Acts',
  'settings_users': 'Users',
  'settings_report_template': 'Report Template',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: string; userName: string; currentRole: string } | null>(null);
  const [roleAccessModalOpen, setRoleAccessModalOpen] = useState(false);
  const [savingRoleAccess, setSavingRoleAccess] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: userGroups, isLoading: userGroupsLoading } = useQuery<UserGroup[]>({
    queryKey: ['/api/user-groups'],
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery<UserPermission[]>({
    queryKey: ['/api/permissions'],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/settings'],
  });

  const { data: rolePageAccess, isLoading: rolePageAccessLoading } = useQuery<RolePageAccess[]>({
    queryKey: ['/api/role-page-access'],
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions: perms }: { userId: string; permissions: Array<{ feature: string; canView: number; canCreate: number; canEdit: number }> }) => {
      return await apiRequest('POST', `/api/permissions/bulk/${userId}`, { permissions: perms });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      setSavingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
      setSavingUser(null);
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, settingValue }: { id: string; settingValue: string }) => {
      return await apiRequest('PATCH', `/api/settings/${id}`, { settingValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest('PATCH', `/api/users/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      setUpdatingRoleUserId(null);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update user role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setUpdatingRoleUserId(null);
    },
  });

  const updateRolePageAccessMutation = useMutation({
    mutationFn: async ({ role, pages }: { role: string; pages: Array<{ page: string; canAccess: number }> }) => {
      return await apiRequest('POST', `/api/role-page-access/bulk/${role}`, { pages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/role-page-access'] });
      toast({
        title: "Success",
        description: "Role page access updated successfully",
      });
      setSavingRoleAccess(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role page access",
        variant: "destructive",
      });
      setSavingRoleAccess(null);
    },
  });

  const getPermissionLevel = (userId: string, feature: string): 'none' | 'view' | 'edit' | 'create' => {
    const perm = permissions?.find(p => p.userId === userId && p.feature === feature);
    if (!perm) return 'none';
    
    if (perm.canCreate === 1) return 'create';
    if (perm.canEdit === 1) return 'edit';
    if (perm.canView === 1) return 'view';
    return 'none';
  };

  const handlePermissionLevelChange = async (userId: string, feature: string, level: string) => {
    if (!permissions) return;

    setSavingUser(userId);

    let canView = 0;
    let canEdit = 0;
    let canCreate = 0;

    if (level === 'view') {
      canView = 1;
    } else if (level === 'edit') {
      canView = 1;
      canEdit = 1;
    } else if (level === 'create') {
      canView = 1;
      canEdit = 1;
      canCreate = 1;
    }

    const userPermissions = FEATURES.map(feat => {
      const existing = permissions.find(p => p.userId === userId && p.feature === feat);
      if (feat === feature) {
        return {
          feature: feat,
          canView,
          canCreate,
          canEdit,
        };
      }
      return {
        feature: feat,
        canView: existing?.canView || 0,
        canCreate: existing?.canCreate || 0,
        canEdit: existing?.canEdit || 0,
      };
    });

    await updatePermissionsMutation.mutateAsync({ userId, permissions: userPermissions });
  };

  const handleSettingChange = (id: string, value: string) => {
    updateSettingMutation.mutate({ id, settingValue: value });
  };

  const getSettingValue = (key: string) => {
    return settings?.find(s => s.settingKey === key)?.settingValue || '';
  };

  const getSettingId = (key: string) => {
    return settings?.find(s => s.settingKey === key)?.id || '';
  };

  const getRolePageAccess = (role: string, page: string): boolean => {
    const access = rolePageAccess?.find(a => a.role === role && a.page === page);
    return access ? access.canAccess === 1 : true; // Default to true if not set
  };

  const handleRolePageAccessChange = async (role: string, page: string, canAccess: boolean) => {
    if (!rolePageAccess) return;

    setSavingRoleAccess(role);

    const rolePages = PAGES.map(p => {
      if (p === page) {
        return { page: p, canAccess: canAccess ? 1 : 0 };
      }
      const existing = rolePageAccess.find(a => a.role === role && a.page === p);
      return { page: p, canAccess: existing?.canAccess ?? 1 };
    });

    await updateRolePageAccessMutation.mutateAsync({ role, pages: rolePages });
  };

  // Group users by user group
  const groupedUsers = users?.reduce((acc, user) => {
    const groupId = user.userGroupId || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(user);
    return acc;
  }, {} as Record<string, User[]>) || {};

  // Sort groups by sortOrder
  const sortedGroupIds = Object.keys(groupedUsers).sort((a, b) => {
    if (a === 'ungrouped') return 1;
    if (b === 'ungrouped') return -1;
    const groupA = userGroups?.find(g => g.id === a);
    const groupB = userGroups?.find(g => g.id === b);
    return (groupA?.sortOrder || 0) - (groupB?.sortOrder || 0);
  });

  if (usersLoading || permissionsLoading || settingsLoading || userGroupsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage permissions, system settings, and performance configurations
          </p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="permissions" data-testid="tab-permissions">
              <Users className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="roles" data-testid="tab-roles">
              <UserCog className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">
              <Settings className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">
              <ToggleLeft className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission</CardTitle>
                <CardDescription>
                  Select a permission level for each feature. Create = full access, Edit = can view and edit, View = read-only. Unchecked permissions hide features from the sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold sticky left-0 bg-card z-10">User</th>
                        {FEATURES.map(feature => (
                          <th key={feature} className="text-center p-3 font-semibold min-w-[120px]">
                            <div className="text-xs">{FEATURE_LABELS[feature]}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupIds.flatMap(groupId => {
                        const group = userGroups?.find(g => g.id === groupId);
                        const groupUsers = groupedUsers[groupId] || [];
                        const groupName = group?.name || 'No Group';
                        
                        return [
                          /* Group header row */
                          <tr key={`group-${groupId}`} className="bg-muted/50">
                            <td colSpan={FEATURES.length + 1} className="p-2 px-3">
                              <span className="font-semibold text-sm">{groupName}</span>
                            </td>
                          </tr>,
                          /* Users in this group */
                          ...groupUsers.map(u => (
                            <tr key={u.id} className="border-b hover-elevate" data-testid={`permission-row-${u.id}`}>
                              <td className="p-3 sticky left-0 bg-card z-10">
                                <div className="flex flex-col min-w-[150px]">
                                  <span className="font-medium text-sm">{u.name}</span>
                                  <span className="text-xs text-muted-foreground capitalize">{u.role.replace(/_/g, ' ')}</span>
                                </div>
                              </td>
                              {FEATURES.map(feature => {
                                const level = getPermissionLevel(u.id, feature);
                                
                                return (
                                  <td key={feature} className="p-3 text-center">
                                    <Select
                                      value={level}
                                      onValueChange={(value) => handlePermissionLevelChange(u.id, feature, value)}
                                      disabled={savingUser === u.id}
                                    >
                                      <SelectTrigger 
                                        className="w-full text-xs h-8"
                                        data-testid={`select-permission-${u.id}-${feature}`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="view">View</SelectItem>
                                        <SelectItem value="edit">Edit</SelectItem>
                                        <SelectItem value="create">Create</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        ];
                      })}
                    </tbody>
                  </table>
                  {savingUser && (
                    <div className="flex items-center justify-center mt-4 gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving permissions...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Roles</CardTitle>
                    <CardDescription>
                      Assign roles to users. Admin users have full system access and can sign off on any training step.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setRoleAccessModalOpen(true)} 
                    data-testid="button-role-permissions"
                  >
                    Role Permissions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">User</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold min-w-[200px]">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupIds.flatMap(groupId => {
                        const group = userGroups?.find(g => g.id === groupId);
                        const groupUsers = groupedUsers[groupId] || [];
                        const groupName = group?.name || 'No Group';
                        
                        return [
                          <tr key={`group-${groupId}`} className="bg-muted/50">
                            <td colSpan={3} className="p-2 px-3">
                              <span className="font-semibold text-sm">{groupName}</span>
                            </td>
                          </tr>,
                          ...groupUsers.map(u => {
                            const isCurrentUser = u.id === user?.id;
                            const isProtectedAccount = u.email === 'bryan.runion@laperle.com';
                            const isUpdating = updatingRoleUserId === u.id;
                            
                            return (
                              <tr key={u.id} className="border-b hover-elevate" data-testid={`role-row-${u.id}`}>
                                <td className="p-3">
                                  <span className="font-medium text-sm">{u.name}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-sm text-muted-foreground">{u.email}</span>
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={u.role}
                                    onValueChange={(newRole) => {
                                      if (newRole !== u.role) {
                                        setPendingRoleChange({
                                          userId: u.id,
                                          newRole,
                                          userName: u.name,
                                          currentRole: u.role,
                                        });
                                      }
                                    }}
                                    disabled={isUpdating || (isCurrentUser && u.role === 'admin')}
                                  >
                                    <SelectTrigger 
                                      className="w-full"
                                      data-testid={`select-role-${u.id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="stage_management">Stage Management</SelectItem>
                                      <SelectItem value="technical">Technical</SelectItem>
                                      <SelectItem value="coaching">Coaching</SelectItem>
                                      <SelectItem value="performance_wellness">Performance Wellness</SelectItem>
                                      <SelectItem value="read_only">Read Only</SelectItem>
                                      <SelectItem value="artist">Artist</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {isCurrentUser && u.role === 'admin' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Cannot remove your own admin access
                                    </p>
                                  )}
                                  {isProtectedAccount && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Protected account
                                    </p>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ];
                      })}
                    </tbody>
                  </table>
                  {updatingRoleUserId && (
                    <div className="flex items-center justify-center mt-4 gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating role...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Geofencing</CardTitle>
                  <CardDescription>Control attendance check-in location restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="geofence-radius">Geofence Radius (meters)</Label>
                    <Input
                      id="geofence-radius"
                      type="number"
                      value={getSettingValue('geofence_radius_meters')}
                      onChange={(e) => handleSettingChange(getSettingId('geofence_radius_meters'), e.target.value)}
                      data-testid="input-geofence-radius"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-lat">Venue Latitude</Label>
                    <Input
                      id="venue-lat"
                      value={getSettingValue('geofence_latitude')}
                      onChange={(e) => handleSettingChange(getSettingId('geofence_latitude'), e.target.value)}
                      data-testid="input-venue-lat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-lng">Venue Longitude</Label>
                    <Input
                      id="venue-lng"
                      value={getSettingValue('geofence_longitude')}
                      onChange={(e) => handleSettingChange(getSettingId('geofence_longitude'), e.target.value)}
                      data-testid="input-venue-lng"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PDF Settings</CardTitle>
                  <CardDescription>Configure PDF export settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdf-page-format">PDF Page Format</Label>
                    <Input
                      id="pdf-page-format"
                      value={getSettingValue('pdf_page_format')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_page_format'), e.target.value)}
                      placeholder="A4, Letter, etc."
                      data-testid="input-pdf-page-format"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-margin-top">Top Margin</Label>
                    <Input
                      id="pdf-margin-top"
                      value={getSettingValue('pdf_margin_top')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_margin_top'), e.target.value)}
                      placeholder="20mm"
                      data-testid="input-pdf-margin-top"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-margin-bottom">Bottom Margin</Label>
                    <Input
                      id="pdf-margin-bottom"
                      value={getSettingValue('pdf_margin_bottom')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_margin_bottom'), e.target.value)}
                      placeholder="20mm"
                      data-testid="input-pdf-margin-bottom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-margin-left">Left Margin</Label>
                    <Input
                      id="pdf-margin-left"
                      value={getSettingValue('pdf_margin_left')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_margin_left'), e.target.value)}
                      placeholder="15mm"
                      data-testid="input-pdf-margin-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-margin-right">Right Margin</Label>
                    <Input
                      id="pdf-margin-right"
                      value={getSettingValue('pdf_margin_right')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_margin_right'), e.target.value)}
                      placeholder="15mm"
                      data-testid="input-pdf-margin-right"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Upload</CardTitle>
                  <CardDescription>Configure file upload limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      value={getSettingValue('max_file_size_mb')}
                      onChange={(e) => handleSettingChange(getSettingId('max_file_size_mb'), e.target.value)}
                      data-testid="input-max-file-size"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pagination</CardTitle>
                  <CardDescription>Default pagination settings for list views</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pagination-limit">Default Items Per Page</Label>
                    <Input
                      id="pagination-limit"
                      type="number"
                      value={getSettingValue('pagination_default_limit')}
                      onChange={(e) => handleSettingChange(getSettingId('pagination_default_limit'), e.target.value)}
                      data-testid="input-pagination-limit"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Views</CardTitle>
                  <CardDescription>Default date range filters for different features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reports-default-view">Reports Default View</Label>
                    <Input
                      id="reports-default-view"
                      value={getSettingValue('reports_default_view')}
                      onChange={(e) => handleSettingChange(getSettingId('reports_default_view'), e.target.value)}
                      placeholder="current_month, current_week, all"
                      data-testid="input-reports-default-view"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendance-default-view">Attendance Default View</Label>
                    <Input
                      id="attendance-default-view"
                      value={getSettingValue('attendance_default_view')}
                      onChange={(e) => handleSettingChange(getSettingId('attendance_default_view'), e.target.value)}
                      placeholder="current_week, current_month, all"
                      data-testid="input-attendance-default-view"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Settings</CardTitle>
                  <CardDescription>Configure data caching for performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
                    <Input
                      id="cache-ttl"
                      type="number"
                      value={getSettingValue('cache_ttl_seconds')}
                      onChange={(e) => handleSettingChange(getSettingId('cache_ttl_seconds'), e.target.value)}
                      data-testid="input-cache-ttl"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Archive Settings</CardTitle>
                  <CardDescription>Automatic archiving thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="archive-threshold">Archive After (days)</Label>
                    <Input
                      id="archive-threshold"
                      type="number"
                      value={getSettingValue('archive_threshold_days')}
                      onChange={(e) => handleSettingChange(getSettingId('archive_threshold_days'), e.target.value)}
                      data-testid="input-archive-threshold"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Enable or disable application features globally</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-geofencing">Geofencing Required</Label>
                      <p className="text-xs text-muted-foreground">Require location verification for attendance</p>
                    </div>
                    <Checkbox
                      id="enable-geofencing"
                      checked={getSettingValue('feature_geofencing_required') === 'true'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_geofencing_required'), checked ? 'true' : 'false')}
                      data-testid="checkbox-enable-geofencing"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-email">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Send email notifications for reports</p>
                    </div>
                    <Checkbox
                      id="enable-email"
                      checked={getSettingValue('feature_email_enabled') === 'true'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_email_enabled'), checked ? 'true' : 'false')}
                      data-testid="checkbox-enable-email"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-geofence">Geofence Enabled</Label>
                      <p className="text-xs text-muted-foreground">Enable/disable geofence validation globally</p>
                    </div>
                    <Checkbox
                      id="enable-geofence"
                      checked={getSettingValue('geofence_enabled') === 'true'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('geofence_enabled'), checked ? 'true' : 'false')}
                      data-testid="checkbox-enable-geofence"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and file upload limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="security-max-file-size">Max File Size (MB)</Label>
                    <Input
                      id="security-max-file-size"
                      type="number"
                      value={getSettingValue('max_file_size_mb')}
                      onChange={(e) => handleSettingChange(getSettingId('max_file_size_mb'), e.target.value)}
                      data-testid="input-security-max-file-size"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security & Performance</CardTitle>
                <CardDescription>Additional cache and performance settings are configured in the Performance tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Security settings like password policies and session timeouts can be configured here in future releases.
                  Currently, the system uses default secure settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!pendingRoleChange} onOpenChange={(open) => !open && setPendingRoleChange(null)}>
          <AlertDialogContent data-testid="dialog-confirm-role-change">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
              <AlertDialogDescription>
                Changing <strong>{pendingRoleChange?.userName}</strong>'s role from{' '}
                <strong>{pendingRoleChange?.currentRole.replace(/_/g, ' ')}</strong> to{' '}
                <strong>{pendingRoleChange?.newRole.replace(/_/g, ' ')}</strong> will automatically reset all their permissions to the default permissions for the new role.
                <br /><br />
                Any custom permissions you've set for this user will be replaced. You can manually adjust individual permissions afterward in the Permissions tab if needed.
                <br /><br />
                Do you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                data-testid="button-cancel-role-change"
                disabled={updateUserRoleMutation.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-role-change"
                disabled={updateUserRoleMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (pendingRoleChange) {
                    setUpdatingRoleUserId(pendingRoleChange.userId);
                    updateUserRoleMutation.mutate(
                      { userId: pendingRoleChange.userId, role: pendingRoleChange.newRole },
                      {
                        onSettled: () => {
                          setPendingRoleChange(null);
                          queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
                        }
                      }
                    );
                  }
                }}
              >
                {updateUserRoleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Continue'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={roleAccessModalOpen} onOpenChange={setRoleAccessModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="dialog-role-permissions">
            <DialogHeader>
              <DialogTitle>Role Permissions</DialogTitle>
              <DialogDescription>
                Control which pages each role can access. Checked pages are accessible to that role.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold sticky left-0 bg-card z-10">Role</th>
                    {PAGES.map(page => (
                      <th key={page} className="text-center p-3 font-semibold min-w-[100px]">
                        <div className="text-xs">{PAGE_LABELS[page]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(role => (
                    <tr key={role} className="border-b hover-elevate" data-testid={`role-permissions-row-${role}`}>
                      <td className="p-3 sticky left-0 bg-card z-10">
                        <div className="flex flex-col min-w-[150px]">
                          <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
                        </div>
                      </td>
                      {PAGES.map(page => (
                        <td key={page} className="p-3 text-center">
                          <Checkbox
                            checked={getRolePageAccess(role, page)}
                            onCheckedChange={(checked) => handleRolePageAccessChange(role, page, checked as boolean)}
                            disabled={savingRoleAccess === role}
                            data-testid={`checkbox-access-${role}-${page}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {savingRoleAccess && (
                <div className="flex items-center justify-center mt-4 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving permissions...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
