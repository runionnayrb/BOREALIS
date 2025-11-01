import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Shield, Zap, Users, Lock, ToggleLeft } from "lucide-react";
import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
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

const FEATURES = [
  'reports',
  'schedules',
  'lineups',
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

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery<UserPermission[]>({
    queryKey: ['/api/permissions'],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/settings'],
  });

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

  const getUserPermission = (userId: string, feature: string, type: 'canView' | 'canCreate' | 'canEdit') => {
    const perm = permissions?.find(p => p.userId === userId && p.feature === feature);
    return perm ? perm[type] === 1 : false;
  };

  const handlePermissionToggle = async (userId: string, feature: string, type: 'canView' | 'canCreate' | 'canEdit', checked: boolean) => {
    if (!permissions) return;

    setSavingUser(userId);

    const userPermissions = FEATURES.map(feat => {
      const existing = permissions.find(p => p.userId === userId && p.feature === feat);
      if (feat === feature) {
        return {
          feature: feat,
          canView: type === 'canView' ? (checked ? 1 : 0) : (existing?.canView || 0),
          canCreate: type === 'canCreate' ? (checked ? 1 : 0) : (existing?.canCreate || 0),
          canEdit: type === 'canEdit' ? (checked ? 1 : 0) : (existing?.canEdit || 0),
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

  if (usersLoading || permissionsLoading || settingsLoading) {
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="permissions" data-testid="tab-permissions">
              <Users className="w-4 h-4 mr-2" />
              Permissions
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
                  Control what each user can view, create, and edit. Unchecked permissions hide features from the sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold sticky left-0 bg-card z-10">User</th>
                        <th className="text-center p-3 font-semibold sticky left-[150px] bg-card z-10 min-w-[80px]">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span>V</span>
                            <span>C</span>
                            <span>E</span>
                          </div>
                        </th>
                        {FEATURES.map(feature => (
                          <th key={feature} className="text-center p-3 font-semibold min-w-[100px]">
                            <div className="text-xs">{FEATURE_LABELS[feature]}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map(u => (
                        <tr key={u.id} className="border-b hover-elevate" data-testid={`permission-row-${u.id}`}>
                          <td className="p-3 sticky left-0 bg-card z-10">
                            <div className="flex flex-col min-w-[150px]">
                              <span className="font-medium text-sm">{u.name}</span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                              <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                            </div>
                          </td>
                          <td className="p-3 sticky left-[150px] bg-card z-10">
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <span>View</span>
                              <span>Create</span>
                              <span>Edit</span>
                            </div>
                          </td>
                          {FEATURES.map(feature => (
                            <td key={feature} className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={getUserPermission(u.id, feature, 'canView')}
                                  onCheckedChange={(checked) => handlePermissionToggle(u.id, feature, 'canView', checked as boolean)}
                                  disabled={savingUser === u.id}
                                  data-testid={`checkbox-${u.id}-${feature}-view`}
                                  className="w-3 h-3"
                                />
                                <Checkbox
                                  checked={getUserPermission(u.id, feature, 'canCreate')}
                                  onCheckedChange={(checked) => handlePermissionToggle(u.id, feature, 'canCreate', checked as boolean)}
                                  disabled={savingUser === u.id}
                                  data-testid={`checkbox-${u.id}-${feature}-create`}
                                  className="w-3 h-3"
                                />
                                <Checkbox
                                  checked={getUserPermission(u.id, feature, 'canEdit')}
                                  onCheckedChange={(checked) => handlePermissionToggle(u.id, feature, 'canEdit', checked as boolean)}
                                  disabled={savingUser === u.id}
                                  data-testid={`checkbox-${u.id}-${feature}-edit`}
                                  className="w-3 h-3"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
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
                      value={getSettingValue('venue_latitude')}
                      onChange={(e) => handleSettingChange(getSettingId('venue_latitude'), e.target.value)}
                      data-testid="input-venue-lat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-lng">Venue Longitude</Label>
                    <Input
                      id="venue-lng"
                      value={getSettingValue('venue_longitude')}
                      onChange={(e) => handleSettingChange(getSettingId('venue_longitude'), e.target.value)}
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
                    <Label htmlFor="pdf-margin">PDF Margin (mm)</Label>
                    <Input
                      id="pdf-margin"
                      type="number"
                      value={getSettingValue('pdf_margin_mm')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_margin_mm'), e.target.value)}
                      data-testid="input-pdf-margin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-page-size">PDF Page Size</Label>
                    <Input
                      id="pdf-page-size"
                      value={getSettingValue('pdf_page_size')}
                      onChange={(e) => handleSettingChange(getSettingId('pdf_page_size'), e.target.value)}
                      data-testid="input-pdf-page-size"
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
                  <div className="space-y-2">
                    <Label htmlFor="allowed-types">Allowed File Types</Label>
                    <Input
                      id="allowed-types"
                      value={getSettingValue('allowed_file_types')}
                      onChange={(e) => handleSettingChange(getSettingId('allowed_file_types'), e.target.value)}
                      placeholder="image/jpeg,image/png,application/pdf"
                      data-testid="input-allowed-types"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Configure email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-template">Email Template</Label>
                    <Textarea
                      id="email-template"
                      value={getSettingValue('email_template_default')}
                      onChange={(e) => handleSettingChange(getSettingId('email_template_default'), e.target.value)}
                      placeholder="Email template content..."
                      rows={4}
                      data-testid="input-email-template"
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
                    <Label htmlFor="reports-per-page">Reports Per Page</Label>
                    <Input
                      id="reports-per-page"
                      type="number"
                      value={getSettingValue('pagination_reports_per_page')}
                      onChange={(e) => handleSettingChange(getSettingId('pagination_reports_per_page'), e.target.value)}
                      data-testid="input-reports-per-page"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artists-per-page">Artists Per Page</Label>
                    <Input
                      id="artists-per-page"
                      type="number"
                      value={getSettingValue('pagination_artists_per_page')}
                      onChange={(e) => handleSettingChange(getSettingId('pagination_artists_per_page'), e.target.value)}
                      data-testid="input-artists-per-page"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Date Ranges</CardTitle>
                  <CardDescription>Default date range filters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reports-default-range">Reports Default Range (days)</Label>
                    <Input
                      id="reports-default-range"
                      type="number"
                      value={getSettingValue('default_reports_date_range_days')}
                      onChange={(e) => handleSettingChange(getSettingId('default_reports_date_range_days'), e.target.value)}
                      data-testid="input-reports-date-range"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendance-default-range">Attendance Default Range (days)</Label>
                    <Input
                      id="attendance-default-range"
                      type="number"
                      value={getSettingValue('default_attendance_date_range_days')}
                      onChange={(e) => handleSettingChange(getSettingId('default_attendance_date_range_days'), e.target.value)}
                      data-testid="input-attendance-date-range"
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

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password Policies</CardTitle>
                <CardDescription>Configure password requirements and security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-password-length">Minimum Password Length</Label>
                  <Input
                    id="min-password-length"
                    type="number"
                    value={getSettingValue('password_min_length')}
                    onChange={(e) => handleSettingChange(getSettingId('password_min_length'), e.target.value)}
                    data-testid="input-password-min-length"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    value={getSettingValue('password_expiry_days')}
                    onChange={(e) => handleSettingChange(getSettingId('password_expiry_days'), e.target.value)}
                    data-testid="input-password-expiry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={getSettingValue('session_timeout_minutes')}
                    onChange={(e) => handleSettingChange(getSettingId('session_timeout_minutes'), e.target.value)}
                    data-testid="input-session-timeout"
                  />
                </div>
              </CardContent>
            </Card>
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
                      <Label htmlFor="enable-geofencing">Geofencing</Label>
                      <p className="text-xs text-muted-foreground">Require location verification for attendance</p>
                    </div>
                    <Checkbox
                      id="enable-geofencing"
                      checked={getSettingValue('feature_enable_geofencing') === '1'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_enable_geofencing'), checked ? '1' : '0')}
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
                      checked={getSettingValue('feature_enable_email_notifications') === '1'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_enable_email_notifications'), checked ? '1' : '0')}
                      data-testid="checkbox-enable-email"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-pdf">PDF Export</Label>
                      <p className="text-xs text-muted-foreground">Allow exporting reports to PDF</p>
                    </div>
                    <Checkbox
                      id="enable-pdf"
                      checked={getSettingValue('feature_enable_pdf_export') === '1'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_enable_pdf_export'), checked ? '1' : '0')}
                      data-testid="checkbox-enable-pdf"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>Control application availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
                    </div>
                    <Checkbox
                      id="maintenance-mode"
                      checked={getSettingValue('feature_maintenance_mode') === '1'}
                      onCheckedChange={(checked) => handleSettingChange(getSettingId('feature_maintenance_mode'), checked ? '1' : '0')}
                      data-testid="checkbox-maintenance-mode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance-message"
                      value={getSettingValue('maintenance_message')}
                      onChange={(e) => handleSettingChange(getSettingId('maintenance_message'), e.target.value)}
                      placeholder="System is currently under maintenance..."
                      rows={3}
                      data-testid="input-maintenance-message"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
