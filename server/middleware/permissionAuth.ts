import { Request, Response, NextFunction } from "express";
import type { FeatureName } from "@shared/schema";
import { storage } from "../storage";

type PermissionType = 'canView' | 'canCreate' | 'canEdit';

interface RequirePermissionOptions {
  feature: FeatureName;
  permission: PermissionType | PermissionType[];
}

export function requirePermission(feature: FeatureName, permission: PermissionType | PermissionType[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole === 'admin') {
      return next();
    }

    try {
      const userPermission = await storage.getUserPermissionByFeature(userId, feature);

      if (!userPermission) {
        return res.status(403).json({
          error: "Access denied",
          message: `You do not have permission to access ${feature}`,
        });
      }

      const requiredPermissions = Array.isArray(permission) ? permission : [permission];
      const hasPermission = requiredPermissions.some(perm => userPermission[perm] === 1);

      if (!hasPermission) {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: `You do not have ${requiredPermissions.join(' or ')} permission for ${feature}`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: "Permission check failed",
      });
    }
  };
}

export function requirePermissionByMethod(feature: FeatureName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole === 'admin') {
      return next();
    }

    const method = req.method.toUpperCase();
    let requiredPermission: PermissionType;

    switch (method) {
      case 'GET':
        requiredPermission = 'canView';
        break;
      case 'POST':
        requiredPermission = 'canCreate';
        break;
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        requiredPermission = 'canEdit';
        break;
      default:
        requiredPermission = 'canView';
    }

    try {
      const userPermission = await storage.getUserPermissionByFeature(userId, feature);

      if (!userPermission) {
        return res.status(403).json({
          error: "Access denied",
          message: `You do not have permission to access ${feature}`,
        });
      }

      if (userPermission[requiredPermission] !== 1) {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: `You do not have ${requiredPermission} permission for ${feature}`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: "Permission check failed",
      });
    }
  };
}

export const canViewReports = requirePermission('reports', 'canView');
export const canCreateReports = requirePermission('reports', 'canCreate');
export const canEditReports = requirePermission('reports', 'canEdit');

export const canViewSchedules = requirePermission('schedules', 'canView');
export const canCreateSchedules = requirePermission('schedules', 'canCreate');
export const canEditSchedules = requirePermission('schedules', 'canEdit');

export const canViewLineups = requirePermission('lineups', 'canView');
export const canCreateLineups = requirePermission('lineups', 'canCreate');
export const canEditLineups = requirePermission('lineups', 'canEdit');

export const canViewAttendanceDashboard = requirePermission('attendance_dashboard', 'canView');
export const canViewAttendanceTicksheet = requirePermission('attendance_ticksheet', 'canView');

export const canViewSettingsArtists = requirePermission('settings_artists', 'canView');
export const canEditSettingsArtists = requirePermission('settings_artists', 'canEdit');
