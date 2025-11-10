import type { UserRole } from "@shared/schema";

type PermissionLevel = {
  canView: number;
  canCreate: number;
  canEdit: number;
};

type RolePermissionTemplate = {
  [feature: string]: PermissionLevel;
};

const FULL_ACCESS: PermissionLevel = { canView: 1, canCreate: 1, canEdit: 1 };
const EDIT_ACCESS: PermissionLevel = { canView: 1, canCreate: 0, canEdit: 1 };
const VIEW_ONLY: PermissionLevel = { canView: 1, canCreate: 0, canEdit: 0 };
const NO_ACCESS: PermissionLevel = { canView: 0, canCreate: 0, canEdit: 0 };

export const ROLE_PERMISSION_TEMPLATES: Record<UserRole, RolePermissionTemplate> = {
  admin: {
    reports: FULL_ACCESS,
    schedules: FULL_ACCESS,
    lineups: FULL_ACCESS,
    lineups_training_programs: FULL_ACCESS,
    lineups_competencies: FULL_ACCESS,
    attendance_dashboard: FULL_ACCESS,
    attendance_ticksheet: FULL_ACCESS,
    attendance_signin: FULL_ACCESS,
    settings_artists: FULL_ACCESS,
    settings_technicians: FULL_ACCESS,
    settings_departments: FULL_ACCESS,
    settings_locations: FULL_ACCESS,
    settings_acts: FULL_ACCESS,
    settings_users: FULL_ACCESS,
    settings_report_template: FULL_ACCESS,
  },
  
  stage_management: {
    reports: FULL_ACCESS,
    schedules: FULL_ACCESS,
    lineups: FULL_ACCESS,
    lineups_training_programs: FULL_ACCESS,
    lineups_competencies: FULL_ACCESS,
    attendance_dashboard: FULL_ACCESS,
    attendance_ticksheet: FULL_ACCESS,
    attendance_signin: VIEW_ONLY,
    settings_artists: FULL_ACCESS,
    settings_technicians: FULL_ACCESS,
    settings_departments: FULL_ACCESS,
    settings_locations: FULL_ACCESS,
    settings_acts: FULL_ACCESS,
    settings_users: VIEW_ONLY,
    settings_report_template: FULL_ACCESS,
  },
  
  technical: {
    reports: VIEW_ONLY,
    schedules: VIEW_ONLY,
    lineups: VIEW_ONLY,
    lineups_training_programs: EDIT_ACCESS,
    lineups_competencies: VIEW_ONLY,
    attendance_dashboard: VIEW_ONLY,
    attendance_ticksheet: VIEW_ONLY,
    attendance_signin: NO_ACCESS,
    settings_artists: VIEW_ONLY,
    settings_technicians: EDIT_ACCESS,
    settings_departments: VIEW_ONLY,
    settings_locations: VIEW_ONLY,
    settings_acts: VIEW_ONLY,
    settings_users: NO_ACCESS,
    settings_report_template: VIEW_ONLY,
  },
  
  coaching: {
    reports: VIEW_ONLY,
    schedules: FULL_ACCESS,
    lineups: VIEW_ONLY,
    lineups_training_programs: FULL_ACCESS,
    lineups_competencies: EDIT_ACCESS,
    attendance_dashboard: VIEW_ONLY,
    attendance_ticksheet: VIEW_ONLY,
    attendance_signin: NO_ACCESS,
    settings_artists: VIEW_ONLY,
    settings_technicians: VIEW_ONLY,
    settings_departments: VIEW_ONLY,
    settings_locations: VIEW_ONLY,
    settings_acts: VIEW_ONLY,
    settings_users: NO_ACCESS,
    settings_report_template: VIEW_ONLY,
  },
  
  performance_wellness: {
    reports: VIEW_ONLY,
    schedules: VIEW_ONLY,
    lineups: VIEW_ONLY,
    lineups_training_programs: VIEW_ONLY,
    lineups_competencies: VIEW_ONLY,
    attendance_dashboard: VIEW_ONLY,
    attendance_ticksheet: VIEW_ONLY,
    attendance_signin: NO_ACCESS,
    settings_artists: VIEW_ONLY,
    settings_technicians: VIEW_ONLY,
    settings_departments: VIEW_ONLY,
    settings_locations: VIEW_ONLY,
    settings_acts: VIEW_ONLY,
    settings_users: NO_ACCESS,
    settings_report_template: VIEW_ONLY,
  },
  
  read_only: {
    reports: VIEW_ONLY,
    schedules: VIEW_ONLY,
    lineups: VIEW_ONLY,
    lineups_training_programs: VIEW_ONLY,
    lineups_competencies: VIEW_ONLY,
    attendance_dashboard: VIEW_ONLY,
    attendance_ticksheet: VIEW_ONLY,
    attendance_signin: NO_ACCESS,
    settings_artists: VIEW_ONLY,
    settings_technicians: VIEW_ONLY,
    settings_departments: VIEW_ONLY,
    settings_locations: VIEW_ONLY,
    settings_acts: VIEW_ONLY,
    settings_users: NO_ACCESS,
    settings_report_template: VIEW_ONLY,
  },
  
  artist: {
    reports: NO_ACCESS,
    schedules: VIEW_ONLY,
    lineups: VIEW_ONLY,
    lineups_training_programs: VIEW_ONLY,
    lineups_competencies: NO_ACCESS,
    attendance_dashboard: NO_ACCESS,
    attendance_ticksheet: NO_ACCESS,
    attendance_signin: VIEW_ONLY,
    settings_artists: NO_ACCESS,
    settings_technicians: NO_ACCESS,
    settings_departments: NO_ACCESS,
    settings_locations: NO_ACCESS,
    settings_acts: NO_ACCESS,
    settings_users: NO_ACCESS,
    settings_report_template: NO_ACCESS,
  },
};

export function getRolePermissionTemplate(role: UserRole): RolePermissionTemplate | null {
  return ROLE_PERMISSION_TEMPLATES[role] || null;
}

export function formatRolePermissionsForBulkUpdate(role: UserRole): Array<{ feature: string; canView: number; canCreate: number; canEdit: number }> {
  const template = getRolePermissionTemplate(role);
  if (!template) {
    return [];
  }
  
  return Object.entries(template).map(([feature, permissions]) => ({
    feature,
    ...permissions,
  }));
}
