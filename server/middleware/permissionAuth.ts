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
export const canCreateAttendanceDashboard = requirePermission('attendance_dashboard', 'canCreate');
export const canEditAttendanceDashboard = requirePermission('attendance_dashboard', 'canEdit');

export const canViewAttendanceTicksheet = requirePermission('attendance_ticksheet', 'canView');
export const canCreateAttendanceTicksheet = requirePermission('attendance_ticksheet', 'canCreate');
export const canEditAttendanceTicksheet = requirePermission('attendance_ticksheet', 'canEdit');

export const canViewAttendanceSignin = requirePermission('attendance_signin', 'canView');
export const canCreateAttendanceSignin = requirePermission('attendance_signin', 'canCreate');
export const canEditAttendanceSignin = requirePermission('attendance_signin', 'canEdit');

export const canViewSettingsArtists = requirePermission('settings_artists', 'canView');
export const canCreateSettingsArtists = requirePermission('settings_artists', 'canCreate');
export const canEditSettingsArtists = requirePermission('settings_artists', 'canEdit');

export const canViewSettingsTechnicians = requirePermission('settings_technicians', 'canView');
export const canCreateSettingsTechnicians = requirePermission('settings_technicians', 'canCreate');
export const canEditSettingsTechnicians = requirePermission('settings_technicians', 'canEdit');

export const canViewSettingsDepartments = requirePermission('settings_departments', 'canView');
export const canCreateSettingsDepartments = requirePermission('settings_departments', 'canCreate');
export const canEditSettingsDepartments = requirePermission('settings_departments', 'canEdit');

export const canViewSettingsLocations = requirePermission('settings_locations', 'canView');
export const canCreateSettingsLocations = requirePermission('settings_locations', 'canCreate');
export const canEditSettingsLocations = requirePermission('settings_locations', 'canEdit');

export const canViewSettingsActs = requirePermission('settings_acts', 'canView');
export const canCreateSettingsActs = requirePermission('settings_acts', 'canCreate');
export const canEditSettingsActs = requirePermission('settings_acts', 'canEdit');

export const canViewSettingsUsers = requirePermission('settings_users', 'canView');
export const canCreateSettingsUsers = requirePermission('settings_users', 'canCreate');
export const canEditSettingsUsers = requirePermission('settings_users', 'canEdit');

export const canViewLineupsPositions = requirePermission('lineups_positions', 'canView');
export const canCreateLineupsPositions = requirePermission('lineups_positions', 'canCreate');
export const canEditLineupsPositions = requirePermission('lineups_positions', 'canEdit');

export const canViewLineupsCompetencies = requirePermission('lineups_competencies', 'canView');
export const canCreateLineupsCompetencies = requirePermission('lineups_competencies', 'canCreate');
export const canEditLineupsCompetencies = requirePermission('lineups_competencies', 'canEdit');

export const canViewLineupsTrainingPrograms = requirePermission('lineups_training_programs', 'canView');
export const canCreateLineupsTrainingPrograms = requirePermission('lineups_training_programs', 'canCreate');
export const canEditLineupsTrainingPrograms = requirePermission('lineups_training_programs', 'canEdit');

export const canViewLineupsRules = requirePermission('lineups_rules', 'canView');
export const canCreateLineupsRules = requirePermission('lineups_rules', 'canCreate');
export const canEditLineupsRules = requirePermission('lineups_rules', 'canEdit');

export const canViewLineupsRestrictions = requirePermission('lineups_restrictions', 'canView');

export const canViewMeetings = requirePermission('meetings', 'canView');
export const canCreateMeetings = requirePermission('meetings', 'canCreate');
export const canEditMeetings = requirePermission('meetings', 'canEdit');

export const canViewSettingsMeetingTemplates = requirePermission('settings_meeting_templates', 'canView');
export const canCreateSettingsMeetingTemplates = requirePermission('settings_meeting_templates', 'canCreate');
export const canEditSettingsMeetingTemplates = requirePermission('settings_meeting_templates', 'canEdit');
