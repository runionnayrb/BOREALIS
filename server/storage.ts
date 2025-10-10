import { 
  type User, type InsertUser, users,
  type Act, type InsertAct, acts,
  type Department, type InsertDepartment, departments,
  type Location, type InsertLocation, locations,
  type ArtistGroup, type InsertArtistGroup, artistGroups,
  type Artist, type InsertArtist, artists,
  type Technician, type InsertTechnician, technicians,
  type ReportTemplate, type InsertReportTemplate, reportTemplate,
  type Report, type InsertReport, reports,
  type Training, type InsertTraining, trainings,
  type DepartmentAssignment, type InsertDepartmentAssignment, departmentAssignments,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, asc, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Store } from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined>;
  
  // Acts
  getAllActs(): Promise<Act[]>;
  getAct(id: string): Promise<Act | undefined>;
  createAct(act: InsertAct): Promise<Act>;
  updateAct(id: string, updates: Partial<InsertAct>): Promise<Act | undefined>;
  deleteAct(id: string): Promise<void>;
  
  // Departments
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<void>;
  
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
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist | undefined>;
  deleteArtist(id: string): Promise<void>;
  
  // Technicians
  getAllTechnicians(): Promise<Technician[]>;
  getTechnician(id: string): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, updates: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: string): Promise<void>;
  
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
  
  // Department Assignments
  getAssignmentsByTrainingId(trainingId: string): Promise<DepartmentAssignment[]>;
  createAssignment(assignment: InsertDepartmentAssignment): Promise<DepartmentAssignment>;
  updateAssignment(id: string, updates: Partial<InsertDepartmentAssignment>): Promise<DepartmentAssignment | undefined>;
  deleteAssignment(id: string): Promise<void>;
  
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

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
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
    return await db.select().from(artists);
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.id, id));
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
    return await db.select().from(trainings).where(eq(trainings.reportId, reportId));
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

  // Department Assignments
  async getAssignmentsByTrainingId(trainingId: string): Promise<DepartmentAssignment[]> {
    return await db.select().from(departmentAssignments).where(eq(departmentAssignments.trainingId, trainingId));
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
}

export const storage = new DatabaseStorage();
