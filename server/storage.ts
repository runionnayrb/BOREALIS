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
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, asc, desc, inArray, and, gte, lte } from "drizzle-orm";
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
  getAllUsers(): Promise<User[]>;
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
  reorderActs(actIds: string[]): Promise<void>;
  
  // Act Departments
  getActDepartments(actId: string): Promise<ActDepartment[]>;
  setActDepartments(actId: string, departmentIds: string[]): Promise<void>;
  
  // Cues
  getAllCues(): Promise<Cue[]>;
  getCue(id: string): Promise<Cue | undefined>;
  createCue(cue: InsertCue): Promise<Cue>;
  updateCue(id: string, updates: Partial<InsertCue>): Promise<Cue | undefined>;
  deleteCue(id: string): Promise<void>;
  reorderCues(cueIds: string[]): Promise<void>;
  
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
  getAllArtists(): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | undefined>;
  getArtistByUserId(userId: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist | undefined>;
  deleteArtist(id: string): Promise<void>;
  
  // Act Artists
  getActArtists(actId: string): Promise<ActArtist[]>;
  setActArtists(actId: string, artistIds: string[]): Promise<void>;
  
  // Act Artist Groups
  getActArtistGroups(actId: string): Promise<ActArtistGroup[]>;
  setActArtistGroups(actId: string, artistGroupIds: string[]): Promise<void>;
  
  // Technicians
  getAllTechnicians(): Promise<Technician[]>;
  getTechnician(id: string): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: string): Promise<void>;
  
  // Technician Departments
  getTechnicianDepartments(technicianId: string): Promise<TechnicianDepartment[]>;
  setTechnicianDepartments(technicianId: string, departmentIds: string[]): Promise<void>;
  getTechniciansByDepartment(departmentId: string): Promise<Technician[]>;
  
  // Report Template
  getReportTemplate(): Promise<ReportTemplate | undefined>;
  updateReportTemplate(updates: Partial<InsertReportTemplate>, userId: string): Promise<ReportTemplate>;
  
  // Reports
  getAllReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  getReportByDate(date: string): Promise<Report | undefined>;
  createReport(report: InsertReport, userId: string): Promise<Report>;
  updateReport(id: string, updates: Partial<Omit<InsertReport, 'createdBy'>>, userId: string): Promise<Report | undefined>;
  deleteReport(id: string): Promise<void>;
  
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
  getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
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

  async reorderActs(actIds: string[]): Promise<void> {
    for (let i = 0; i < actIds.length; i++) {
      await db.update(acts).set({ sortOrder: i }).where(eq(acts.id, actIds[i]));
    }
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

  async reorderCues(cueIds: string[]): Promise<void> {
    for (let i = 0; i < cueIds.length; i++) {
      await db.update(cues).set({ sortOrder: i }).where(eq(cues.id, cueIds[i]));
    }
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
  async getAllArtists(): Promise<Artist[]> {
    return await db.select().from(artists).orderBy(asc(artists.sortOrder));
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.id, id));
    return result[0];
  }

  async getArtistByUserId(userId: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.userId, userId));
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

  async reorderArtists(artistIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < artistIds.length; i++) {
        await tx.update(artists).set({ sortOrder: i }).where(eq(artists.id, artistIds[i]));
      }
    });
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
  async getAllTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians);
  }

  async getTechnician(id: string): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id));
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
    await db.delete(technicians).where(eq(technicians.id, id));
  }

  // Technician Departments
  async getTechnicianDepartments(technicianId: string): Promise<TechnicianDepartment[]> {
    return await db.select().from(technicianDepartments).where(eq(technicianDepartments.technicianId, technicianId));
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

      // Delete existing assignments
      await tx.delete(technicianDepartments).where(eq(technicianDepartments.technicianId, technicianId));

      // Insert new assignments
      if (departmentIds.length > 0) {
        await tx.insert(technicianDepartments).values(
          departmentIds.map(departmentId => ({ technicianId, departmentId }))
        );
      }
    });
  }

  async getTechniciansByDepartment(departmentId: string): Promise<Technician[]> {
    const techDepts = await db.select().from(technicianDepartments).where(eq(technicianDepartments.departmentId, departmentId));
    if (techDepts.length === 0) return [];
    
    const technicianIds = techDepts.map(td => td.technicianId);
    return await db.select().from(technicians).where(inArray(technicians.id, technicianIds));
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
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.date));
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

  async getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.date, date));
  }

  async getAttendanceRecordsByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ))
      .orderBy(desc(attendanceRecords.date));
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
}

export const storage = new DatabaseStorage();
