import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const userRoles = ['admin', 'stage_management', 'coaching', 'performance_wellness', 'read_only', 'artist'] as const;
export type UserRole = typeof userRoles[number];

// User Groups
export const userGroups = pgTable("user_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroup = typeof userGroups.$inferSelect;

// Users/Stage Managers
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  artistName: text("artist_name"), // Stage name for artist accounts
  name: text("name"), // Full name (kept for backwards compatibility)
  position: text("position"),
  pronouns: text("pronouns"),
  role: text("role").notNull().default('stage_management'), // admin, stage_management, coaching, performance_wellness, read_only
  active: integer("active").notNull().default(1), // 1 = active, 0 = inactive
  userGroupId: varchar("user_group_id").references(() => userGroups.id),
  outlookConnected: integer("outlook_connected").notNull().default(0), // 0 = not connected, 1 = connected
  mustChangePassword: integer("must_change_password").notNull().default(0), // 1 = must change on next login, 0 = normal
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  artistName: true,
  userGroupId: true,
  name: true,
  position: true,
  pronouns: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Safe user type without sensitive fields (for client-side use)
export type SafeUser = Omit<User, 'password' | 'resetToken' | 'resetTokenExpiry'>;

// Scenes
export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
});

export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;

// Acts
export const acts = pgTable("acts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sceneId: varchar("scene_id").references(() => scenes.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActSchema = createInsertSchema(acts).omit({
  id: true,
  createdAt: true,
});

export type InsertAct = z.infer<typeof insertActSchema>;
export type Act = typeof acts.$inferSelect;

// Cue types
export const cueTypes = ['Acrobatic Cue', 'Artistic Cue', 'Technical Cue'] as const;
export type CueType = typeof cueTypes[number];

// Cues
export const cues = pgTable("cues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sceneId: varchar("scene_id").references(() => scenes.id),
  cueType: text("cue_type").notNull(), // 'Acrobatic Cue', 'Artistic Cue', 'Technical Cue'
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCueSchema = createInsertSchema(cues).omit({
  id: true,
  createdAt: true,
});

export type InsertCue = z.infer<typeof insertCueSchema>;
export type Cue = typeof cues.$inferSelect;

// Department types
export const departmentTypes = ['technical', 'artistic'] as const;
export type DepartmentType = typeof departmentTypes[number];

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default('technical'), // 'technical' or 'artistic'
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// Act Departments (junction table for many-to-many relationship)
export const actDepartments = pgTable("act_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actId: varchar("act_id").notNull().references(() => acts.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActDepartmentSchema = createInsertSchema(actDepartments).omit({
  id: true,
  createdAt: true,
});

export type InsertActDepartment = z.infer<typeof insertActDepartmentSchema>;
export type ActDepartment = typeof actDepartments.$inferSelect;

// Location Types
export const locationTypes = pgTable("location_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLocationTypeSchema = createInsertSchema(locationTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertLocationType = z.infer<typeof insertLocationTypeSchema>;
export type LocationType = typeof locationTypes.$inferSelect;

// Locations
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  locationTypeId: varchar("location_type_id").references(() => locationTypes.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Artist Groups
export const artistGroups = pgTable("artist_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArtistGroupSchema = createInsertSchema(artistGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertArtistGroup = z.infer<typeof insertArtistGroupSchema>;
export type ArtistGroup = typeof artistGroups.$inferSelect;

// Artist status types
export const artistStatuses = ['active', 'out', 'long_term_out'] as const;
export type ArtistStatus = typeof artistStatuses[number];

// Artists
export const artists = pgTable("artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  stageName: text("stage_name"),
  role: text("role"),
  photoUrl: text("photo_url"),
  pinCode: text("pin_code"), // Set by artist on first sign-in
  userId: varchar("user_id").references(() => users.id), // Linked user account for authentication
  status: text("status").notNull().default('active'), // active, out, long_term_out
  artistGroupId: varchar("artist_group_id").references(() => artistGroups.id),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
  archivedAt: true,
});

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

// Public artist type for sign-in page (excludes sensitive fields like pinCode)
export type PublicArtist = Omit<Artist, 'pinCode' | 'role' | 'createdAt'>;

// Act Artists (junction table for many-to-many relationship)
export const actArtists = pgTable("act_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actId: varchar("act_id").notNull().references(() => acts.id),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActArtistSchema = createInsertSchema(actArtists).omit({
  id: true,
  createdAt: true,
});

export type InsertActArtist = z.infer<typeof insertActArtistSchema>;
export type ActArtist = typeof actArtists.$inferSelect;

// Act Artist Groups (junction table for many-to-many relationship)
export const actArtistGroups = pgTable("act_artist_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actId: varchar("act_id").notNull().references(() => acts.id),
  artistGroupId: varchar("artist_group_id").notNull().references(() => artistGroups.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActArtistGroupSchema = createInsertSchema(actArtistGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertActArtistGroup = z.infer<typeof insertActArtistGroupSchema>;
export type ActArtistGroup = typeof actArtistGroups.$inferSelect;

// Cue Departments (junction table for many-to-many relationship)
export const cueDepartments = pgTable("cue_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cueId: varchar("cue_id").notNull().references(() => cues.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCueDepartmentSchema = createInsertSchema(cueDepartments).omit({
  id: true,
  createdAt: true,
});

export type InsertCueDepartment = z.infer<typeof insertCueDepartmentSchema>;
export type CueDepartment = typeof cueDepartments.$inferSelect;

// Cue Artists (junction table for many-to-many relationship)
export const cueArtists = pgTable("cue_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cueId: varchar("cue_id").notNull().references(() => cues.id),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCueArtistSchema = createInsertSchema(cueArtists).omit({
  id: true,
  createdAt: true,
});

export type InsertCueArtist = z.infer<typeof insertCueArtistSchema>;
export type CueArtist = typeof cueArtists.$inferSelect;

// Cue Artist Groups (junction table for many-to-many relationship)
export const cueArtistGroups = pgTable("cue_artist_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cueId: varchar("cue_id").notNull().references(() => cues.id),
  artistGroupId: varchar("artist_group_id").notNull().references(() => artistGroups.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCueArtistGroupSchema = createInsertSchema(cueArtistGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertCueArtistGroup = z.infer<typeof insertCueArtistGroupSchema>;
export type CueArtistGroup = typeof cueArtistGroups.$inferSelect;

// Scene Departments (junction table for many-to-many relationship)
export const sceneDepartments = pgTable("scene_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sceneId: varchar("scene_id").notNull().references(() => scenes.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSceneDepartmentSchema = createInsertSchema(sceneDepartments).omit({
  id: true,
  createdAt: true,
});

export type InsertSceneDepartment = z.infer<typeof insertSceneDepartmentSchema>;
export type SceneDepartment = typeof sceneDepartments.$inferSelect;

// Scene Artist Groups (junction table for many-to-many relationship)
export const sceneArtistGroups = pgTable("scene_artist_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sceneId: varchar("scene_id").notNull().references(() => scenes.id),
  artistGroupId: varchar("artist_group_id").notNull().references(() => artistGroups.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSceneArtistGroupSchema = createInsertSchema(sceneArtistGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertSceneArtistGroup = z.infer<typeof insertSceneArtistGroupSchema>;
export type SceneArtistGroup = typeof sceneArtistGroups.$inferSelect;

// Scene Artists (junction table for many-to-many relationship)
export const sceneArtists = pgTable("scene_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sceneId: varchar("scene_id").notNull().references(() => scenes.id),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSceneArtistSchema = createInsertSchema(sceneArtists).omit({
  id: true,
  createdAt: true,
});

export type InsertSceneArtist = z.infer<typeof insertSceneArtistSchema>;
export type SceneArtist = typeof sceneArtists.$inferSelect;

// Technicians
export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  technicianName: text("technician_name"),
  role: text("role"),
  photoUrl: text("photo_url"),
  userId: varchar("user_id").references(() => users.id), // Linked user account for authentication
  status: text("status").notNull().default('active'), // active, out, archived
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
  sortOrder: true,
  archivedAt: true,
});

export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof technicians.$inferSelect;

// Technician Departments (junction table for many-to-many relationship)
export const technicianDepartments = pgTable("technician_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianDepartmentSchema = createInsertSchema(technicianDepartments).omit({
  id: true,
  createdAt: true,
  sortOrder: true,
});

export type InsertTechnicianDepartment = z.infer<typeof insertTechnicianDepartmentSchema>;
export type TechnicianDepartment = typeof technicianDepartments.$inferSelect;

// Report Template
export const reportTemplate = pgTable("report_template", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leftImageUrl: text("left_image_url"),
  title: text("title").notNull(),
  rightImageUrl: text("right_image_url"),
  emailTo: text("email_to").array(),
  emailCc: text("email_cc").array(),
  emailBcc: text("email_bcc").array(),
  emailSubjectTemplate: text("email_subject_template"),
  emailBodyPrefix: text("email_body_prefix"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplate).omit({
  id: true,
  updatedAt: true,
});

export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplate.$inferSelect;

// Reports (one per day)
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  stageManagerOnDuty: text("stage_manager_on_duty"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Trainings
export const trainings = pgTable("trainings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  sceneId: varchar("scene_id").references(() => scenes.id), // Optional: for full scene trainings
  actId: varchar("act_id").references(() => acts.id), // Optional: for specific act trainings
  customName: text("custom_name"), // Optional: custom name for special trainings
  locationId: varchar("location_id").references(() => locations.id),
  stageManagerId: varchar("stage_manager_id").references(() => users.id), // Stage manager for this training
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  durationMinutes: integer("duration_minutes").notNull(),
  goal: text("goal"),
  goalNotes: text("goal_notes"),
  notes: text("notes"),
  followUpNotes: text("follow_up_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertTrainingSchema = createInsertSchema(trainings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => data.sceneId || data.actId,
  { message: "Either sceneId or actId must be provided" }
);

export const updateTrainingSchema = createInsertSchema(trainings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  reportId: true,
}).partial();

export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type UpdateTraining = z.infer<typeof updateTrainingSchema>;
export type Training = typeof trainings.$inferSelect;

// Training Locations (junction table for many-to-many relationship)
export const trainingLocations = pgTable("training_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainingId: varchar("training_id").notNull().references(() => trainings.id, { onDelete: "cascade" }),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingLocationSchema = createInsertSchema(trainingLocations).omit({
  id: true,
  createdAt: true,
});

export type InsertTrainingLocation = z.infer<typeof insertTrainingLocationSchema>;
export type TrainingLocation = typeof trainingLocations.$inferSelect;

// Department Assignments (per training)
export const departmentAssignments = pgTable("department_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainingId: varchar("training_id").notNull().references(() => trainings.id, { onDelete: "cascade" }),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  leadTechnicianId: varchar("lead_technician_id").references(() => technicians.id),
  notes: text("notes"),
});

export const insertDepartmentAssignmentSchema = createInsertSchema(departmentAssignments).omit({
  id: true,
});

export type InsertDepartmentAssignment = z.infer<typeof insertDepartmentAssignmentSchema>;
export type DepartmentAssignment = typeof departmentAssignments.$inferSelect;

// Training Artists (per training) - allows customizing artists for individual trainings
export const trainingArtists = pgTable("training_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainingId: varchar("training_id").notNull().references(() => trainings.id, { onDelete: "cascade" }),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingArtistSchema = createInsertSchema(trainingArtists).omit({
  id: true,
  createdAt: true,
});

export type InsertTrainingArtist = z.infer<typeof insertTrainingArtistSchema>;
export type TrainingArtist = typeof trainingArtists.$inferSelect;

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  signInTime: timestamp("sign_in_time"),
  signOutTime: timestamp("sign_out_time"),
  signedInBy: varchar("signed_in_by").references(() => users.id), // null if artist self-signed
  signedOutBy: varchar("signed_out_by").references(() => users.id), // null if artist self-signed
  signInLatitude: text("sign_in_latitude"), // Geolocation check
  signInLongitude: text("sign_in_longitude"),
  signOutLatitude: text("sign_out_latitude"),
  signOutLongitude: text("sign_out_longitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Geofence Sessions (for hysteresis logic)
export const geofenceSessions = pgTable("geofence_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  isInside: integer("is_inside").notNull().default(0), // 0 = outside, 1 = inside
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  lastLatitude: text("last_latitude"),
  lastLongitude: text("last_longitude"),
  lastAccuracy: text("last_accuracy"), // in meters
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGeofenceSessionSchema = createInsertSchema(geofenceSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertGeofenceSession = z.infer<typeof insertGeofenceSessionSchema>;
export type GeofenceSession = typeof geofenceSessions.$inferSelect;

// Tick Sheets (for meeting attendance)
export const tickSheets = pgTable("tick_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Morning Briefing"
  isActive: integer("is_active").notNull().default(1), // 1 = current, 0 = archived
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resetAt: timestamp("reset_at"), // Last time it was reset
});

export const insertTickSheetSchema = createInsertSchema(tickSheets).omit({
  id: true,
  createdAt: true,
});

export type InsertTickSheet = z.infer<typeof insertTickSheetSchema>;
export type TickSheet = typeof tickSheets.$inferSelect;

// Tick Sheet Marks (which artists are checked off)
export const tickSheetMarks = pgTable("tick_sheet_marks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tickSheetId: varchar("tick_sheet_id").notNull().references(() => tickSheets.id, { onDelete: "cascade" }),
  artistId: varchar("artist_id").notNull().references(() => artists.id),
  markedBy: varchar("marked_by").references(() => users.id),
  markedAt: timestamp("marked_at").notNull().defaultNow(),
});

export const insertTickSheetMarkSchema = createInsertSchema(tickSheetMarks).omit({
  id: true,
  markedAt: true,
});

export type InsertTickSheetMark = z.infer<typeof insertTickSheetMarkSchema>;
export type TickSheetMark = typeof tickSheetMarks.$inferSelect;

// Lineup Templates - reusable stage position layouts
export const lineupTemplates = pgTable("lineup_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "City", "Spaceship", "Desert Flower"
  sceneId: varchar("scene_id").references(() => scenes.id),
  actId: varchar("act_id").references(() => acts.id),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertLineupTemplateSchema = createInsertSchema(lineupTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertLineupTemplate = z.infer<typeof insertLineupTemplateSchema>;
export type LineupTemplate = typeof lineupTemplates.$inferSelect;

// Position Types - types of positions in a lineup (entry, inversion, zombie, character, etc.)
export const positionTypes = ['entry', 'inversion', 'character', 'zombie', 'bike', 'aerial', 'other'] as const;
export type PositionType = typeof positionTypes[number];

// Template Positions - positions within a lineup template
export const templatePositions = pgTable("template_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => lineupTemplates.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "VOM 5 ENTRY", "P2 DSR INVER. WALK", "King"
  label: text("label"), // Optional display label (e.g., position number "1", "2")
  type: text("type").notNull().default('other'), // entry, inversion, character, zombie, bike, aerial, other
  section: text("section"), // Grouping (e.g., "VOM 5 ENTRY", "DOOR ENTRY", "CHARACTERS")
  sortOrder: integer("sort_order").notNull().default(0),
  xPosition: integer("x_position"), // Visual positioning (optional)
  yPosition: integer("y_position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemplatePositionSchema = createInsertSchema(templatePositions).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplatePosition = z.infer<typeof insertTemplatePositionSchema>;
export type TemplatePosition = typeof templatePositions.$inferSelect;

// Show Lineups - specific show instances
export const showLineups = pgTable("show_lineups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showNumber: text("show_number").notNull(), // e.g., "#3445"
  showDate: text("show_date").notNull(), // YYYY-MM-DD
  showTime: text("show_time").notNull(), // HH:MM (e.g., "21:00")
  showcaller: varchar("showcaller_id").references(() => users.id),
  notes: text("notes"), // General show notes
  technicalNotes: text("technical_notes"), // Equipment/technical issues
  diveHeights: text("dive_heights"), // JSON object for dive heights
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertShowLineupSchema = createInsertSchema(showLineups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShowLineup = z.infer<typeof insertShowLineupSchema>;
export type ShowLineup = typeof showLineups.$inferSelect;

// EM Team Roles
export const emTeamRoles = ['DOD', 'CFW', 'PWD', 'SR PWD', 'CARPS', 'WARD', 'RIG', 'AQX', 'SM'] as const;
export type EmTeamRole = typeof emTeamRoles[number];

// Show EM Team Assignments
export const showEmTeam = pgTable("show_em_team", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showLineupId: varchar("show_lineup_id").notNull().references(() => showLineups.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // DOD, CFW, PWD, etc.
  technicianId: varchar("technician_id").references(() => technicians.id),
  name: text("name"), // In case technician is not in system
  location: text("location"), // e.g., "Vom 1", "Vom 4"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShowEmTeamSchema = createInsertSchema(showEmTeam).omit({
  id: true,
  createdAt: true,
});

export type InsertShowEmTeam = z.infer<typeof insertShowEmTeamSchema>;
export type ShowEmTeam = typeof showEmTeam.$inferSelect;

// Show Lineup Scenes - which template scenes are in this show
export const showLineupScenes = pgTable("show_lineup_scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showLineupId: varchar("show_lineup_id").notNull().references(() => showLineups.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull().references(() => lineupTemplates.id),
  sortOrder: integer("sort_order").notNull().default(0),
  sceneNotes: text("scene_notes"), // Notes specific to this scene in this show
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShowLineupSceneSchema = createInsertSchema(showLineupScenes).omit({
  id: true,
  createdAt: true,
});

export type InsertShowLineupScene = z.infer<typeof insertShowLineupSceneSchema>;
export type ShowLineupScene = typeof showLineupScenes.$inferSelect;

// Show Position Assignments - artist assignments to positions
export const showPositionAssignments = pgTable("show_position_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showLineupSceneId: varchar("show_lineup_scene_id").notNull().references(() => showLineupScenes.id, { onDelete: "cascade" }),
  positionId: varchar("position_id").notNull().references(() => templatePositions.id),
  artistId: varchar("artist_id").references(() => artists.id),
  artistNumber: text("artist_number"), // Artist's number (e.g., "114", "183")
  characterName: text("character_name"), // Override character name if different from template
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShowPositionAssignmentSchema = createInsertSchema(showPositionAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertShowPositionAssignment = z.infer<typeof insertShowPositionAssignmentSchema>;
export type ShowPositionAssignment = typeof showPositionAssignments.$inferSelect;

// Schedule Call Types
export const callTypes = ['show', 'rehearsal', 'training', 'fitting', 'meeting', 'medical', 'break', 'other'] as const;
export type CallType = typeof callTypes[number];

// Schedules - weekly/daily schedule
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Week 44", "Daily - Oct 29"
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  weekNumber: integer("week_number"),
  version: text("version").notNull().default("1.00"), // e.g., "V01.00"
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Schedule Calls - individual scheduled activities
export const scheduleCalls = pgTable("schedule_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull().references(() => schedules.id, { onDelete: "cascade" }),
  artistId: varchar("artist_id").references(() => artists.id),
  artistGroupId: varchar("artist_group_id").references(() => artistGroups.id), // For group calls
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  callType: text("call_type").notNull().default('other'), // show, rehearsal, training, fitting, etc.
  title: text("title").notNull(), // e.g., "Show 21:00", "Dry Rehearsal"
  location: text("location"),
  showLineupId: varchar("show_lineup_id").references(() => showLineups.id), // Link to show lineup if applicable
  color: text("color"), // Background color for visual coding
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScheduleCallSchema = createInsertSchema(scheduleCalls).omit({
  id: true,
  createdAt: true,
});

export type InsertScheduleCall = z.infer<typeof insertScheduleCallSchema>;
export type ScheduleCall = typeof scheduleCalls.$inferSelect;

// Feature names for permission system
export const featureNames = [
  'reports',
  'schedules', 
  'lineups',
  'lineups_positions',
  'lineups_competencies',
  'lineups_training_programs',
  'lineups_rules',
  'lineups_restrictions',
  'attendance_dashboard',
  'attendance_ticksheet',
  'attendance_signin',
  'settings_artists',
  'settings_departments',
  'settings_locations',
  'settings_technicians',
  'settings_acts',
  'settings_users',
  'settings_report_template',
] as const;
export type FeatureName = typeof featureNames[number];

// User Permissions - granular access control
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(), // e.g., 'reports', 'schedules', 'lineups', 'attendance_dashboard', etc.
  canView: integer("can_view").notNull().default(0), // 0 = no, 1 = yes
  canCreate: integer("can_create").notNull().default(0), // 0 = no, 1 = yes
  canEdit: integer("can_edit").notNull().default(0), // 0 = no, 1 = yes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userFeatureUnique: sql`UNIQUE (user_id, feature)`,
}));

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  feature: z.enum(featureNames),
  canView: z.number().min(0).max(1),
  canCreate: z.number().min(0).max(1),
  canEdit: z.number().min(0).max(1),
});

export const updateUserPermissionSchema = insertUserPermissionSchema.partial();

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UpdateUserPermission = z.infer<typeof updateUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// System Settings - configurable application settings
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(), // e.g., 'geofence_latitude', 'pdf_margin_top', 'pagination_limit'
  settingValue: text("setting_value").notNull(), // JSON string for complex values
  settingType: text("setting_type").notNull(), // 'string', 'number', 'boolean', 'json'
  category: text("category").notNull(), // 'geofence', 'pdf', 'performance', 'security', 'features'
  description: text("description"), // Human-readable description
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// ========== LINEUP FOUNDATION TABLES ==========

// Department Roles - HOD/AHOD/Lead assignments
export const departmentRoleTypes = ['hod', 'ahod', 'lead'] as const;
export type DepartmentRoleType = typeof departmentRoleTypes[number];

export const departmentRoles = pgTable("department_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id, { onDelete: "cascade" }),
  roleType: text("role_type").notNull(), // 'hod', 'ahod', 'lead'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDepartmentRoleSchema = createInsertSchema(departmentRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  roleType: z.enum(departmentRoleTypes),
});

export type InsertDepartmentRole = z.infer<typeof insertDepartmentRoleSchema>;
export type DepartmentRole = typeof departmentRoles.$inferSelect;

// Competencies - What artists need to qualify for positions
export const competencies = pgTable("competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  description: text("description"),
  expirationDays: integer("expiration_days").notNull().default(90), // Days until competency expires
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertCompetencySchema = createInsertSchema(competencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompetency = z.infer<typeof insertCompetencySchema>;
export type Competency = typeof competencies.$inferSelect;

// Positions - Building blocks of lineups
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sceneId: varchar("scene_id").references(() => scenes.id),
  actId: varchar("act_id").references(() => acts.id),
  cueId: varchar("cue_id").references(() => cues.id),
  departmentId: varchar("department_id").references(() => departments.id),
  maxAssignees: integer("max_assignees"), // null = unlimited
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Position Competencies - Required competencies for positions
export const positionCompetencies = pgTable("position_competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  competencyId: varchar("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPositionCompetencySchema = createInsertSchema(positionCompetencies).omit({
  id: true,
  createdAt: true,
});

export type InsertPositionCompetency = z.infer<typeof insertPositionCompetencySchema>;
export type PositionCompetency = typeof positionCompetencies.$inferSelect;

// Position Tracks - Linked positions for auto-assign
export const positionTracks = pgTable("position_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Pearl Girl Track"
  description: text("description"),
  autoAssign: integer("auto_assign").notNull().default(1), // 1 = auto-assign all positions in track, 0 = manual
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPositionTrackSchema = createInsertSchema(positionTracks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPositionTrack = z.infer<typeof insertPositionTrackSchema>;
export type PositionTrack = typeof positionTracks.$inferSelect;

// Track Positions - Positions in a track
export const trackPositions = pgTable("track_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => positionTracks.id, { onDelete: "cascade" }),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrackPositionSchema = createInsertSchema(trackPositions).omit({
  id: true,
  createdAt: true,
});

export type InsertTrackPosition = z.infer<typeof insertTrackPositionSchema>;
export type TrackPosition = typeof trackPositions.$inferSelect;

// Lineup Rules - Constraints and validations for assignments
export const ruleTypes = ['scene_conflict', 'character_exclusion', 'time_conflict', 'custom'] as const;
export type RuleType = typeof ruleTypes[number];

export const ruleSeverities = ['hard_block', 'warning'] as const;
export type RuleSeverity = typeof ruleSeverities[number];

export const lineupRules = pgTable("lineup_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(), // 'scene_conflict', 'character_exclusion', 'time_conflict', 'custom'
  severity: text("severity").notNull(), // 'hard_block', 'warning'
  description: text("description"),
  conditionData: text("condition_data").notNull(), // JSON string with rule conditions
  active: integer("active").notNull().default(1), // 1 = active, 0 = disabled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertLineupRuleSchema = createInsertSchema(lineupRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ruleType: z.enum(ruleTypes),
  severity: z.enum(ruleSeverities),
});

export type InsertLineupRule = z.infer<typeof insertLineupRuleSchema>;
export type LineupRule = typeof lineupRules.$inferSelect;

// PWD Restrictions - Read-only view for Stage Management
export const restrictionTypes = ['hard', 'soft'] as const;
export type RestrictionType = typeof restrictionTypes[number];

export const pwdRestrictions = pgTable("pwd_restrictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  restrictionType: text("restriction_type").notNull(), // 'hard', 'soft'
  scope: text("scope").notNull(), // JSON string defining what's restricted (positions, scenes, etc.)
  reason: text("reason"),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"), // null = no expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPwdRestrictionSchema = createInsertSchema(pwdRestrictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  restrictionType: z.enum(restrictionTypes),
});

export type InsertPwdRestriction = z.infer<typeof insertPwdRestrictionSchema>;
export type PwdRestriction = typeof pwdRestrictions.$inferSelect;

// Training Programs - The foundation that validates competencies
export const programTypes = ['induction', 'technical', 'rehearsal', 'show_validation'] as const;
export type ProgramType = typeof programTypes[number];

export const trainingPrograms = pgTable("training_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sceneId: varchar("scene_id").references(() => scenes.id),
  actId: varchar("act_id").references(() => acts.id),
  cueId: varchar("cue_id").references(() => cues.id),
  competencyId: varchar("competency_id").references(() => competencies.id), // Competency awarded upon completion
  colorTag: text("color_tag"), // 'green' for Act, 'yellow' for Cue, 'orange' for Acrobatic Cue
  isTemplate: integer("is_template").notNull().default(0), // 1 = template, 0 = active program
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;

// Program Steps - Ordered steps in a training program
export const stepConditions = ['work_lights', 'show_conditions'] as const;
export type StepCondition = typeof stepConditions[number];

export const signOffAuthorities = ['hod', 'ahod', 'lead'] as const;
export type SignOffAuthority = typeof signOffAuthorities[number];

export const programSteps = pgTable("program_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => trainingPrograms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  departmentId: varchar("department_id").notNull().references(() => departments.id), // Owning department
  stepType: text("step_type").notNull(), // 'induction', 'technical', 'rehearsal', 'show_validation'
  conditions: text("conditions"), // 'work_lights', 'show_conditions'
  prerequisiteStepIds: text("prerequisite_step_ids").array(), // Array of step IDs that must be completed first
  signOffAuthority: text("sign_off_authority").notNull(), // 'hod', 'ahod', 'lead'
  notes: text("notes"),
  expectedDurationMinutes: integer("expected_duration_minutes"),
  attachmentUrl: text("attachment_url"), // Optional reference photo or guide
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProgramStepSchema = createInsertSchema(programSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  stepType: z.enum(programTypes),
  conditions: z.enum(stepConditions).optional(),
  signOffAuthority: z.enum(signOffAuthorities),
});

export type InsertProgramStep = z.infer<typeof insertProgramStepSchema>;
export type ProgramStep = typeof programSteps.$inferSelect;

// Program Artists - Artists enrolled in a training program
export const programArtistStatuses = ['not_started', 'in_progress', 'complete'] as const;
export type ProgramArtistStatus = typeof programArtistStatuses[number];

export const programArtists = pgTable("program_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => trainingPrograms.id, { onDelete: "cascade" }),
  artistId: varchar("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  status: text("status").notNull().default('not_started'), // 'not_started', 'in_progress', 'complete'
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  programArtistUnique: sql`UNIQUE (program_id, artist_id)`,
}));

export const insertProgramArtistSchema = createInsertSchema(programArtists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
}).extend({
  status: z.enum(programArtistStatuses).optional(),
});

export type InsertProgramArtist = z.infer<typeof insertProgramArtistSchema>;
export type ProgramArtist = typeof programArtists.$inferSelect;

// Step Statuses - Status of each step for each artist
export const stepStatuses = ['not_started', 'in_progress', 'complete'] as const;
export type StepStatus = typeof stepStatuses[number];

export const stepStatusRecords = pgTable("step_status_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programArtistId: varchar("program_artist_id").notNull().references(() => programArtists.id, { onDelete: "cascade" }),
  stepId: varchar("step_id").notNull().references(() => programSteps.id, { onDelete: "cascade" }),
  status: text("status").notNull().default('not_started'), // 'not_started', 'in_progress', 'complete'
  signedOffBy: varchar("signed_off_by").references(() => users.id),
  signedOffRole: text("signed_off_role"), // 'hod', 'ahod', 'lead'
  signedOffAt: timestamp("signed_off_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  programArtistStepUnique: sql`UNIQUE (program_artist_id, step_id)`,
}));

export const insertStepStatusRecordSchema = createInsertSchema(stepStatusRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(stepStatuses).optional(),
  signedOffRole: z.enum(signOffAuthorities).optional(),
});

export type InsertStepStatusRecord = z.infer<typeof insertStepStatusRecordSchema>;
export type StepStatusRecord = typeof stepStatusRecords.$inferSelect;

// Final Validations - Stage Management final validation
export const finalValidations = pgTable("final_validations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programArtistId: varchar("program_artist_id").notNull().references(() => programArtists.id, { onDelete: "cascade" }).unique(),
  validatedBy: varchar("validated_by").notNull().references(() => users.id),
  validatedAt: timestamp("validated_at").notNull().defaultNow(),
  conditions: text("conditions").notNull(), // 'show_conditions'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinalValidationSchema = createInsertSchema(finalValidations).omit({
  id: true,
  createdAt: true,
  validatedAt: true,
});

export type InsertFinalValidation = z.infer<typeof insertFinalValidationSchema>;
export type FinalValidation = typeof finalValidations.$inferSelect;

// Audit Trail - Complete audit log for all actions
export const auditActions = [
  'created_program',
  'edited_program',
  'created_step',
  'edited_step',
  'deleted_step',
  'added_artist',
  'removed_artist',
  'signed_off_step',
  'reverted_sign_off',
  'final_validation',
  'reverted_validation',
] as const;
export type AuditAction = typeof auditActions[number];

export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // 'training_program', 'program_step', 'step_status', etc.
  entityId: varchar("entity_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  userRole: text("user_role"), // 'hod', 'ahod', 'lead', 'stage_management'
  action: text("action").notNull(),
  note: text("note"),
  metadata: text("metadata"), // JSON string with additional context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  createdAt: true,
}).extend({
  action: z.enum(auditActions),
});

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

// Artist Competencies - Competencies earned by artists with expiration tracking
export const artistCompetencies = pgTable("artist_competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  competencyId: varchar("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  programArtistId: varchar("program_artist_id").references(() => programArtists.id), // Link to training that awarded it
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  lastPerformedAt: timestamp("last_performed_at"), // Track for expiration
  expiresAt: timestamp("expires_at"), // Computed based on lastPerformedAt + expirationDays
  expired: integer("expired").notNull().default(0), // 1 = expired, 0 = valid
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  artistCompetencyUnique: sql`UNIQUE (artist_id, competency_id)`,
}));

export const insertArtistCompetencySchema = createInsertSchema(artistCompetencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  awardedAt: true,
});

export type InsertArtistCompetency = z.infer<typeof insertArtistCompetencySchema>;
export type ArtistCompetency = typeof artistCompetencies.$inferSelect;
