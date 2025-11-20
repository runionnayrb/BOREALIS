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
import { Loader2, Settings, Shield, Zap, Users, Lock, ToggleLeft, UserCog, Wifi, Info } from "lucide-react";
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

type MeetingTemplate = {
  id: string;
  name: string;
  description: string | null;
  isActive: number;
  sortOrder: number;
};

type UserMeetingTemplatePermission = {
  id: string;
  userId: string;
  templateId: string;
  canView: number;
  canCreate: number;
  canEdit: number;
};

const PAGES = [...pageNames];

const PAGE_LABELS: Record<string, string> = {
  'admin': 'Admin Dashboard',
  'reports': 'Reports',
  'meetings': 'Meetings',
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

type TrustedIp = {
  id: string;
  ipAddress: string;
  description: string | null;
  isActive: number;
  createdAt: string;
  createdBy: string;
};

function WiFiVerificationSection() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<TrustedIp | null>(null);
  const [detectedIp, setDetectedIp] = useState<string | null>(null);
  const [ipFormData, setIpFormData] = useState({ ipAddress: '', description: '' });

  const { data: trustedIps, isLoading } = useQuery<TrustedIp[]>({
    queryKey: ['/api/admin/trusted-ips'],
  });

  const detectIpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<{ ip: string }>('GET', '/api/admin/trusted-ips/current-ip');
    },
    onSuccess: (data) => {
      setDetectedIp(data.ip);
      // Convert to wildcard pattern (replace last octet with *)
      // e.g., 192.168.1.45 becomes 192.168.1.*
      const ipParts = data.ip.split('.');
      const wildcardIp = ipParts.length === 4 
        ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.*`
        : data.ip;
      
      setIpFormData({ ipAddress: wildcardIp, description: '' });
      setAddDialogOpen(true);
      toast({
        title: "IP Detected",
        description: `Detected: ${data.ip}. Suggested pattern: ${wildcardIp} (allows all devices on this network)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to detect IP address",
        variant: "destructive",
      });
    },
  });

  const createIpMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; description?: string }) => {
      return await apiRequest('POST', '/api/admin/trusted-ips', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trusted-ips'] });
      setAddDialogOpen(false);
      setIpFormData({ ipAddress: '', description: '' });
      setDetectedIp(null);
      toast({
        title: "Success",
        description: "Trusted IP added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add trusted IP",
        variant: "destructive",
      });
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ ipAddress: string; description: string; isActive: number }> }) => {
      return await apiRequest('PATCH', `/api/admin/trusted-ips/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trusted-ips'] });
      setEditingIp(null);
      toast({
        title: "Success",
        description: "Trusted IP updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trusted IP",
        variant: "destructive",
      });
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/admin/trusted-ips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trusted-ips'] });
      toast({
        title: "Success",
        description: "Trusted IP deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trusted IP",
        variant: "destructive",
      });
    },
  });

  const handleAddIp = () => {
    if (!ipFormData.ipAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "IP address is required",
        variant: "destructive",
      });
      return;
    }
    createIpMutation.mutate({
      ipAddress: ipFormData.ipAddress.trim(),
      description: ipFormData.description.trim() || undefined,
    });
  };

  const handleEditIp = () => {
    if (!editingIp) return;
    if (!ipFormData.ipAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "IP address is required",
        variant: "destructive",
      });
      return;
    }
    updateIpMutation.mutate({
      id: editingIp.id,
      data: {
        ipAddress: ipFormData.ipAddress.trim(),
        description: ipFormData.description.trim() || undefined,
      },
    });
  };

  const handleToggleActive = (ip: TrustedIp) => {
    updateIpMutation.mutate({
      id: ip.id,
      data: { isActive: ip.isActive ? 0 : 1 },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>WiFi Verification</CardTitle>
              <CardDescription>
                Manage trusted IP addresses for artist attendance sign-in. Artists must be connected to one of these networks to sign in.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => detectIpMutation.mutate()}
                disabled={detectIpMutation.isPending}
                variant="outline"
                data-testid="button-detect-ip"
              >
                {detectIpMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                Auto-Detect Current IP
              </Button>
              <Button
                onClick={() => {
                  setIpFormData({ ipAddress: '', description: '' });
                  setDetectedIp(null);
                  setAddDialogOpen(true);
                }}
                data-testid="button-add-ip"
              >
                Add IP Address
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!trustedIps || trustedIps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No trusted IP addresses configured</p>
              <p className="text-sm">
                Add IP addresses to enable WiFi-based attendance verification.
                When no IPs are configured, sign-in is allowed from any network.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">IP Address</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Added</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trustedIps.map((ip) => (
                    <tr key={ip.id} className="border-b last:border-0" data-testid={`row-ip-${ip.id}`}>
                      <td className="p-3 font-mono text-sm">{ip.ipAddress}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {ip.description || <span className="italic">No description</span>}
                      </td>
                      <td className="p-3">
                        <Button
                          variant={ip.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleActive(ip)}
                          disabled={updateIpMutation.isPending}
                          data-testid={`button-toggle-${ip.id}`}
                        >
                          {ip.isActive ? 'Active' : 'Inactive'}
                        </Button>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(ip.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingIp(ip);
                            setIpFormData({ ipAddress: ip.ipAddress, description: ip.description || '' });
                          }}
                          data-testid={`button-edit-${ip.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete IP address ${ip.ipAddress}?`)) {
                              deleteIpMutation.mutate(ip.id);
                            }
                          }}
                          disabled={deleteIpMutation.isPending}
                          data-testid={`button-delete-${ip.id}`}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-ip">
          <DialogHeader>
            <DialogTitle>Add Trusted IP Address</DialogTitle>
            <DialogDescription>
              Add a trusted IP address or pattern for WiFi verification. Use wildcards to allow all devices on the same network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Recommended: Use wildcard patterns</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Using patterns like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">192.168.1.*</code> allows all devices 
                    on the same network to sign in, even if they get different IP addresses when reconnecting.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address or Pattern *</Label>
              <Input
                id="ip-address"
                placeholder="e.g., 192.168.1.* (recommended) or 192.168.1.100"
                value={ipFormData.ipAddress}
                onChange={(e) => setIpFormData({ ...ipFormData, ipAddress: e.target.value })}
                data-testid="input-ip-address"
              />
              {detectedIp && (
                <p className="text-xs text-muted-foreground">
                  Your exact IP: {detectedIp}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Theater Main WiFi"
                value={ipFormData.description}
                onChange={(e) => setIpFormData({ ...ipFormData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setIpFormData({ ipAddress: '', description: '' });
                  setDetectedIp(null);
                }}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddIp}
                disabled={createIpMutation.isPending}
                data-testid="button-confirm-add"
              >
                {createIpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add IP Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingIp} onOpenChange={(open) => !open && setEditingIp(null)}>
        <DialogContent data-testid="dialog-edit-ip">
          <DialogHeader>
            <DialogTitle>Edit Trusted IP Address</DialogTitle>
            <DialogDescription>
              Update the IP address pattern or description. Use wildcards (e.g., 192.168.1.*) to allow all devices on the same network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ip-address">IP Address or Pattern *</Label>
              <Input
                id="edit-ip-address"
                placeholder="e.g., 192.168.1.* (recommended) or 192.168.1.100"
                value={ipFormData.ipAddress}
                onChange={(e) => setIpFormData({ ...ipFormData, ipAddress: e.target.value })}
                data-testid="input-edit-ip-address"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use wildcards like <code className="bg-muted px-1 rounded">192.168.1.*</code> to allow all devices on the network
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="e.g., Theater Main WiFi"
                value={ipFormData.description}
                onChange={(e) => setIpFormData({ ...ipFormData, description: e.target.value })}
                data-testid="input-edit-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingIp(null)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditIp}
                disabled={updateIpMutation.isPending}
                data-testid="button-confirm-edit"
              >
                {updateIpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: string; userName: string; currentRole: string } | null>(null);
  const [roleAccessModalOpen, setRoleAccessModalOpen] = useState(false);

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

  const { data: meetingTemplates, isLoading: meetingTemplatesLoading } = useQuery<MeetingTemplate[]>({
    queryKey: ['/api/meeting-templates'],
  });

  const { data: templatePermissions, isLoading: templatePermissionsLoading } = useQuery<UserMeetingTemplatePermission[]>({
    queryKey: ['/api/admin/meeting-template-permissions'],
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
    onMutate: async ({ userId, permissions: perms }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/permissions'] });
      
      const previousData = queryClient.getQueryData<UserPermission[]>(['/api/permissions']);
      
      queryClient.setQueryData<UserPermission[]>(['/api/permissions'], (old) => {
        if (!old) return old;
        
        const otherPermissions = old.filter(p => p.userId !== userId);
        const newPermissions = perms.map(p => ({
          id: old.find(op => op.userId === userId && op.feature === p.feature)?.id || `temp-${userId}-${p.feature}`,
          userId,
          feature: p.feature,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        return [...otherPermissions, ...newPermissions];
      });
      
      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/permissions'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
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

  const updateTemplatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions: perms }: { userId: string; permissions: Array<{ templateId: string; canView: number; canCreate: number; canEdit: number }> }) => {
      return await apiRequest('POST', `/api/admin/meeting-template-permissions`, { userId, permissions: perms });
    },
    onMutate: async ({ userId, permissions: perms }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/admin/meeting-template-permissions'] });
      
      const previousData = queryClient.getQueryData<UserMeetingTemplatePermission[]>(['/api/admin/meeting-template-permissions']);
      
      queryClient.setQueryData<UserMeetingTemplatePermission[]>(['/api/admin/meeting-template-permissions'], (old) => {
        if (!old) return old;
        
        const otherPermissions = old.filter(p => p.userId !== userId);
        const newPermissions = perms.map(p => ({
          id: old.find(op => op.userId === userId && op.templateId === p.templateId)?.id || `temp-${userId}-${p.templateId}`,
          userId,
          templateId: p.templateId,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
        }));
        
        return [...otherPermissions, ...newPermissions];
      });
      
      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/admin/meeting-template-permissions'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update template permissions",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/meeting-template-permissions'] });
      toast({
        title: "Success",
        description: "Template permissions updated successfully",
      });
    },
  });

  const updateRolePageAccessMutation = useMutation({
    mutationFn: async ({ role, pages }: { role: string; pages: Array<{ page: string; canAccess: number }> }) => {
      return await apiRequest('POST', `/api/role-page-access/bulk/${role}`, { pages });
    },
    onMutate: async ({ role, pages }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/role-page-access'] });
      
      const previousData = queryClient.getQueryData<RolePageAccess[]>(['/api/role-page-access']);
      
      queryClient.setQueryData<RolePageAccess[]>(['/api/role-page-access'], (old) => {
        if (!old) return old;
        
        const otherRoles = old.filter(access => access.role !== role);
        const newRoleAccess = pages.map(p => ({
          id: old.find(a => a.role === role && a.page === p.page)?.id || `temp-${role}-${p.page}`,
          role,
          page: p.page,
          canAccess: p.canAccess,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        return [...otherRoles, ...newRoleAccess];
      });
      
      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/role-page-access'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update role page access",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/role-page-access'] });
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

  const getTemplatePermissionLevel = (userId: string, templateId: string): 'none' | 'view' | 'edit' | 'create' => {
    const perm = templatePermissions?.find(p => p.userId === userId && p.templateId === templateId);
    if (!perm) return 'none';
    
    if (perm.canCreate === 1) return 'create';
    if (perm.canEdit === 1) return 'edit';
    if (perm.canView === 1) return 'view';
    return 'none';
  };

  const handleTemplatePermissionLevelChange = (userId: string, templateId: string, level: string) => {
    if (!meetingTemplates || !templatePermissions) return;

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

    const userTemplatePerms = meetingTemplates.map(template => {
      const existing = templatePermissions.find(p => p.userId === userId && p.templateId === template.id);
      if (template.id === templateId) {
        return {
          templateId: template.id,
          canView,
          canEdit,
          canCreate,
        };
      }
      return {
        templateId: template.id,
        canView: existing?.canView || 0,
        canCreate: existing?.canCreate || 0,
        canEdit: existing?.canEdit || 0,
      };
    });

    updateTemplatePermissionsMutation.mutate({ userId, permissions: userTemplatePerms });
  };

  const handlePermissionLevelChange = (userId: string, feature: string, level: string) => {
    if (!permissions) return;

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

    updatePermissionsMutation.mutate({ userId, permissions: userPermissions });
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

  const handleRolePageAccessChange = (role: string, page: string, canAccess: boolean) => {
    if (!rolePageAccess) return;

    const rolePages = PAGES.map(p => {
      if (p === page) {
        return { page: p, canAccess: canAccess ? 1 : 0 };
      }
      const existing = rolePageAccess.find(a => a.role === role && a.page === p);
      return { page: p, canAccess: existing?.canAccess ?? 1 };
    });

    updateRolePageAccessMutation.mutate({ role, pages: rolePages });
  };

  const handleTemplatePermissionChange = (userId: string, templateId: string, permissionType: 'canView' | 'canCreate' | 'canEdit', value: boolean) => {
    if (!meetingTemplates || !templatePermissions) return;

    const userTemplatePerms = meetingTemplates.map(template => {
      if (template.id === templateId) {
        const existing = templatePermissions.find(p => p.userId === userId && p.templateId === templateId);
        return {
          templateId: template.id,
          canView: permissionType === 'canView' ? (value ? 1 : 0) : (existing?.canView || 0),
          canCreate: permissionType === 'canCreate' ? (value ? 1 : 0) : (existing?.canCreate || 0),
          canEdit: permissionType === 'canEdit' ? (value ? 1 : 0) : (existing?.canEdit || 0),
        };
      }
      const existing = templatePermissions.find(p => p.userId === userId && p.templateId === template.id);
      return {
        templateId: template.id,
        canView: existing?.canView || 0,
        canCreate: existing?.canCreate || 0,
        canEdit: existing?.canEdit || 0,
      };
    });

    updateTemplatePermissionsMutation.mutate({ userId, permissions: userTemplatePerms });
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

  if (usersLoading || permissionsLoading || settingsLoading || userGroupsLoading || meetingTemplatesLoading || templatePermissionsLoading) {
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
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="wifi" data-testid="tab-wifi">
              <Wifi className="w-4 h-4 mr-2" />
              WiFi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Select a permission level for each feature and meeting template. Create = full access, Edit = can view and edit, View = read-only. Users with "None" for all meeting templates will not see the Meetings sidebar item.
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
                        {meetingTemplates?.map(template => (
                          <th key={`template-${template.id}`} className="text-center p-3 font-semibold min-w-[120px]">
                            <div className="text-xs">{template.name}</div>
                            <div className="text-[10px] text-muted-foreground font-normal mt-1">(Meeting)</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupIds.flatMap(groupId => {
                        const group = userGroups?.find(g => g.id === groupId);
                        const groupUsers = groupedUsers[groupId] || [];
                        const groupName = group?.name || 'No Group';
                        
                        const totalColumns = FEATURES.length + (meetingTemplates?.length || 0) + 1;
                        
                        return [
                          /* Group header row */
                          <tr key={`group-${groupId}`} className="bg-muted/50">
                            <td colSpan={totalColumns} className="p-2 px-3">
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
                              {meetingTemplates?.map(template => {
                                const level = getTemplatePermissionLevel(u.id, template.id);
                                
                                return (
                                  <td key={`template-${template.id}`} className="p-3 text-center">
                                    <Select
                                      value={level}
                                      onValueChange={(value) => handleTemplatePermissionLevelChange(u.id, template.id, value)}
                                    >
                                      <SelectTrigger 
                                        className="w-full text-xs h-8"
                                        data-testid={`select-template-permission-${u.id}-${template.id}`}
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

          <TabsContent value="wifi" className="space-y-4">
            <WiFiVerificationSection />
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
                            data-testid={`checkbox-access-${role}-${page}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
