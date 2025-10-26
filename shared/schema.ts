import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const userRoles = ['admin', 'stage_management', 'coaching', 'performance_wellness', 'read_only'] as const;
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
  name: text("name"),
  position: text("position"),
  pronouns: text("pronouns"),
  role: text("role").notNull().default('stage_management'), // admin, stage_management, coaching, performance_wellness, read_only
  active: integer("active").notNull().default(1), // 1 = active, 0 = inactive
  userGroupId: varchar("user_group_id").references(() => userGroups.id),
  outlookConnected: integer("outlook_connected").notNull().default(0), // 0 = not connected, 1 = connected
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
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

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
});

export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof technicians.$inferSelect;

// Technician Departments (junction table for many-to-many relationship)
export const technicianDepartments = pgTable("technician_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianDepartmentSchema = createInsertSchema(technicianDepartments).omit({
  id: true,
  createdAt: true,
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
