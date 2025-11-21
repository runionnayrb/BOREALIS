import { 
  type User, type InsertUser, users,
  type UserGroup, type InsertUserGroup, userGroups,
  type Scene, type InsertScene, scenes,
  type Act, type InsertAct, acts,
  type Cue, type InsertCue, cues,
  type Department, type InsertDepartment, departments,
  type ActDepartment, type InsertActDepartment, actDepartments,
  type CueDepartment, type InsertCueDepartment, cueDepartments,
  type LocationType, type InsertLocationType, locationTypes,
  type Location, type InsertLocation, locations,
  type ArtistGroup, type InsertArtistGroup, artistGroups,
  type Artist, type InsertArtist, artists,
  type ActArtist, type InsertActArtist, actArtists,
  type ActArtistGroup, type InsertActArtistGroup, actArtistGroups,
  type CueArtist, type InsertCueArtist, cueArtists,
  type CueArtistGroup, type InsertCueArtistGroup, cueArtistGroups,
  type SceneDepartment, type InsertSceneDepartment, sceneDepartments,
  type SceneArtistGroup, type InsertSceneArtistGroup, sceneArtistGroups,
  type SceneArtist, type InsertSceneArtist, sceneArtists,
  type Technician, type InsertTechnician, technicians,
  type TechnicianDepartment, type InsertTechnicianDepartment, technicianDepartments,
  type StaffMember, type InsertStaffMember, staffMembers,
  type StaffDepartment, type InsertStaffDepartment, staffDepartments,
  type ReportTemplate, type InsertReportTemplate, reportTemplate,
  type Report, type InsertReport, reports,
  type Training, type InsertTraining, trainings,
  type TrainingLocation, type InsertTrainingLocation, trainingLocations,
  type DepartmentAssignment, type InsertDepartmentAssignment, departmentAssignments,
  type TrainingArtist, type InsertTrainingArtist, trainingArtists,
  type AttendanceRecord, type InsertAttendanceRecord, attendanceRecords,
  type GeofenceSession, type InsertGeofenceSession, geofenceSessions,
  type TickSheet, type InsertTickSheet, tickSheets,
  type TickSheetMark, type InsertTickSheetMark, tickSheetMarks,
  type UserPermission, type InsertUserPermission, userPermissions,
  type SystemSetting, type InsertSystemSetting, systemSettings,
  type RolePageAccess, type InsertRolePageAccess, rolePageAccess,
  type DepartmentRole, type InsertDepartmentRole, departmentRoles,
  type Competency, type InsertCompetency, competencies,
  type Position, type InsertPosition, positions,
  type PositionCompetency, type InsertPositionCompetency, positionCompetencies,
  type PositionTrack, type InsertPositionTrack, positionTracks,
  type TrackPosition, type InsertTrackPosition, trackPositions,
  type LineupRule, type InsertLineupRule, lineupRules,
  type PwdRestriction, type InsertPwdRestriction, pwdRestrictions,
  type TrainingProgram, type InsertTrainingProgram, trainingPrograms,
  type ProgramStep, type InsertProgramStep, programSteps,
  type ProgramArtist, type InsertProgramArtist, programArtists,
  type StepStatusRecord, type InsertStepStatusRecord, stepStatusRecords,
  type FinalValidation, type InsertFinalValidation, finalValidations,
  type AuditTrail, type InsertAuditTrail, auditTrail,
  type ArtistCompetency, type InsertArtistCompetency, artistCompetencies,
  type TrustedIp, type InsertTrustedIp, trustedIps,
  type MeetingTemplate, type InsertMeetingTemplate, meetingTemplates,
  type MeetingTemplateField, type InsertMeetingTemplateField, meetingTemplateFields,
  type Meeting, type InsertMeeting, meetings,
  type MeetingFieldValue, type InsertMeetingFieldValue, meetingFieldValues,
  type UserMeetingTemplatePermission, type InsertUserMeetingTemplatePermission, userMeetingTemplatePermissions,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, asc, desc, inArray, and, or, gte, lte, isNull, isNotNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Store } from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User Groups
  getAllUserGroups(): Promise<UserGroup[]>;
  getUserGroup(id: string): Promise<UserGroup | undefined>;
  createUserGroup(group: InsertUserGroup): Promise<UserGroup>;
  updateUserGroup(id: string, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined>;
  deleteUserGroup(id: string): Promise<void>;
  
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(options?: { limit?: number; offset?: number }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined>;
  
  // Scenes
  getAllScenes(): Promise<Scene[]>;
  getScene(id: string): Promise<Scene | undefined>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: string, updates: Partial<InsertScene>): Promise<Scene | undefined>;
  deleteScene(id: string): Promise<void>;
  
  // Scene Departments
  getSceneDepartments(sceneId: string): Promise<SceneDepartment[]>;
  setSceneDepartments(sceneId: string, departmentIds: string[]): Promise<void>;
  
  // Scene Artist Groups
  getSceneArtistGroups(sceneId: string): Promise<SceneArtistGroup[]>;
  setSceneArtistGroups(sceneId: string, artistGroupIds: string[]): Promise<void>;
  
  // Scene Artists
  getSceneArtists(sceneId: string): Promise<SceneArtist[]>;
  setSceneArtists(sceneId: string, artistIds: string[]): Promise<void>;
  
  // Acts
  getAllActs(): Promise<Act[]>;
  getAct(id: string): Promise<Act | undefined>;
  createAct(act: InsertAct): Promise<Act>;
  updateAct(id: string, updates: Partial<InsertAct>): Promise<Act | undefined>;
  deleteAct(id: string): Promise<void>;
  reorderActs(actsWithOrder: Array<{id: string; sortOrder: number}>): Promise<void>;
  
  // Act Departments
  getActDepartments(actId: string): Promise<ActDepartment[]>;
  setActDepartments(actId: string, departmentIds: string[]): Promise<void>;
  
  // Cues
  getAllCues(): Promise<Cue[]>;
  getCue(id: string): Promise<Cue | undefined>;
  createCue(cue: InsertCue): Promise<Cue>;
  updateCue(id: string, updates: Partial<InsertCue>): Promise<Cue | undefined>;
  deleteCue(id: string): Promise<void>;
  reorderCues(cuesWithOrder: Array<{id: string; sortOrder: number}>): Promise<void>;
  
  // Cue Departments
  getCueDepartments(cueId: string): Promise<CueDepartment[]>;
  setCueDepartments(cueId: string, departmentIds: string[]): Promise<void>;
  
  // Cue Artists
  getCueArtists(cueId: string): Promise<CueArtist[]>;
  setCueArtists(cueId: string, artistIds: string[]): Promise<void>;
  
  // Cue Artist Groups
  getCueArtistGroups(cueId: string): Promise<CueArtistGroup[]>;
  setCueArtistGroups(cueId: string, artistGroupIds: string[]): Promise<void>;
  
  // Departments
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<void>;
  
  // Location Types
  getAllLocationTypes(): Promise<LocationType[]>;
  getLocationType(id: string): Promise<LocationType | undefined>;
  createLocationType(locationType: InsertLocationType): Promise<LocationType>;
  updateLocationType(id: string, updates: Partial<InsertLocationType>): Promise<LocationType | undefined>;
  deleteLocationType(id: string): Promise<void>;
  
  // Locations
  getAllLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<void>;
  
  // Artist Groups
  getAllArtistGroups(): Promise<ArtistGroup[]>;
  getArtistGroup(id: string): Promise<ArtistGroup | undefined>;
  createArtistGroup(group: InsertArtistGroup): Promise<ArtistGroup>;
  updateArtistGroup(id: string, updates: Partial<InsertArtistGroup>): Promise<ArtistGroup | undefined>;
  deleteArtistGroup(id: string): Promise<void>;
  
  // Artists
  getAllArtists(options?: { limit?: number; offset?: number }): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | undefined>;
  getArtistByUserId(userId: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist | undefined>;
  deleteArtist(id: string): Promise<void>;
  archiveArtistWithUser(artistId: string): Promise<void>;
  unarchiveArtistWithUser(artistId: string): Promise<void>;
  getAllArchivedArtists(options?: { limit?: number; offset?: number }): Promise<Artist[]>;
  getUnlinkedArtists(): Promise<Artist[]>;
  
  // Act Artists
  getActArtists(actId: string): Promise<ActArtist[]>;
  setActArtists(actId: string, artistIds: string[]): Promise<void>;
  
  // Act Artist Groups
  getActArtistGroups(actId: string): Promise<ActArtistGroup[]>;
  setActArtistGroups(actId: string, artistGroupIds: string[]): Promise<void>;
  
  // Technicians
  getAllTechnicians(options?: { limit?: number; offset?: number }): Promise<Technician[]>;
  getTechnician(id: string): Promise<Technician | undefined>;
  getTechnicianByUserId(userId: string): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: string): Promise<void>;
  archiveTechnicianWithUser(technicianId: string): Promise<void>;
  unarchiveTechnicianWithUser(technicianId: string): Promise<void>;
  getAllArchivedTechnicians(options?: { limit?: number; offset?: number }): Promise<Technician[]>;
  getUnlinkedTechnicians(): Promise<Technician[]>;
  linkUserToTechnician(technicianId: string, userId: string): Promise<void>;
  unlinkUserFromTechnician(technicianId: string): Promise<void>;
  reorderTechnicians(technicianIds: string[]): Promise<void>;
  
  // Technician Departments
  getTechnicianDepartments(technicianId: string): Promise<TechnicianDepartment[]>;
  getAllTechnicianDepartments(): Promise<TechnicianDepartment[]>;
  setTechnicianDepartments(technicianId: string, departmentIds: string[]): Promise<void>;
  getTechniciansByDepartment(departmentId: string): Promise<Technician[]>;
  
  // Artistic Staff (legacy - delegates to technician methods for backwards compatibility)
  getAllArtisticStaff(): Promise<Technician[]>;
  getArtisticStaff(id: string): Promise<Technician | undefined>;
  getArtisticStaffByUserId(userId: string): Promise<Technician | undefined>;
  createArtisticStaff(artisticStaff: InsertTechnician): Promise<Technician>;
  updateArtisticStaff(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteArtisticStaff(id: string): Promise<void>;
  archiveArtisticStaffWithUser(artisticStaffId: string): Promise<void>;
  unarchiveArtisticStaffWithUser(artisticStaffId: string): Promise<void>;
  getAllArchivedArtisticStaff(): Promise<Technician[]>;
  getUnlinkedArtisticStaff(): Promise<Technician[]>;
  reorderArtisticStaff(artisticStaffIds: string[]): Promise<void>;
  getArtisticStaffDepartments(artisticStaffId: string): Promise<TechnicianDepartment[]>;
  getAllArtisticStaffDepartments(): Promise<TechnicianDepartment[]>;
  setArtisticStaffDepartments(artisticStaffId: string, departmentIds: string[]): Promise<void>;
  getArtisticStaffByDepartment(departmentId: string): Promise<Technician[]>;
  reorderArtisticStaffInDepartment(departmentId: string, artisticStaffIds: string[]): Promise<void>;
  
  // Report Template
  getReportTemplate(): Promise<ReportTemplate | undefined>;
  updateReportTemplate(updates: Partial<InsertReportTemplate>, userId: string): Promise<ReportTemplate>;
  
  // Reports
  getAllReports(options?: { limit?: number; offset?: number }): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  getReportByDate(date: string): Promise<Report | undefined>;
  createReport(report: InsertReport, userId: string): Promise<Report>;
  updateReport(id: string, updates: Partial<Omit<InsertReport, 'createdBy'>>, userId: string): Promise<Report | undefined>;
  deleteReport(id: string): Promise<void>;
  hasUserReports(userId: string): Promise<boolean>;
  
  // Trainings
  getTrainingsByReportId(reportId: string): Promise<Training[]>;
  getTraining(id: string): Promise<Training | undefined>;
  createTraining(training: InsertTraining, userId: string): Promise<Training>;
  updateTraining(id: string, updates: Partial<Omit<InsertTraining, 'createdBy' | 'reportId'>>, userId: string): Promise<Training | undefined>;
  deleteTraining(id: string): Promise<void>;
  
  // Training Locations
  getTrainingLocations(trainingId: string): Promise<TrainingLocation[]>;
  getAllTrainingLocations(): Promise<TrainingLocation[]>;
  setTrainingLocations(trainingId: string, locationIds: string[]): Promise<void>;
  
  // Department Assignments
  getAssignmentsByTrainingId(trainingId: string): Promise<DepartmentAssignment[]>;
  getAllAssignments(): Promise<DepartmentAssignment[]>;
  createAssignment(assignment: InsertDepartmentAssignment): Promise<DepartmentAssignment>;
  updateAssignment(id: string, updates: Partial<InsertDepartmentAssignment>): Promise<DepartmentAssignment | undefined>;
  deleteAssignment(id: string): Promise<void>;
  
  // Training Artists
  getTrainingArtists(trainingId: string): Promise<TrainingArtist[]>;
  getAllTrainingArtists(): Promise<TrainingArtist[]>;
  setTrainingArtists(trainingId: string, artistIds: string[]): Promise<void>;
  
  // Attendance Records
  getAttendanceRecord(artistId: string, date: string): Promise<AttendanceRecord | undefined>;
  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDateRange(startDate: string, endDate: string, options?: { limit?: number; offset?: number }): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByArtist(artistId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined>;
  
  // Geofence Sessions
  getGeofenceSession(artistId: string): Promise<GeofenceSession | undefined>;
  upsertGeofenceSession(session: InsertGeofenceSession): Promise<GeofenceSession>;
  
  // Tick Sheets
  getAllTickSheets(): Promise<TickSheet[]>;
  getActiveTickSheets(): Promise<TickSheet[]>;
  getTickSheet(id: string): Promise<TickSheet | undefined>;
  createTickSheet(tickSheet: InsertTickSheet): Promise<TickSheet>;
  updateTickSheet(id: string, updates: Partial<InsertTickSheet>): Promise<TickSheet | undefined>;
  deleteTickSheet(id: string): Promise<void>;
  resetTickSheet(id: string): Promise<void>;
  
  // Tick Sheet Marks
  getTickSheetMarks(tickSheetId: string): Promise<TickSheetMark[]>;
  createTickSheetMark(mark: InsertTickSheetMark): Promise<TickSheetMark>;
  deleteTickSheetMark(id: string): Promise<void>;
  deleteTickSheetMarksByArtist(tickSheetId: string, artistId: string): Promise<void>;
  
  // User Permissions
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  getAllUserPermissions(): Promise<UserPermission[]>;
  getUserPermissionByFeature(userId: string, feature: string): Promise<UserPermission | undefined>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(id: string, updates: Partial<InsertUserPermission>): Promise<UserPermission | undefined>;
  upsertUserPermission(userId: string, feature: string, canView: number, canCreate: number, canEdit: number): Promise<UserPermission>;
  deleteUserPermission(id: string): Promise<void>;
  deleteUserPermissions(userId: string): Promise<void>;
  bulkUpsertUserPermissions(userId: string, permissions: Array<{feature: string; canView: number; canCreate: number; canEdit: number}>): Promise<void>;
  
  // System Settings
  getAllSystemSettings(): Promise<SystemSetting[]>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getSystemSettingValue(key: string): Promise<string | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting | undefined>;
  upsertSystemSetting(key: string, value: string, type: string, category: string, description?: string, updatedBy?: string): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;

  // Trusted IPs - WiFi verification
  getAllTrustedIps(): Promise<TrustedIp[]>;
  getActiveTrustedIps(): Promise<TrustedIp[]>;
  getTrustedIp(id: string): Promise<TrustedIp | undefined>;
  createTrustedIp(ip: InsertTrustedIp): Promise<TrustedIp>;
  updateTrustedIp(id: string, updates: Partial<InsertTrustedIp>): Promise<TrustedIp | undefined>;
  deleteTrustedIp(id: string): Promise<void>;
  
  // Role Page Access
  getAllRolePageAccess(): Promise<RolePageAccess[]>;
  getRolePageAccess(role: string, page: string): Promise<RolePageAccess | undefined>;
  getRolePageAccessByRole(role: string): Promise<RolePageAccess[]>;
  createRolePageAccess(access: InsertRolePageAccess): Promise<RolePageAccess>;
  updateRolePageAccess(id: string, updates: Partial<InsertRolePageAccess>): Promise<RolePageAccess | undefined>;
  upsertRolePageAccess(role: string, page: string, canAccess: number): Promise<RolePageAccess>;
  deleteRolePageAccess(id: string): Promise<void>;
  bulkUpsertRolePageAccess(role: string, pages: Array<{page: string; canAccess: number}>): Promise<void>;
  
  // Department Roles
  getDepartmentRoles(departmentId: string): Promise<DepartmentRole[]>;
  getDepartmentRole(id: string): Promise<DepartmentRole | undefined>;
  createDepartmentRole(role: InsertDepartmentRole): Promise<DepartmentRole>;
  updateDepartmentRole(id: string, updates: Partial<InsertDepartmentRole>): Promise<DepartmentRole | undefined>;
  deleteDepartmentRole(id: string): Promise<void>;
  setDepartmentRoles(departmentId: string, roles: InsertDepartmentRole[]): Promise<void>;
  
  // Competencies
  getAllCompetencies(): Promise<Competency[]>;
  getCompetency(id: string): Promise<Competency | undefined>;
  createCompetency(competency: InsertCompetency): Promise<Competency>;
  updateCompetency(id: string, updates: Partial<InsertCompetency>): Promise<Competency | undefined>;
  deleteCompetency(id: string): Promise<void>;
  
  // Positions
  getAllPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<void>;
  
  // Position Competencies
  getPositionCompetencies(positionId: string): Promise<PositionCompetency[]>;
  setPositionCompetencies(positionId: string, competencyIds: string[]): Promise<void>;
  
  // Position Tracks
  getAllPositionTracks(): Promise<PositionTrack[]>;
  getPositionTrack(id: string): Promise<PositionTrack | undefined>;
  createPositionTrack(track: InsertPositionTrack): Promise<PositionTrack>;
  updatePositionTrack(id: string, updates: Partial<InsertPositionTrack>): Promise<PositionTrack | undefined>;
  deletePositionTrack(id: string): Promise<void>;
  getTrackPositions(trackId: string): Promise<TrackPosition[]>;
  addPositionsToTrack(trackId: string, positionIds: string[]): Promise<void>;
  removePositionFromTrack(trackId: string, positionId: string): Promise<void>;
  
  // Lineup Rules
  getAllLineupRules(): Promise<LineupRule[]>;
  getActiveLineupRules(): Promise<LineupRule[]>;
  getLineupRule(id: string): Promise<LineupRule | undefined>;
  createLineupRule(rule: InsertLineupRule): Promise<LineupRule>;
  updateLineupRule(id: string, updates: Partial<InsertLineupRule>): Promise<LineupRule | undefined>;
  deleteLineupRule(id: string): Promise<void>;
  
  // PWD Restrictions
  getAllPwdRestrictions(): Promise<PwdRestriction[]>;
  getActivePwdRestrictions(): Promise<PwdRestriction[]>;
  getPwdRestriction(id: string): Promise<PwdRestriction | undefined>;
  getArtistPwdRestrictions(artistId: string): Promise<PwdRestriction[]>;
  createPwdRestriction(restriction: InsertPwdRestriction): Promise<PwdRestriction>;
  updatePwdRestriction(id: string, updates: Partial<InsertPwdRestriction>): Promise<PwdRestriction | undefined>;
  deletePwdRestriction(id: string): Promise<void>;
  
  // Training Programs
  getAllTrainingPrograms(): Promise<TrainingProgram[]>;
  getTrainingProgram(id: string): Promise<TrainingProgram | undefined>;
  getTrainingProgramTemplates(): Promise<TrainingProgram[]>;
  createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateTrainingProgram(id: string, updates: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined>;
  deleteTrainingProgram(id: string): Promise<void>;
  createProgramFromTemplate(templateId: string, name: string, userId?: string): Promise<TrainingProgram>;
  
  // Program Steps
  getProgramSteps(programId: string): Promise<ProgramStep[]>;
  getProgramStep(id: string): Promise<ProgramStep | undefined>;
  createProgramStep(step: InsertProgramStep): Promise<ProgramStep>;
  updateProgramStep(id: string, updates: Partial<InsertProgramStep>): Promise<ProgramStep | undefined>;
  deleteProgramStep(id: string): Promise<void>;
  
  // Program Artists
  getProgramArtists(programId: string): Promise<ProgramArtist[]>;
  getProgramArtist(id: string): Promise<ProgramArtist | undefined>;
  getArtistPrograms(artistId: string): Promise<ProgramArtist[]>;
  createProgramArtist(programArtist: InsertProgramArtist): Promise<ProgramArtist>;
  updateProgramArtist(id: string, updates: Partial<InsertProgramArtist>): Promise<ProgramArtist | undefined>;
  deleteProgramArtist(id: string): Promise<void>;
  
  // Step Status Records
  getStepStatusRecords(programArtistId: string): Promise<StepStatusRecord[]>;
  getStepStatusRecord(id: string): Promise<StepStatusRecord | undefined>;
  createStepStatusRecord(record: InsertStepStatusRecord): Promise<StepStatusRecord>;
  updateStepStatusRecord(id: string, updates: Partial<InsertStepStatusRecord>): Promise<StepStatusRecord | undefined>;
  deleteStepStatusRecord(id: string): Promise<void>;
  
  // Final Validations
  getFinalValidation(programArtistId: string): Promise<FinalValidation | undefined>;
  createFinalValidation(validation: InsertFinalValidation): Promise<FinalValidation>;
  deleteFinalValidation(id: string): Promise<void>;
  
  // Audit Trail
  getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]>;
  createAuditTrail(entry: InsertAuditTrail): Promise<AuditTrail>;
  
  // Artist Competencies
  getArtistCompetencies(artistId: string): Promise<ArtistCompetency[]>;
  getArtistCompetency(id: string): Promise<ArtistCompetency | undefined>;
  createArtistCompetency(competency: InsertArtistCompetency): Promise<ArtistCompetency>;
  updateArtistCompetency(id: string, updates: Partial<InsertArtistCompetency>): Promise<ArtistCompetency | undefined>;
  deleteArtistCompetency(id: string): Promise<void>;
  checkExpiredCompetencies(): Promise<void>;
  
  // Meeting Templates
  getAllMeetingTemplates(): Promise<MeetingTemplate[]>;
  getActiveMeetingTemplates(): Promise<MeetingTemplate[]>;
  getActiveMeetingTemplatesForUser(userId: string): Promise<MeetingTemplate[]>;
  getMeetingTemplate(id: string): Promise<MeetingTemplate | undefined>;
  createMeetingTemplate(template: InsertMeetingTemplate): Promise<MeetingTemplate>;
  updateMeetingTemplate(id: string, updates: Partial<InsertMeetingTemplate>): Promise<MeetingTemplate | undefined>;
  deleteMeetingTemplate(id: string): Promise<void>;
  reorderMeetingTemplates(templatesWithOrder: Array<{id: string; sortOrder: number}>): Promise<void>;
  
  // Meeting Template Fields
  getTemplateFields(templateId: string): Promise<MeetingTemplateField[]>;
  getMeetingTemplateField(id: string): Promise<MeetingTemplateField | undefined>;
  createMeetingTemplateField(field: InsertMeetingTemplateField): Promise<MeetingTemplateField>;
  updateMeetingTemplateField(id: string, updates: Partial<InsertMeetingTemplateField>): Promise<MeetingTemplateField | undefined>;
  deleteMeetingTemplateField(id: string): Promise<void>;
  reorderTemplateFields(fieldsWithOrder: Array<{id: string; sortOrder: number}>): Promise<void>;
  
  // Meetings
  getAllMeetings(): Promise<Meeting[]>;
  getMeetingsForUser(userId: string, options?: { limit?: number; offset?: number }): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetingsByTemplate(templateId: string, options?: { limit?: number; offset?: number }): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, updates: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<void>;
  canUserAccessTemplate(userId: string, templateId: string, permission: 'view' | 'create' | 'edit'): Promise<boolean>;
  
  // Meeting Field Values
  getMeetingFieldValues(meetingId: string): Promise<MeetingFieldValue[]>;
  getMeetingFieldValue(meetingId: string, fieldId: string): Promise<MeetingFieldValue | undefined>;
  upsertMeetingFieldValue(value: InsertMeetingFieldValue): Promise<MeetingFieldValue>;
  deleteMeetingFieldValue(id: string): Promise<void>;
  
  // User Meeting Template Permissions
  getUserTemplatePermissions(userId: string): Promise<UserMeetingTemplatePermission[]>;
  getUserTemplatePermission(userId: string, templateId: string): Promise<UserMeetingTemplatePermission | undefined>;
  getAllTemplatePermissions(): Promise<UserMeetingTemplatePermission[]>;
  upsertUserTemplatePermission(permission: InsertUserMeetingTemplatePermission): Promise<UserMeetingTemplatePermission>;
  deleteUserTemplatePermission(userId: string, templateId: string): Promise<void>;
  bulkUpsertUserTemplatePermissions(userId: string, permissions: InsertUserMeetingTemplatePermission[]): Promise<void>;
  
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User Groups
  async getAllUserGroups(): Promise<UserGroup[]> {
    return await db.select().from(userGroups).orderBy(asc(userGroups.sortOrder));
  }

  async getUserGroup(id: string): Promise<UserGroup | undefined> {
    const result = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return result[0];
  }

  async createUserGroup(group: InsertUserGroup): Promise<UserGroup> {
    const result = await db.insert(userGroups).values(group).returning();
    return result[0];
  }

  async updateUserGroup(id: string, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined> {
    const result = await db.update(userGroups).set(updates).where(eq(userGroups.id, id)).returning();
    return result[0];
  }

  async deleteUserGroup(id: string): Promise<void> {
    await db.delete(userGroups).where(eq(userGroups.id, id));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Note: Expects email to be normalized (lowercased) before calling
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(options?: { limit?: number; offset?: number }): Promise<User[]> {
    let query = db.select().from(users).where(isNull(users.archivedAt)).orderBy(asc(users.name));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    // Before deleting the user, unlink any artist/staff records that reference this user
    // This prevents foreign key constraint violations while preserving artist/staff data
    await db.update(artists)
      .set({ userId: null })
      .where(eq(artists.userId, id));
    
    await db.update(staffMembers)
      .set({ userId: null })
      .where(eq(staffMembers.userId, id));
    
    // User permissions will cascade delete automatically (they have onDelete: cascade in schema)
    // Now safe to delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Scenes
  async getAllScenes(): Promise<Scene[]> {
    return await db.select().from(scenes).orderBy(asc(scenes.sortOrder));
  }

  async getScene(id: string): Promise<Scene | undefined> {
    const result = await db.select().from(scenes).where(eq(scenes.id, id));
    return result[0];
  }

  async createScene(scene: InsertScene): Promise<Scene> {
    const result = await db.insert(scenes).values(scene).returning();
    return result[0];
  }

  async updateScene(id: string, updates: Partial<InsertScene>): Promise<Scene | undefined> {
    const result = await db.update(scenes).set(updates).where(eq(scenes.id, id)).returning();
    return result[0];
  }

  async deleteScene(id: string): Promise<void> {
    await db.delete(scenes).where(eq(scenes.id, id));
  }

  // Scene Departments
  async getSceneDepartments(sceneId: string): Promise<SceneDepartment[]> {
    return await db.select().from(sceneDepartments).where(eq(sceneDepartments.sceneId, sceneId));
  }

  async setSceneDepartments(sceneId: string, departmentIds: string[]): Promise<void> {
    await db.delete(sceneDepartments).where(eq(sceneDepartments.sceneId, sceneId));
    if (departmentIds.length > 0) {
      await db.insert(sceneDepartments).values(
        departmentIds.map(departmentId => ({ sceneId, departmentId }))
      );
    }
  }

  // Scene Artist Groups
  async getSceneArtistGroups(sceneId: string): Promise<SceneArtistGroup[]> {
    return await db.select().from(sceneArtistGroups).where(eq(sceneArtistGroups.sceneId, sceneId));
  }

  async setSceneArtistGroups(sceneId: string, artistGroupIds: string[]): Promise<void> {
    await db.delete(sceneArtistGroups).where(eq(sceneArtistGroups.sceneId, sceneId));
    if (artistGroupIds.length > 0) {
      await db.insert(sceneArtistGroups).values(
        artistGroupIds.map(artistGroupId => ({ sceneId, artistGroupId }))
      );
    }
  }

  // Scene Artists
  async getSceneArtists(sceneId: string): Promise<SceneArtist[]> {
    return await db.select().from(sceneArtists).where(eq(sceneArtists.sceneId, sceneId));
  }

  async setSceneArtists(sceneId: string, artistIds: string[]): Promise<void> {
    await db.delete(sceneArtists).where(eq(sceneArtists.sceneId, sceneId));
    if (artistIds.length > 0) {
      await db.insert(sceneArtists).values(
        artistIds.map(artistId => ({ sceneId, artistId }))
      );
    }
  }

  // Acts
  async getAllActs(): Promise<Act[]> {
    return await db.select().from(acts).orderBy(asc(acts.sortOrder));
  }

  async getAct(id: string): Promise<Act | undefined> {
    const result = await db.select().from(acts).where(eq(acts.id, id));
    return result[0];
  }

  async createAct(act: InsertAct): Promise<Act> {
    const result = await db.insert(acts).values(act).returning();
    return result[0];
  }

  async updateAct(id: string, updates: Partial<InsertAct>): Promise<Act | undefined> {
    const result = await db.update(acts).set(updates).where(eq(acts.id, id)).returning();
    return result[0];
  }

  async deleteAct(id: string): Promise<void> {
    await db.delete(acts).where(eq(acts.id, id));
  }

  async reorderActs(actsWithOrder: Array<{id: string; sortOrder: number}>): Promise<void> {
    if (actsWithOrder.length === 0) return;
    
    // Build CASE statement for batch update with explicit integer casting
    const caseStatement = sql`(case ${sql.join(
      actsWithOrder.map(act => sql`when ${acts.id} = ${act.id} then ${act.sortOrder}`),
      sql` `
    )} end)::integer`;
    
    const actIds = actsWithOrder.map(act => act.id);
    
    await db.update(acts)
      .set({ sortOrder: caseStatement })
      .where(inArray(acts.id, actIds));
  }

  // Act Departments
  async getActDepartments(actId: string): Promise<ActDepartment[]> {
    return await db.select().from(actDepartments).where(eq(actDepartments.actId, actId));
  }

  async setActDepartments(actId: string, departmentIds: string[]): Promise<void> {
    await db.delete(actDepartments).where(eq(actDepartments.actId, actId));
    if (departmentIds.length > 0) {
      await db.insert(actDepartments).values(
        departmentIds.map(departmentId => ({ actId, departmentId }))
      );
    }
  }

  // Cues
  async getAllCues(): Promise<Cue[]> {
    return await db.select().from(cues).orderBy(asc(cues.sortOrder));
  }

  async getCue(id: string): Promise<Cue | undefined> {
    const result = await db.select().from(cues).where(eq(cues.id, id));
    return result[0];
  }

  async createCue(cue: InsertCue): Promise<Cue> {
    const result = await db.insert(cues).values(cue).returning();
    return result[0];
  }

  async updateCue(id: string, updates: Partial<InsertCue>): Promise<Cue | undefined> {
    const result = await db.update(cues).set(updates).where(eq(cues.id, id)).returning();
    return result[0];
  }

  async deleteCue(id: string): Promise<void> {
    await db.delete(cues).where(eq(cues.id, id));
  }

  async reorderCues(cuesWithOrder: Array<{id: string; sortOrder: number}>): Promise<void> {
    if (cuesWithOrder.length === 0) return;
    
    // Build CASE statement for batch update with explicit integer casting
    const caseStatement = sql`(case ${sql.join(
      cuesWithOrder.map(cue => sql`when ${cues.id} = ${cue.id} then ${cue.sortOrder}`),
      sql` `
    )} end)::integer`;
    
    const cueIds = cuesWithOrder.map(cue => cue.id);
    
    await db.update(cues)
      .set({ sortOrder: caseStatement })
      .where(inArray(cues.id, cueIds));
  }

  // Cue Departments
  async getCueDepartments(cueId: string): Promise<CueDepartment[]> {
    return await db.select().from(cueDepartments).where(eq(cueDepartments.cueId, cueId));
  }

  async setCueDepartments(cueId: string, departmentIds: string[]): Promise<void> {
    await db.delete(cueDepartments).where(eq(cueDepartments.cueId, cueId));
    if (departmentIds.length > 0) {
      await db.insert(cueDepartments).values(
        departmentIds.map(departmentId => ({ cueId, departmentId }))
      );
    }
  }

  // Cue Artists
  async getCueArtists(cueId: string): Promise<CueArtist[]> {
    return await db.select().from(cueArtists).where(eq(cueArtists.cueId, cueId));
  }

  async setCueArtists(cueId: string, artistIds: string[]): Promise<void> {
    await db.delete(cueArtists).where(eq(cueArtists.cueId, cueId));
    if (artistIds.length > 0) {
      await db.insert(cueArtists).values(
        artistIds.map(artistId => ({ cueId, artistId }))
      );
    }
  }

  // Cue Artist Groups
  async getCueArtistGroups(cueId: string): Promise<CueArtistGroup[]> {
    return await db.select().from(cueArtistGroups).where(eq(cueArtistGroups.cueId, cueId));
  }

  async setCueArtistGroups(cueId: string, artistGroupIds: string[]): Promise<void> {
    await db.delete(cueArtistGroups).where(eq(cueArtistGroups.cueId, cueId));
    if (artistGroupIds.length > 0) {
      await db.insert(cueArtistGroups).values(
        artistGroupIds.map(artistGroupId => ({ cueId, artistGroupId }))
      );
    }
  }

  // Departments
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.sortOrder));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await db.update(departments).set(updates).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Location Types
  async getAllLocationTypes(): Promise<LocationType[]> {
    return await db.select().from(locationTypes).orderBy(asc(locationTypes.sortOrder));
  }

  async getLocationType(id: string): Promise<LocationType | undefined> {
    const result = await db.select().from(locationTypes).where(eq(locationTypes.id, id));
    return result[0];
  }

  async createLocationType(locationType: InsertLocationType): Promise<LocationType> {
    const result = await db.insert(locationTypes).values(locationType).returning();
    return result[0];
  }

  async updateLocationType(id: string, updates: Partial<InsertLocationType>): Promise<LocationType | undefined> {
    const result = await db.update(locationTypes).set(updates).where(eq(locationTypes.id, id)).returning();
    return result[0];
  }

  async deleteLocationType(id: string): Promise<void> {
    await db.delete(locationTypes).where(eq(locationTypes.id, id));
  }

  // Locations
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(asc(locations.sortOrder));
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(location).returning();
    return result[0];
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location | undefined> {
    const result = await db.update(locations).set(updates).where(eq(locations.id, id)).returning();
    return result[0];
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Artist Groups
  async getAllArtistGroups(): Promise<ArtistGroup[]> {
    return await db.select().from(artistGroups).orderBy(asc(artistGroups.sortOrder));
  }

  async getArtistGroup(id: string): Promise<ArtistGroup | undefined> {
    const result = await db.select().from(artistGroups).where(eq(artistGroups.id, id));
    return result[0];
  }

  async createArtistGroup(group: InsertArtistGroup): Promise<ArtistGroup> {
    const result = await db.insert(artistGroups).values(group).returning();
    return result[0];
  }

  async updateArtistGroup(id: string, updates: Partial<InsertArtistGroup>): Promise<ArtistGroup | undefined> {
    const result = await db.update(artistGroups).set(updates).where(eq(artistGroups.id, id)).returning();
    return result[0];
  }

  async deleteArtistGroup(id: string): Promise<void> {
    await db.delete(artistGroups).where(eq(artistGroups.id, id));
  }

  // Artists
  async getAllArtists(options?: { limit?: number; offset?: number }): Promise<Artist[]> {
    let query = db.select().from(artists).where(isNull(artists.archivedAt)).orderBy(asc(artists.sortOrder));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(and(eq(artists.id, id), isNull(artists.archivedAt)));
    return result[0];
  }

  async getArtistByUserId(userId: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(and(eq(artists.userId, userId), isNull(artists.archivedAt)));
    return result[0];
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const result = await db.insert(artists).values(artist).returning();
    return result[0];
  }

  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist | undefined> {
    const result = await db.update(artists).set(updates).where(eq(artists.id, id)).returning();
    return result[0];
  }

  async deleteArtist(id: string): Promise<void> {
    await db.delete(artists).where(eq(artists.id, id));
  }

  async archiveArtistWithUser(artistId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const artist = await tx.select().from(artists).where(eq(artists.id, artistId)).limit(1);
      if (!artist[0]) {
        throw new Error("Artist not found");
      }

      await tx.update(artists).set({ archivedAt: sql`now()` }).where(eq(artists.id, artistId));

      if (artist[0].userId) {
        await tx.update(users).set({ archivedAt: sql`now()` }).where(eq(users.id, artist[0].userId));
      }
    });
  }

  async unarchiveArtistWithUser(artistId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const artist = await tx.select().from(artists).where(eq(artists.id, artistId)).limit(1);
      if (!artist[0]) {
        throw new Error("Artist not found");
      }

      await tx.update(artists).set({ archivedAt: null }).where(eq(artists.id, artistId));

      if (artist[0].userId) {
        await tx.update(users).set({ archivedAt: null }).where(eq(users.id, artist[0].userId));
      }
    });
  }

  async getAllArchivedArtists(options?: { limit?: number; offset?: number }): Promise<Artist[]> {
    let query = db.select().from(artists).where(isNotNull(artists.archivedAt)).orderBy(asc(artists.sortOrder));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getUnlinkedArtists(): Promise<Artist[]> {
    return await db.select().from(artists).where(
      and(isNull(artists.userId), isNull(artists.archivedAt))
    ).orderBy(asc(artists.sortOrder));
  }

  async reorderArtists(artistIds: string[]): Promise<void> {
    if (artistIds.length === 0) return;
    
    // Build CASE statement for batch update with explicit integer casting
    const caseStatement = sql`(case ${sql.join(
      artistIds.map((id, index) => sql`when ${artists.id} = ${id} then ${index}`),
      sql` `
    )} end)::integer`;
    
    await db.update(artists)
      .set({ sortOrder: caseStatement })
      .where(inArray(artists.id, artistIds));
  }

  // Act Artists
  async getActArtists(actId: string): Promise<ActArtist[]> {
    return await db.select().from(actArtists).where(eq(actArtists.actId, actId));
  }

  async setActArtists(actId: string, artistIds: string[]): Promise<void> {
    // Delete existing assignments
    await db.delete(actArtists).where(eq(actArtists.actId, actId));
    
    // Insert new assignments
    if (artistIds.length > 0) {
      await db.insert(actArtists).values(
        artistIds.map(artistId => ({ actId, artistId }))
      );
    }
  }

  // Act Artist Groups
  async getActArtistGroups(actId: string): Promise<ActArtistGroup[]> {
    return await db.select().from(actArtistGroups).where(eq(actArtistGroups.actId, actId));
  }

  async setActArtistGroups(actId: string, artistGroupIds: string[]): Promise<void> {
    await db.delete(actArtistGroups).where(eq(actArtistGroups.actId, actId));
    if (artistGroupIds.length > 0) {
      await db.insert(actArtistGroups).values(
        artistGroupIds.map(artistGroupId => ({ actId, artistGroupId }))
      );
    }
  }

  // Technicians
  async getAllTechnicians(options?: { limit?: number; offset?: number }): Promise<Technician[]> {
    let query = db.select().from(technicians).where(isNull(technicians.archivedAt)).orderBy(asc(technicians.sortOrder));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getTechnician(id: string): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id));
    return result[0];
  }

  async getTechnicianByUserId(userId: string): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.userId, userId));
    return result[0];
  }

  async createTechnician(technician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values(technician).returning();
    return result[0];
  }

  async updateTechnician(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const result = await db.update(technicians).set(updates).where(eq(technicians.id, id)).returning();
    return result[0];
  }

  async deleteTechnician(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete related technician_departments records first
      await tx.delete(technicianDepartments).where(eq(technicianDepartments.technicianId, id));
      // Then delete the technician
      await tx.delete(technicians).where(eq(technicians.id, id));
    });
  }

  async archiveTechnicianWithUser(technicianId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const technician = await tx.select().from(technicians).where(eq(technicians.id, technicianId)).limit(1);
      if (!technician[0]) {
        throw new Error("Technician not found");
      }

      await tx.update(technicians).set({ archivedAt: sql`now()` }).where(eq(technicians.id, technicianId));

      if (technician[0].userId) {
        await tx.update(users).set({ archivedAt: sql`now()` }).where(eq(users.id, technician[0].userId));
      }
    });
  }

  async unarchiveTechnicianWithUser(technicianId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const technician = await tx.select().from(technicians).where(eq(technicians.id, technicianId)).limit(1);
      if (!technician[0]) {
        throw new Error("Technician not found");
      }

      await tx.update(technicians).set({ archivedAt: null }).where(eq(technicians.id, technicianId));

      if (technician[0].userId) {
        await tx.update(users).set({ archivedAt: null }).where(eq(users.id, technician[0].userId));
      }
    });
  }

  async getAllArchivedTechnicians(options?: { limit?: number; offset?: number }): Promise<Technician[]> {
    let query = db.select().from(technicians).where(isNotNull(technicians.archivedAt)).orderBy(asc(technicians.sortOrder));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getUnlinkedTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians).where(
      and(isNull(technicians.userId), isNull(technicians.archivedAt))
    ).orderBy(asc(technicians.sortOrder));
  }

  async linkUserToTechnician(technicianId: string, userId: string): Promise<void> {
    const existingLink = await db.select().from(technicians).where(eq(technicians.userId, userId)).limit(1);
    if (existingLink.length > 0 && existingLink[0].id !== technicianId) {
      throw new Error("This user is already linked to another technician");
    }
    await db.update(technicians).set({ userId }).where(eq(technicians.id, technicianId));
  }

  async unlinkUserFromTechnician(technicianId: string): Promise<void> {
    await db.update(technicians).set({ userId: null }).where(eq(technicians.id, technicianId));
  }

  async reorderTechnicians(technicianIds: string[]): Promise<void> {
    if (technicianIds.length === 0) return;
    
    // Build CASE statement for batch update with explicit integer casting
    const caseStatement = sql`(case ${sql.join(
      technicianIds.map((id, index) => sql`when ${technicians.id} = ${id} then ${index}`),
      sql` `
    )} end)::integer`;
    
    await db.update(technicians)
      .set({ sortOrder: caseStatement })
      .where(inArray(technicians.id, technicianIds));
  }

  // Technician Departments
  async getTechnicianDepartments(technicianId: string): Promise<TechnicianDepartment[]> {
    return await db.select().from(technicianDepartments).where(eq(technicianDepartments.technicianId, technicianId));
  }

  async getAllTechnicianDepartments(): Promise<TechnicianDepartment[]> {
    return await db.select().from(technicianDepartments);
  }

  async setTechnicianDepartments(technicianId: string, departmentIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Check if technician exists
      const techExists = await tx.select().from(technicians).where(eq(technicians.id, technicianId)).limit(1);
      if (techExists.length === 0) {
        throw new Error(`Technician ${technicianId} not found`);
      }

      // Check if all departments exist
      if (departmentIds.length > 0) {
        const deptExists = await tx.select().from(departments).where(
          inArray(departments.id, departmentIds)
        );
        if (deptExists.length !== departmentIds.length) {
          throw new Error('One or more departments not found');
        }
      }

      // Get existing assignments to preserve sortOrder where possible
      const existingAssignments = await tx.select().from(technicianDepartments).where(eq(technicianDepartments.technicianId, technicianId));
      const existingMap = new Map(existingAssignments.map(a => [a.departmentId, a.sortOrder]));

      // Delete existing assignments
      await tx.delete(technicianDepartments).where(eq(technicianDepartments.technicianId, technicianId));

      // Insert new assignments, preserving sortOrder for departments that already existed
      // For new departments, get the max sortOrder in that department and add to the end
      if (departmentIds.length > 0) {
        // Identify new departments that need max sort order lookup
        const newDepartments = departmentIds.filter(id => !existingMap.has(id));
        
        // Batch query to get max sort orders for all new departments at once
        const maxSortOrders = new Map<string, number>();
        if (newDepartments.length > 0) {
          const results = await tx
            .select({
              departmentId: technicianDepartments.departmentId,
              max: sql<number>`COALESCE(MAX(${technicianDepartments.sortOrder}), -1)`
            })
            .from(technicianDepartments)
            .where(inArray(technicianDepartments.departmentId, newDepartments))
            .groupBy(technicianDepartments.departmentId);
          
          results.forEach(r => maxSortOrders.set(r.departmentId, r.max));
        }
        
        // Build new assignments with appropriate sort orders
        const newAssignments = departmentIds.map((departmentId) => {
          // If this department assignment already existed, keep its sortOrder
          if (existingMap.has(departmentId)) {
            return { technicianId, departmentId, sortOrder: existingMap.get(departmentId)! };
          }
          // Otherwise, use the batched max sort order + 1
          const maxSortOrder = maxSortOrders.get(departmentId) ?? -1;
          return { technicianId, departmentId, sortOrder: maxSortOrder + 1 };
        });
        
        await tx.insert(technicianDepartments).values(newAssignments);
      }
    });
  }

  async reorderTechniciansInDepartment(departmentId: string, technicianIds: string[]): Promise<void> {
    if (technicianIds.length === 0) return;
    
    try {
      // Validate that the department exists
      const dept = await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1);
      if (dept.length === 0) {
        throw new Error(`Department ${departmentId} not found`);
      }
      
      // Validate that all technician-department assignments exist
      const existingAssignments = await db.select()
        .from(technicianDepartments)
        .where(
          and(
            eq(technicianDepartments.departmentId, departmentId),
            inArray(technicianDepartments.technicianId, technicianIds)
          )
        );
      
      if (existingAssignments.length !== technicianIds.length) {
        const existingIds = new Set(existingAssignments.map(a => a.technicianId));
        const missingIds = technicianIds.filter(id => !existingIds.has(id));
        throw new Error(`Some technicians are not assigned to this department: ${missingIds.join(', ')}`);
      }
      
      // Build CASE statement for batch update with explicit integer casting
      const caseStatement = sql`(case ${sql.join(
        technicianIds.map((id, index) => sql`when ${technicianDepartments.technicianId} = ${id} then ${index}`),
        sql` `
      )} end)::integer`;
      
      await db.update(technicianDepartments)
        .set({ sortOrder: caseStatement })
        .where(
          and(
            eq(technicianDepartments.departmentId, departmentId),
            inArray(technicianDepartments.technicianId, technicianIds)
          )
        );
    } catch (error) {
      console.error('[Storage] Error reordering technicians in department:', {
        departmentId,
        technicianIds,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getTechniciansByDepartment(departmentId: string): Promise<Technician[]> {
    // Get technician-department assignments ordered by sortOrder
    const techDepts = await db.select()
      .from(technicianDepartments)
      .where(eq(technicianDepartments.departmentId, departmentId))
      .orderBy(asc(technicianDepartments.sortOrder));
    
    if (techDepts.length === 0) return [];
    
    // Get technicians and maintain the order from techDepts
    const technicianIds = techDepts.map(td => td.technicianId);
    const techniciansData = await db.select().from(technicians).where(inArray(technicians.id, technicianIds));
    
    // Re-sort based on the order from techDepts
    const techMap = new Map(techniciansData.map(t => [t.id, t]));
    return technicianIds.map(id => techMap.get(id)!).filter(Boolean);
  }

  // Artistic Staff (legacy wrapper methods - delegate to unified staff_members table)
  async getAllArtisticStaff(): Promise<Technician[]> {
    return this.getAllTechnicians();
  }

  async getArtisticStaff(id: string): Promise<Technician | undefined> {
    return this.getTechnician(id);
  }

  async getArtisticStaffByUserId(userId: string): Promise<Technician | undefined> {
    return this.getTechnicianByUserId(userId);
  }

  async createArtisticStaff(artisticStaff: InsertTechnician): Promise<Technician> {
    return this.createTechnician(artisticStaff);
  }

  async updateArtisticStaff(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined> {
    return this.updateTechnician(id, updates);
  }

  async deleteArtisticStaff(id: string): Promise<void> {
    return this.deleteTechnician(id);
  }

  async archiveArtisticStaffWithUser(artisticStaffId: string): Promise<void> {
    return this.archiveTechnicianWithUser(artisticStaffId);
  }

  async unarchiveArtisticStaffWithUser(artisticStaffId: string): Promise<void> {
    return this.unarchiveTechnicianWithUser(artisticStaffId);
  }

  async getAllArchivedArtisticStaff(): Promise<Technician[]> {
    return this.getAllArchivedTechnicians();
  }

  async getUnlinkedArtisticStaff(): Promise<Technician[]> {
    return this.getUnlinkedTechnicians();
  }

  async reorderArtisticStaff(artisticStaffIds: string[]): Promise<void> {
    return this.reorderTechnicians(artisticStaffIds);
  }

  async getArtisticStaffDepartments(artisticStaffId: string): Promise<TechnicianDepartment[]> {
    return this.getTechnicianDepartments(artisticStaffId);
  }

  async getAllArtisticStaffDepartments(): Promise<TechnicianDepartment[]> {
    return this.getAllTechnicianDepartments();
  }

  async setArtisticStaffDepartments(artisticStaffId: string, departmentIds: string[]): Promise<void> {
    return this.setTechnicianDepartments(artisticStaffId, departmentIds);
  }

  async getArtisticStaffByDepartment(departmentId: string): Promise<Technician[]> {
    return this.getTechniciansByDepartment(departmentId);
  }

  async reorderArtisticStaffInDepartment(departmentId: string, artisticStaffIds: string[]): Promise<void> {
    if (artisticStaffIds.length === 0) return;
    
    // Build CASE statement for batch update with explicit integer casting
    const caseStatement = sql`(case ${sql.join(
      artisticStaffIds.map((id, index) => sql`when ${technicianDepartments.technicianId} = ${id} then ${index}`),
      sql` `
    )} end)::integer`;
    
    await db.update(technicianDepartments)
      .set({ sortOrder: caseStatement })
      .where(
        and(
          eq(technicianDepartments.departmentId, departmentId),
          inArray(technicianDepartments.technicianId, artisticStaffIds)
        )
      );
  }

  // Report Template
  async getReportTemplate(): Promise<ReportTemplate | undefined> {
    const result = await db.select().from(reportTemplate).limit(1);
    return result[0];
  }

  async updateReportTemplate(updates: Partial<InsertReportTemplate>, userId: string): Promise<ReportTemplate> {
    const existing = await this.getReportTemplate();
    
    if (existing) {
      const result = await db
        .update(reportTemplate)
        .set({ ...updates, updatedBy: userId, updatedAt: new Date() })
        .where(eq(reportTemplate.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(reportTemplate)
        .values({ 
          title: updates.title || '',
          leftImageUrl: updates.leftImageUrl,
          rightImageUrl: updates.rightImageUrl,
          updatedBy: userId 
        })
        .returning();
      return result[0];
    }
  }

  // Reports
  async getAllReports(options?: { limit?: number; offset?: number }): Promise<Report[]> {
    let query = db.select().from(reports).orderBy(desc(reports.date));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getReportByDate(date: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.date, date));
    return result[0];
  }

  async createReport(report: InsertReport, userId: string): Promise<Report> {
    const result = await db
      .insert(reports)
      .values({ ...report, createdBy: userId, updatedBy: userId })
      .returning();
    return result[0];
  }

  async updateReport(id: string, updates: Partial<Omit<InsertReport, 'createdBy'>>, userId: string): Promise<Report | undefined> {
    const result = await db
      .update(reports)
      .set({ ...updates, updatedBy: userId, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return result[0];
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async hasUserReports(userId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(or(
        eq(reports.createdBy, userId),
        eq(reports.updatedBy, userId)
      ));
    
    return result[0]?.count > 0;
  }

  // Trainings
  async getTrainingsByReportId(reportId: string): Promise<Training[]> {
    return await db
      .select()
      .from(trainings)
      .where(eq(trainings.reportId, reportId))
      .orderBy(asc(trainings.startTime), asc(trainings.endTime));
  }

  async getTraining(id: string): Promise<Training | undefined> {
    const result = await db.select().from(trainings).where(eq(trainings.id, id));
    return result[0];
  }

  async createTraining(training: InsertTraining, userId: string): Promise<Training> {
    const result = await db
      .insert(trainings)
      .values({ ...training, createdBy: userId, updatedBy: userId })
      .returning();
    return result[0];
  }

  async updateTraining(id: string, updates: Partial<Omit<InsertTraining, 'createdBy' | 'reportId'>>, userId: string): Promise<Training | undefined> {
    const result = await db
      .update(trainings)
      .set({ ...updates, updatedBy: userId, updatedAt: new Date() })
      .where(eq(trainings.id, id))
      .returning();
    return result[0];
  }

  async deleteTraining(id: string): Promise<void> {
    await db.delete(trainings).where(eq(trainings.id, id));
  }

  // Training Locations
  async getTrainingLocations(trainingId: string): Promise<TrainingLocation[]> {
    return await db.select().from(trainingLocations).where(eq(trainingLocations.trainingId, trainingId));
  }

  async getAllTrainingLocations(): Promise<TrainingLocation[]> {
    return await db.select().from(trainingLocations);
  }

  async setTrainingLocations(trainingId: string, locationIds: string[]): Promise<void> {
    await db.delete(trainingLocations).where(eq(trainingLocations.trainingId, trainingId));
    if (locationIds.length > 0) {
      await db.insert(trainingLocations).values(
        locationIds.map(locationId => ({ trainingId, locationId }))
      );
    }
  }

  // Department Assignments
  async getAssignmentsByTrainingId(trainingId: string): Promise<DepartmentAssignment[]> {
    return await db.select().from(departmentAssignments).where(eq(departmentAssignments.trainingId, trainingId));
  }

  async getAllAssignments(): Promise<DepartmentAssignment[]> {
    return await db.select().from(departmentAssignments);
  }

  async createAssignment(assignment: InsertDepartmentAssignment): Promise<DepartmentAssignment> {
    const result = await db.insert(departmentAssignments).values(assignment).returning();
    return result[0];
  }

  async updateAssignment(id: string, updates: Partial<InsertDepartmentAssignment>): Promise<DepartmentAssignment | undefined> {
    const result = await db.update(departmentAssignments).set(updates).where(eq(departmentAssignments.id, id)).returning();
    return result[0];
  }

  async deleteAssignment(id: string): Promise<void> {
    await db.delete(departmentAssignments).where(eq(departmentAssignments.id, id));
  }

  // Training Artists
  async getTrainingArtists(trainingId: string): Promise<TrainingArtist[]> {
    return await db.select().from(trainingArtists).where(eq(trainingArtists.trainingId, trainingId));
  }

  async getAllTrainingArtists(): Promise<TrainingArtist[]> {
    return await db.select().from(trainingArtists);
  }

  async setTrainingArtists(trainingId: string, artistIds: string[]): Promise<void> {
    await db.delete(trainingArtists).where(eq(trainingArtists.trainingId, trainingId));
    if (artistIds.length > 0) {
      await db.insert(trainingArtists).values(
        artistIds.map(artistId => ({ trainingId, artistId }))
      );
    }
  }

  // Attendance Records
  async getAttendanceRecord(artistId: string, date: string): Promise<AttendanceRecord | undefined> {
    const result = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.artistId, artistId),
        eq(attendanceRecords.date, date)
      ));
    return result[0];
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords);
  }

  async getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.date, date));
  }

  async getAttendanceRecordsByDateRange(startDate: string, endDate: string, options?: { limit?: number; offset?: number }): Promise<AttendanceRecord[]> {
    let query = db
      .select()
      .from(attendanceRecords)
      .where(and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ))
      .orderBy(desc(attendanceRecords.date));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getAttendanceRecordsByArtist(artistId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    const conditions = [eq(attendanceRecords.artistId, artistId)];
    
    if (startDate) {
      conditions.push(gte(attendanceRecords.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceRecords.date, endDate));
    }

    return await db
      .select()
      .from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.date));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const result = await db.insert(attendanceRecords).values(record).returning();
    return result[0];
  }

  async updateAttendanceRecord(id: string, updates: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const result = await db
      .update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return result[0];
  }

  // Geofence Sessions
  async getGeofenceSession(artistId: string): Promise<GeofenceSession | undefined> {
    const result = await db
      .select()
      .from(geofenceSessions)
      .where(eq(geofenceSessions.artistId, artistId))
      .orderBy(desc(geofenceSessions.lastCheckedAt))
      .limit(1);
    return result[0];
  }

  async upsertGeofenceSession(session: InsertGeofenceSession): Promise<GeofenceSession> {
    // Check if session exists for this artist
    const existing = await this.getGeofenceSession(session.artistId);
    
    if (existing) {
      // Update existing session
      const result = await db
        .update(geofenceSessions)
        .set({
          isInside: session.isInside,
          lastCheckedAt: new Date(),
          lastLatitude: session.lastLatitude,
          lastLongitude: session.lastLongitude,
          lastAccuracy: session.lastAccuracy,
        })
        .where(eq(geofenceSessions.id, existing.id))
        .returning();
      return result[0];
    } else {
      // Create new session
      const result = await db.insert(geofenceSessions).values(session).returning();
      return result[0];
    }
  }

  // Tick Sheets
  async getAllTickSheets(): Promise<TickSheet[]> {
    return await db.select().from(tickSheets).orderBy(desc(tickSheets.createdAt));
  }

  async getActiveTickSheets(): Promise<TickSheet[]> {
    return await db
      .select()
      .from(tickSheets)
      .where(eq(tickSheets.isActive, 1))
      .orderBy(desc(tickSheets.createdAt));
  }

  async getTickSheet(id: string): Promise<TickSheet | undefined> {
    const result = await db.select().from(tickSheets).where(eq(tickSheets.id, id));
    return result[0];
  }

  async createTickSheet(tickSheet: InsertTickSheet): Promise<TickSheet> {
    const result = await db.insert(tickSheets).values(tickSheet).returning();
    return result[0];
  }

  async updateTickSheet(id: string, updates: Partial<InsertTickSheet>): Promise<TickSheet | undefined> {
    const result = await db
      .update(tickSheets)
      .set(updates)
      .where(eq(tickSheets.id, id))
      .returning();
    return result[0];
  }

  async deleteTickSheet(id: string): Promise<void> {
    await db.delete(tickSheets).where(eq(tickSheets.id, id));
  }

  async resetTickSheet(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(tickSheetMarks).where(eq(tickSheetMarks.tickSheetId, id));
      await tx.update(tickSheets)
        .set({ resetAt: new Date() })
        .where(eq(tickSheets.id, id));
    });
  }

  // Tick Sheet Marks
  async getTickSheetMarks(tickSheetId: string): Promise<TickSheetMark[]> {
    return await db
      .select()
      .from(tickSheetMarks)
      .where(eq(tickSheetMarks.tickSheetId, tickSheetId));
  }

  async createTickSheetMark(mark: InsertTickSheetMark): Promise<TickSheetMark> {
    const result = await db.insert(tickSheetMarks).values(mark).returning();
    return result[0];
  }

  async deleteTickSheetMark(id: string): Promise<void> {
    await db.delete(tickSheetMarks).where(eq(tickSheetMarks.id, id));
  }

  async deleteTickSheetMarksByArtist(tickSheetId: string, artistId: string): Promise<void> {
    await db.delete(tickSheetMarks).where(and(
      eq(tickSheetMarks.tickSheetId, tickSheetId),
      eq(tickSheetMarks.artistId, artistId)
    ));
  }

  // User Permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async getAllUserPermissions(): Promise<UserPermission[]> {
    return await db.select().from(userPermissions);
  }

  async getUserPermissionByFeature(userId: string, feature: string): Promise<UserPermission | undefined> {
    const result = await db.select().from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.feature, feature)
      ));
    return result[0];
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const result = await db.insert(userPermissions).values(permission).returning();
    return result[0];
  }

  async updateUserPermission(id: string, updates: Partial<InsertUserPermission>): Promise<UserPermission | undefined> {
    const result = await db.update(userPermissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPermissions.id, id))
      .returning();
    return result[0];
  }

  async upsertUserPermission(userId: string, feature: string, canView: number, canCreate: number, canEdit: number): Promise<UserPermission> {
    const result = await db.insert(userPermissions)
      .values({ userId, feature, canView, canCreate, canEdit })
      .onConflictDoUpdate({
        target: [userPermissions.userId, userPermissions.feature],
        set: { canView, canCreate, canEdit, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async deleteUserPermission(id: string): Promise<void> {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
  }

  async deleteUserPermissions(userId: string): Promise<void> {
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async bulkUpsertUserPermissions(userId: string, permissions: Array<{feature: string; canView: number; canCreate: number; canEdit: number}>): Promise<void> {
    if (permissions.length === 0) return;
    
    await db.transaction(async (tx) => {
      for (const perm of permissions) {
        await tx.insert(userPermissions)
          .values({ userId, feature: perm.feature, canView: perm.canView, canCreate: perm.canCreate, canEdit: perm.canEdit })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.feature],
            set: { canView: perm.canView, canCreate: perm.canCreate, canEdit: perm.canEdit, updatedAt: new Date() }
          });
      }
    });
  }

  // System Settings
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.category), asc(systemSettings.settingKey));
  }

  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings)
      .where(eq(systemSettings.category, category))
      .orderBy(asc(systemSettings.settingKey));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key));
    return result[0];
  }

  async getSystemSettingValue(key: string): Promise<string | undefined> {
    const setting = await this.getSystemSetting(key);
    return setting?.settingValue;
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const result = await db.insert(systemSettings).values(setting).returning();
    return result[0];
  }

  async updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting | undefined> {
    const result = await db.update(systemSettings)
      .set({ settingValue: value, updatedAt: new Date(), updatedBy })
      .where(eq(systemSettings.settingKey, key))
      .returning();
    return result[0];
  }

  async upsertSystemSetting(key: string, value: string, type: string, category: string, description?: string, updatedBy?: string): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const result = await db.update(systemSettings)
        .set({ settingValue: value, updatedAt: new Date(), updatedBy })
        .where(eq(systemSettings.settingKey, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(systemSettings)
        .values({ settingKey: key, settingValue: value, settingType: type, category, description, updatedBy })
        .returning();
      return result[0];
    }
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.settingKey, key));
  }

  // Trusted IPs - WiFi verification
  async getAllTrustedIps(): Promise<TrustedIp[]> {
    return await db.select().from(trustedIps).orderBy(desc(trustedIps.createdAt));
  }

  async getActiveTrustedIps(): Promise<TrustedIp[]> {
    return await db.select().from(trustedIps)
      .where(eq(trustedIps.isActive, 1))
      .orderBy(desc(trustedIps.createdAt));
  }

  async getTrustedIp(id: string): Promise<TrustedIp | undefined> {
    const result = await db.select().from(trustedIps).where(eq(trustedIps.id, id));
    return result[0];
  }

  async createTrustedIp(ip: InsertTrustedIp): Promise<TrustedIp> {
    const result = await db.insert(trustedIps).values(ip).returning();
    return result[0];
  }

  async updateTrustedIp(id: string, updates: Partial<InsertTrustedIp>): Promise<TrustedIp | undefined> {
    const result = await db.update(trustedIps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trustedIps.id, id))
      .returning();
    return result[0];
  }

  async deleteTrustedIp(id: string): Promise<void> {
    await db.delete(trustedIps).where(eq(trustedIps.id, id));
  }

  // Role Page Access
  async getAllRolePageAccess(): Promise<RolePageAccess[]> {
    return await db.select().from(rolePageAccess).orderBy(asc(rolePageAccess.role), asc(rolePageAccess.page));
  }

  async getRolePageAccess(role: string, page: string): Promise<RolePageAccess | undefined> {
    const result = await db.select().from(rolePageAccess)
      .where(and(
        eq(rolePageAccess.role, role),
        eq(rolePageAccess.page, page)
      ));
    return result[0];
  }

  async getRolePageAccessByRole(role: string): Promise<RolePageAccess[]> {
    return await db.select().from(rolePageAccess).where(eq(rolePageAccess.role, role));
  }

  async createRolePageAccess(access: InsertRolePageAccess): Promise<RolePageAccess> {
    const result = await db.insert(rolePageAccess).values(access).returning();
    return result[0];
  }

  async updateRolePageAccess(id: string, updates: Partial<InsertRolePageAccess>): Promise<RolePageAccess | undefined> {
    const result = await db.update(rolePageAccess)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rolePageAccess.id, id))
      .returning();
    return result[0];
  }

  async upsertRolePageAccess(role: string, page: string, canAccess: number): Promise<RolePageAccess> {
    const existing = await this.getRolePageAccess(role, page);
    if (existing) {
      const result = await db.update(rolePageAccess)
        .set({ canAccess, updatedAt: new Date() })
        .where(eq(rolePageAccess.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(rolePageAccess)
        .values({ role, page, canAccess })
        .returning();
      return result[0];
    }
  }

  async deleteRolePageAccess(id: string): Promise<void> {
    await db.delete(rolePageAccess).where(eq(rolePageAccess.id, id));
  }

  async bulkUpsertRolePageAccess(role: string, pages: Array<{page: string; canAccess: number}>): Promise<void> {
    await db.transaction(async (tx) => {
      for (const pageAccess of pages) {
        const existing = await tx.select().from(rolePageAccess)
          .where(and(
            eq(rolePageAccess.role, role),
            eq(rolePageAccess.page, pageAccess.page)
          ));
        
        if (existing.length > 0) {
          await tx.update(rolePageAccess)
            .set({ canAccess: pageAccess.canAccess, updatedAt: new Date() })
            .where(eq(rolePageAccess.id, existing[0].id));
        } else {
          await tx.insert(rolePageAccess)
            .values({ role, page: pageAccess.page, canAccess: pageAccess.canAccess });
        }
      }
    });
  }

  // ========== LINEUP FOUNDATION IMPLEMENTATIONS ==========

  // Department Roles
  async getDepartmentRoles(departmentId: string): Promise<DepartmentRole[]> {
    return await db.select().from(departmentRoles).where(eq(departmentRoles.departmentId, departmentId));
  }

  async getDepartmentRole(id: string): Promise<DepartmentRole | undefined> {
    const result = await db.select().from(departmentRoles).where(eq(departmentRoles.id, id));
    return result[0];
  }

  async createDepartmentRole(role: InsertDepartmentRole): Promise<DepartmentRole> {
    const result = await db.insert(departmentRoles).values(role).returning();
    return result[0];
  }

  async updateDepartmentRole(id: string, updates: Partial<InsertDepartmentRole>): Promise<DepartmentRole | undefined> {
    const result = await db.update(departmentRoles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(departmentRoles.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartmentRole(id: string): Promise<void> {
    await db.delete(departmentRoles).where(eq(departmentRoles.id, id));
  }

  async setDepartmentRoles(departmentId: string, roles: InsertDepartmentRole[]): Promise<void> {
    // Delete existing roles for this department
    await db.delete(departmentRoles).where(eq(departmentRoles.departmentId, departmentId));
    
    // Insert new roles
    if (roles.length > 0) {
      await db.insert(departmentRoles).values(roles);
    }
  }

  // Competencies
  async getAllCompetencies(): Promise<Competency[]> {
    return await db.select().from(competencies).orderBy(asc(competencies.name));
  }

  async getCompetency(id: string): Promise<Competency | undefined> {
    const result = await db.select().from(competencies).where(eq(competencies.id, id));
    return result[0];
  }

  async createCompetency(competency: InsertCompetency): Promise<Competency> {
    const result = await db.insert(competencies).values(competency).returning();
    return result[0];
  }

  async updateCompetency(id: string, updates: Partial<InsertCompetency>): Promise<Competency | undefined> {
    const result = await db.update(competencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(competencies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompetency(id: string): Promise<void> {
    await db.delete(competencies).where(eq(competencies.id, id));
  }

  // Positions
  async getAllPositions(): Promise<Position[]> {
    return await db.select().from(positions).orderBy(asc(positions.name));
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id));
    return result[0];
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const result = await db.insert(positions).values(position).returning();
    return result[0];
  }

  async updatePosition(id: string, updates: Partial<InsertPosition>): Promise<Position | undefined> {
    const result = await db.update(positions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  async deletePosition(id: string): Promise<void> {
    await db.delete(positions).where(eq(positions.id, id));
  }

  // Position Competencies
  async getPositionCompetencies(positionId: string): Promise<PositionCompetency[]> {
    return await db.select().from(positionCompetencies).where(eq(positionCompetencies.positionId, positionId));
  }

  async setPositionCompetencies(positionId: string, competencyIds: string[]): Promise<void> {
    // Delete existing competencies for this position
    await db.delete(positionCompetencies).where(eq(positionCompetencies.positionId, positionId));
    
    // Insert new competencies
    if (competencyIds.length > 0) {
      const values = competencyIds.map(competencyId => ({ positionId, competencyId }));
      await db.insert(positionCompetencies).values(values);
    }
  }

  // Position Tracks
  async getAllPositionTracks(): Promise<PositionTrack[]> {
    return await db.select().from(positionTracks).orderBy(asc(positionTracks.name));
  }

  async getPositionTrack(id: string): Promise<PositionTrack | undefined> {
    const result = await db.select().from(positionTracks).where(eq(positionTracks.id, id));
    return result[0];
  }

  async createPositionTrack(track: InsertPositionTrack): Promise<PositionTrack> {
    const result = await db.insert(positionTracks).values(track).returning();
    return result[0];
  }

  async updatePositionTrack(id: string, updates: Partial<InsertPositionTrack>): Promise<PositionTrack | undefined> {
    const result = await db.update(positionTracks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(positionTracks.id, id))
      .returning();
    return result[0];
  }

  async deletePositionTrack(id: string): Promise<void> {
    await db.delete(positionTracks).where(eq(positionTracks.id, id));
  }

  async getTrackPositions(trackId: string): Promise<TrackPosition[]> {
    return await db.select().from(trackPositions)
      .where(eq(trackPositions.trackId, trackId))
      .orderBy(asc(trackPositions.sortOrder));
  }

  async addPositionsToTrack(trackId: string, positionIds: string[]): Promise<void> {
    if (positionIds.length > 0) {
      const values = positionIds.map((positionId, index) => ({
        trackId,
        positionId,
        sortOrder: index,
      }));
      await db.insert(trackPositions).values(values);
    }
  }

  async removePositionFromTrack(trackId: string, positionId: string): Promise<void> {
    await db.delete(trackPositions).where(
      and(
        eq(trackPositions.trackId, trackId),
        eq(trackPositions.positionId, positionId)
      )
    );
  }

  // Lineup Rules
  async getAllLineupRules(): Promise<LineupRule[]> {
    return await db.select().from(lineupRules).orderBy(asc(lineupRules.name));
  }

  async getActiveLineupRules(): Promise<LineupRule[]> {
    return await db.select().from(lineupRules)
      .where(eq(lineupRules.active, 1))
      .orderBy(asc(lineupRules.name));
  }

  async getLineupRule(id: string): Promise<LineupRule | undefined> {
    const result = await db.select().from(lineupRules).where(eq(lineupRules.id, id));
    return result[0];
  }

  async createLineupRule(rule: InsertLineupRule): Promise<LineupRule> {
    const result = await db.insert(lineupRules).values(rule).returning();
    return result[0];
  }

  async updateLineupRule(id: string, updates: Partial<InsertLineupRule>): Promise<LineupRule | undefined> {
    const result = await db.update(lineupRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lineupRules.id, id))
      .returning();
    return result[0];
  }

  async deleteLineupRule(id: string): Promise<void> {
    await db.delete(lineupRules).where(eq(lineupRules.id, id));
  }

  // PWD Restrictions
  async getAllPwdRestrictions(): Promise<PwdRestriction[]> {
    return await db.select().from(pwdRestrictions).orderBy(desc(pwdRestrictions.createdAt));
  }

  async getActivePwdRestrictions(): Promise<PwdRestriction[]> {
    const now = new Date();
    return await db.select().from(pwdRestrictions)
      .where(
        or(
          isNull(pwdRestrictions.expiresAt),
          gte(pwdRestrictions.expiresAt, now)
        )
      )
      .orderBy(desc(pwdRestrictions.createdAt));
  }

  async getPwdRestriction(id: string): Promise<PwdRestriction | undefined> {
    const result = await db.select().from(pwdRestrictions).where(eq(pwdRestrictions.id, id));
    return result[0];
  }

  async getArtistPwdRestrictions(artistId: string): Promise<PwdRestriction[]> {
    const now = new Date();
    return await db.select().from(pwdRestrictions)
      .where(
        and(
          eq(pwdRestrictions.artistId, artistId),
          or(
            isNull(pwdRestrictions.expiresAt),
            gte(pwdRestrictions.expiresAt, now)
          )
        )
      )
      .orderBy(desc(pwdRestrictions.createdAt));
  }

  async createPwdRestriction(restriction: InsertPwdRestriction): Promise<PwdRestriction> {
    const result = await db.insert(pwdRestrictions).values(restriction).returning();
    return result[0];
  }

  async updatePwdRestriction(id: string, updates: Partial<InsertPwdRestriction>): Promise<PwdRestriction | undefined> {
    const result = await db.update(pwdRestrictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pwdRestrictions.id, id))
      .returning();
    return result[0];
  }

  async deletePwdRestriction(id: string): Promise<void> {
    await db.delete(pwdRestrictions).where(eq(pwdRestrictions.id, id));
  }

  // Training Programs
  async getAllTrainingPrograms(): Promise<TrainingProgram[]> {
    return await db.select().from(trainingPrograms)
      .where(eq(trainingPrograms.isTemplate, 0))
      .orderBy(desc(trainingPrograms.createdAt));
  }

  async getTrainingProgram(id: string): Promise<TrainingProgram | undefined> {
    const result = await db.select().from(trainingPrograms).where(eq(trainingPrograms.id, id));
    return result[0];
  }

  async getTrainingProgramTemplates(): Promise<TrainingProgram[]> {
    return await db.select().from(trainingPrograms)
      .where(eq(trainingPrograms.isTemplate, 1))
      .orderBy(asc(trainingPrograms.name));
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const result = await db.insert(trainingPrograms).values(program).returning();
    return result[0];
  }

  async updateTrainingProgram(id: string, updates: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined> {
    const result = await db.update(trainingPrograms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingPrograms.id, id))
      .returning();
    return result[0];
  }

  async deleteTrainingProgram(id: string): Promise<void> {
    await db.delete(trainingPrograms).where(eq(trainingPrograms.id, id));
  }

  async createProgramFromTemplate(templateId: string, name: string, userId?: string): Promise<TrainingProgram> {
    const template = await this.getTrainingProgram(templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    if (template.isTemplate !== 1) {
      throw new Error("Cannot create program from non-template");
    }

    const newProgram = await this.createTrainingProgram({
      name,
      competencyId: template.competencyId,
      isTemplate: 0,
      createdBy: userId,
    });

    const templateSteps = await this.getProgramSteps(templateId);
    for (const step of templateSteps) {
      await this.createProgramStep({
        programId: newProgram.id,
        name: step.name,
        departmentId: step.departmentId,
        stepType: step.stepType as "technical" | "induction" | "rehearsal" | "show_validation",
        departmentSignOffId: step.departmentSignOffId,
        conditions: step.conditions as "work_lights" | "show_conditions" | undefined,
        description: step.description,
        expectedDurationMinutes: step.expectedDurationMinutes,
        sortOrder: step.sortOrder,
      });
    }

    return newProgram;
  }

  // Program Steps
  async getProgramSteps(programId: string): Promise<ProgramStep[]> {
    return await db.select().from(programSteps)
      .where(eq(programSteps.programId, programId))
      .orderBy(asc(programSteps.sortOrder));
  }

  async getProgramStep(id: string): Promise<ProgramStep | undefined> {
    const result = await db.select().from(programSteps).where(eq(programSteps.id, id));
    return result[0];
  }

  async createProgramStep(step: InsertProgramStep): Promise<ProgramStep> {
    const result = await db.insert(programSteps).values(step).returning();
    return result[0];
  }

  async updateProgramStep(id: string, updates: Partial<InsertProgramStep>): Promise<ProgramStep | undefined> {
    const result = await db.update(programSteps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(programSteps.id, id))
      .returning();
    return result[0];
  }

  async deleteProgramStep(id: string): Promise<void> {
    await db.delete(programSteps).where(eq(programSteps.id, id));
  }

  // Program Artists
  async getProgramArtists(programId: string): Promise<ProgramArtist[]> {
    return await db.select().from(programArtists)
      .where(eq(programArtists.programId, programId))
      .orderBy(asc(programArtists.createdAt));
  }

  async getProgramArtist(id: string): Promise<ProgramArtist | undefined> {
    const result = await db.select().from(programArtists).where(eq(programArtists.id, id));
    return result[0];
  }

  async getArtistPrograms(artistId: string): Promise<ProgramArtist[]> {
    return await db.select().from(programArtists)
      .where(eq(programArtists.artistId, artistId))
      .orderBy(desc(programArtists.lastActivityAt));
  }

  async createProgramArtist(programArtist: InsertProgramArtist): Promise<ProgramArtist> {
    const result = await db.insert(programArtists).values(programArtist).returning();
    return result[0];
  }

  async updateProgramArtist(id: string, updates: Partial<InsertProgramArtist>): Promise<ProgramArtist | undefined> {
    const result = await db.update(programArtists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(programArtists.id, id))
      .returning();
    return result[0];
  }

  async deleteProgramArtist(id: string): Promise<void> {
    await db.delete(programArtists).where(eq(programArtists.id, id));
  }

  // Step Status Records
  async getStepStatusRecords(programArtistId: string): Promise<StepStatusRecord[]> {
    return await db.select().from(stepStatusRecords)
      .where(eq(stepStatusRecords.programArtistId, programArtistId))
      .orderBy(asc(stepStatusRecords.createdAt));
  }

  async getStepStatusRecord(id: string): Promise<StepStatusRecord | undefined> {
    const result = await db.select().from(stepStatusRecords).where(eq(stepStatusRecords.id, id));
    return result[0];
  }

  async createStepStatusRecord(record: InsertStepStatusRecord): Promise<StepStatusRecord> {
    const result = await db.insert(stepStatusRecords).values(record).returning();
    return result[0];
  }

  async updateStepStatusRecord(id: string, updates: Partial<InsertStepStatusRecord>): Promise<StepStatusRecord | undefined> {
    const result = await db.update(stepStatusRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stepStatusRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteStepStatusRecord(id: string): Promise<void> {
    await db.delete(stepStatusRecords).where(eq(stepStatusRecords.id, id));
  }

  // Final Validations
  async getFinalValidation(programArtistId: string): Promise<FinalValidation | undefined> {
    const result = await db.select().from(finalValidations)
      .where(eq(finalValidations.programArtistId, programArtistId));
    return result[0];
  }

  async createFinalValidation(validation: InsertFinalValidation): Promise<FinalValidation> {
    const result = await db.insert(finalValidations).values(validation).returning();
    return result[0];
  }

  async deleteFinalValidation(id: string): Promise<void> {
    await db.delete(finalValidations).where(eq(finalValidations.id, id));
  }

  // Audit Trail
  async getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]> {
    return await db.select().from(auditTrail)
      .where(
        and(
          eq(auditTrail.entityType, entityType),
          eq(auditTrail.entityId, entityId)
        )
      )
      .orderBy(desc(auditTrail.createdAt));
  }

  async createAuditTrail(entry: InsertAuditTrail): Promise<AuditTrail> {
    const result = await db.insert(auditTrail).values(entry).returning();
    return result[0];
  }

  // Artist Competencies
  async getArtistCompetencies(artistId: string): Promise<ArtistCompetency[]> {
    return await db.select().from(artistCompetencies)
      .where(eq(artistCompetencies.artistId, artistId))
      .orderBy(asc(artistCompetencies.createdAt));
  }

  async getArtistCompetency(id: string): Promise<ArtistCompetency | undefined> {
    const result = await db.select().from(artistCompetencies).where(eq(artistCompetencies.id, id));
    return result[0];
  }

  async getCompetencyArtists(competencyId: string): Promise<ArtistCompetency[]> {
    return await db.select().from(artistCompetencies)
      .where(eq(artistCompetencies.competencyId, competencyId))
      .orderBy(asc(artistCompetencies.createdAt));
  }

  async createArtistCompetency(competency: InsertArtistCompetency): Promise<ArtistCompetency> {
    const result = await db.insert(artistCompetencies).values(competency).returning();
    return result[0];
  }

  async updateArtistCompetency(id: string, updates: Partial<InsertArtistCompetency>): Promise<ArtistCompetency | undefined> {
    const result = await db.update(artistCompetencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(artistCompetencies.id, id))
      .returning();
    return result[0];
  }

  async deleteArtistCompetency(id: string): Promise<void> {
    await db.delete(artistCompetencies).where(eq(artistCompetencies.id, id));
  }

  async checkExpiredCompetencies(): Promise<void> {
    const now = new Date();
    // Mark competencies as expired if expiresAt is in the past
    await db.update(artistCompetencies)
      .set({ expired: 1, updatedAt: now })
      .where(
        and(
          isNotNull(artistCompetencies.expiresAt),
          lte(artistCompetencies.expiresAt, now),
          eq(artistCompetencies.expired, 0)
        )
      );
  }

  // Meeting Templates
  async getAllMeetingTemplates(): Promise<MeetingTemplate[]> {
    return await db.select().from(meetingTemplates).orderBy(asc(meetingTemplates.sortOrder));
  }

  async getActiveMeetingTemplates(): Promise<MeetingTemplate[]> {
    return await db.select().from(meetingTemplates)
      .where(eq(meetingTemplates.isActive, 1))
      .orderBy(asc(meetingTemplates.sortOrder));
  }

  async getActiveMeetingTemplatesForUser(userId: string): Promise<MeetingTemplate[]> {
    // Get user's template permissions
    const permissions = await db.select().from(userMeetingTemplatePermissions)
      .where(
        and(
          eq(userMeetingTemplatePermissions.userId, userId),
          eq(userMeetingTemplatePermissions.canView, 1)
        )
      );
    
    // CRITICAL: If no permissions, return empty array immediately
    // Do NOT query templates with empty inArray as it may return all rows
    if (permissions.length === 0) {
      return [];
    }
    
    const templateIds = permissions.map(p => p.templateId);
    
    // CRITICAL: Double-check templateIds is not empty before using inArray
    if (templateIds.length === 0) {
      return [];
    }
    
    // Get active templates the user has access to
    return await db.select().from(meetingTemplates)
      .where(
        and(
          eq(meetingTemplates.isActive, 1),
          inArray(meetingTemplates.id, templateIds)
        )
      )
      .orderBy(asc(meetingTemplates.sortOrder));
  }

  async getAllMeetingTemplatesWithFields(): Promise<Array<MeetingTemplate & { fields: MeetingTemplateField[] }>> {
    // Fetch all templates
    const templates = await db.select().from(meetingTemplates).orderBy(asc(meetingTemplates.sortOrder));
    
    // Fetch all fields in a single query
    const allFields = await db.select().from(meetingTemplateFields).orderBy(asc(meetingTemplateFields.sortOrder));
    
    // Group fields by templateId  
    const fieldsByTemplate = new Map<string, MeetingTemplateField[]>();
    for (const field of allFields) {
      if (!fieldsByTemplate.has(field.templateId)) {
        fieldsByTemplate.set(field.templateId, []);
      }
      fieldsByTemplate.get(field.templateId)!.push(field);
    }
    
    // Combine templates with their fields
    return templates.map(template => ({
      ...template,
      fields: fieldsByTemplate.get(template.id) || [],
    }));
  }

  async getMeetingTemplate(id: string): Promise<MeetingTemplate | undefined> {
    const result = await db.select().from(meetingTemplates).where(eq(meetingTemplates.id, id));
    return result[0];
  }

  async createMeetingTemplate(template: InsertMeetingTemplate): Promise<MeetingTemplate> {
    const result = await db.insert(meetingTemplates).values(template).returning();
    return result[0];
  }

  async updateMeetingTemplate(id: string, updates: Partial<InsertMeetingTemplate>): Promise<MeetingTemplate | undefined> {
    const result = await db.update(meetingTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetingTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteMeetingTemplate(id: string): Promise<void> {
    await db.delete(meetingTemplates).where(eq(meetingTemplates.id, id));
  }

  async reorderMeetingTemplates(templatesWithOrder: Array<{id: string; sortOrder: number}>): Promise<void> {
    await Promise.all(
      templatesWithOrder.map(({ id, sortOrder }) =>
        db.update(meetingTemplates)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(meetingTemplates.id, id))
      )
    );
  }

  // Meeting Template Fields
  async getTemplateFields(templateId: string): Promise<MeetingTemplateField[]> {
    return await db.select().from(meetingTemplateFields)
      .where(eq(meetingTemplateFields.templateId, templateId))
      .orderBy(asc(meetingTemplateFields.sortOrder));
  }

  async getMeetingTemplateField(id: string): Promise<MeetingTemplateField | undefined> {
    const result = await db.select().from(meetingTemplateFields).where(eq(meetingTemplateFields.id, id));
    return result[0];
  }

  async createMeetingTemplateField(field: InsertMeetingTemplateField): Promise<MeetingTemplateField> {
    const result = await db.insert(meetingTemplateFields).values(field).returning();
    return result[0];
  }

  async updateMeetingTemplateField(id: string, updates: Partial<InsertMeetingTemplateField>): Promise<MeetingTemplateField | undefined> {
    const result = await db.update(meetingTemplateFields)
      .set(updates)
      .where(eq(meetingTemplateFields.id, id))
      .returning();
    return result[0];
  }

  async deleteMeetingTemplateField(id: string): Promise<void> {
    await db.delete(meetingTemplateFields).where(eq(meetingTemplateFields.id, id));
  }

  async reorderTemplateFields(fieldsWithOrder: Array<{id: string; sortOrder: number}>): Promise<void> {
    await Promise.all(
      fieldsWithOrder.map(({ id, sortOrder }) =>
        db.update(meetingTemplateFields)
          .set({ sortOrder })
          .where(eq(meetingTemplateFields.id, id))
      )
    );
  }

  // Meetings
  async getAllMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(desc(meetings.meetingDate));
  }

  async getMeetingsForUser(userId: string, options?: { limit?: number; offset?: number }): Promise<Meeting[]> {
    // Get user's template permissions
    const permissions = await db.select().from(userMeetingTemplatePermissions)
      .where(
        and(
          eq(userMeetingTemplatePermissions.userId, userId),
          eq(userMeetingTemplatePermissions.canView, 1)
        )
      );
    
    // CRITICAL: If no permissions, return empty array immediately
    // Do NOT query meetings with empty inArray as it may return all rows
    if (permissions.length === 0) {
      return [];
    }
    
    const templateIds = permissions.map(p => p.templateId);
    
    // CRITICAL: Double-check templateIds is not empty before using inArray
    if (templateIds.length === 0) {
      return [];
    }
    
    // Get meetings for templates the user has access to
    const baseQuery = db.select().from(meetings)
      .where(inArray(meetings.templateId, templateIds))
      .orderBy(desc(meetings.meetingDate));
    
    // Apply pagination if requested
    if (options?.limit !== undefined && options?.offset !== undefined) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit !== undefined) {
      return await baseQuery.limit(options.limit);
    } else if (options?.offset !== undefined) {
      return await baseQuery.offset(options.offset);
    }
    
    return await baseQuery;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const result = await db.select().from(meetings).where(eq(meetings.id, id));
    return result[0];
  }

  async getMeetingsByTemplate(templateId: string, options?: { limit?: number; offset?: number }): Promise<Meeting[]> {
    const baseQuery = db.select().from(meetings)
      .where(eq(meetings.templateId, templateId))
      .orderBy(desc(meetings.meetingDate));
    
    // Apply pagination if requested
    if (options?.limit !== undefined && options?.offset !== undefined) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit !== undefined) {
      return await baseQuery.limit(options.limit);
    } else if (options?.offset !== undefined) {
      return await baseQuery.offset(options.offset);
    }
    
    return await baseQuery;
  }

  async canUserAccessTemplate(userId: string, templateId: string, permission: 'view' | 'create' | 'edit'): Promise<boolean> {
    const perm = await this.getUserTemplatePermission(userId, templateId);
    
    if (!perm) {
      return false;
    }
    
    switch (permission) {
      case 'view':
        return perm.canView === 1;
      case 'create':
        return perm.canCreate === 1;
      case 'edit':
        return perm.canEdit === 1;
      default:
        return false;
    }
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(meeting).returning();
    return result[0];
  }

  async updateMeeting(id: string, updates: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const result = await db.update(meetings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return result[0];
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Meeting Field Values
  async getMeetingFieldValues(meetingId: string): Promise<MeetingFieldValue[]> {
    return await db.select().from(meetingFieldValues)
      .where(eq(meetingFieldValues.meetingId, meetingId));
  }

  async getMeetingFieldValue(meetingId: string, fieldId: string): Promise<MeetingFieldValue | undefined> {
    const result = await db.select().from(meetingFieldValues)
      .where(
        and(
          eq(meetingFieldValues.meetingId, meetingId),
          eq(meetingFieldValues.fieldId, fieldId)
        )
      );
    return result[0];
  }

  async upsertMeetingFieldValue(value: InsertMeetingFieldValue): Promise<MeetingFieldValue> {
    const existing = await this.getMeetingFieldValue(value.meetingId, value.fieldId);
    
    if (existing) {
      // Explicitly set all value columns to ensure mutually-exclusive semantics
      const result = await db.update(meetingFieldValues)
        .set({ 
          textValue: value.textValue ?? null,
          attendeeIds: value.attendeeIds ?? null,
          locationId: value.locationId ?? null,
          updatedAt: new Date() 
        })
        .where(eq(meetingFieldValues.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(meetingFieldValues).values(value).returning();
      return result[0];
    }
  }

  async deleteMeetingFieldValue(id: string): Promise<void> {
    await db.delete(meetingFieldValues).where(eq(meetingFieldValues.id, id));
  }

  // User Meeting Template Permissions
  async getUserTemplatePermissions(userId: string): Promise<UserMeetingTemplatePermission[]> {
    return await db.select().from(userMeetingTemplatePermissions)
      .where(eq(userMeetingTemplatePermissions.userId, userId));
  }

  async getUserTemplatePermission(userId: string, templateId: string): Promise<UserMeetingTemplatePermission | undefined> {
    const result = await db.select().from(userMeetingTemplatePermissions)
      .where(
        and(
          eq(userMeetingTemplatePermissions.userId, userId),
          eq(userMeetingTemplatePermissions.templateId, templateId)
        )
      );
    return result[0];
  }

  async getAllTemplatePermissions(): Promise<UserMeetingTemplatePermission[]> {
    return await db.select().from(userMeetingTemplatePermissions);
  }

  async upsertUserTemplatePermission(permission: InsertUserMeetingTemplatePermission): Promise<UserMeetingTemplatePermission> {
    const result = await db.insert(userMeetingTemplatePermissions)
      .values(permission)
      .onConflictDoUpdate({
        target: [userMeetingTemplatePermissions.userId, userMeetingTemplatePermissions.templateId],
        set: {
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async deleteUserTemplatePermission(userId: string, templateId: string): Promise<void> {
    await db.delete(userMeetingTemplatePermissions)
      .where(
        and(
          eq(userMeetingTemplatePermissions.userId, userId),
          eq(userMeetingTemplatePermissions.templateId, templateId)
        )
      );
  }

  async bulkUpsertUserTemplatePermissions(userId: string, permissions: any[]): Promise<void> {
    if (permissions.length === 0) return;
    
    // Ensure userId is set on each permission object by explicitly constructing new objects
    const permissionsWithUserId = permissions.map(permission => ({
      userId: userId,
      templateId: permission.templateId,
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
    }));
    
    await Promise.all(
      permissionsWithUserId.map(permission => this.upsertUserTemplatePermission(permission))
    );
  }
}

export const storage = new DatabaseStorage();
