import { storage } from "./storage";
import { getRolePermissionTemplate } from "./rolePermissionTemplates";
import type { UserRole } from "@shared/schema";

export async function applyRolePermissions(userId: string, role: UserRole): Promise<void> {
  const template = getRolePermissionTemplate(role);
  
  if (!template) {
    throw new Error(`No permission template found for role: ${role}`);
  }
  
  await storage.deleteUserPermissions(userId);
  
  const permissions = Object.entries(template).map(([feature, permissions]) => ({
    userId,
    feature: feature as any,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
  }));
  
  for (const permission of permissions) {
    await storage.createUserPermission(permission);
  }
}
