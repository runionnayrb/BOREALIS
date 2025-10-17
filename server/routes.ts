import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, sanitizeUser, hashPassword } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { trainings, actDepartments, departmentAssignments, technicians, technicianDepartments } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import {
  insertSceneSchema,
  insertActSchema,
  insertDepartmentSchema,
  insertLocationTypeSchema,
  insertLocationSchema,
  insertArtistGroupSchema,
  insertArtistSchema,
  insertTechnicianSchema,
  insertReportTemplateSchema,
  insertReportSchema,
  insertTrainingSchema,
  updateTrainingSchema,
  insertDepartmentAssignmentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user (from blueprint:javascript_auth_all_persistance)
  setupAuth(app);

  // Profile management routes
  const updateProfileSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    position: z.string().optional(),
    pronouns: z.string().optional(),
  });

  const updatePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
  });

  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Check if email is being changed and if it's already taken
    if (validation.data.email) {
      const existingUser = await storage.getUserByEmail(validation.data.email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Email already in use");
      }
    }

    const updated = await storage.updateUser(req.user!.id, validation.data);
    if (!updated) {
      return res.status(404).send("User not found");
    }

    res.json(sanitizeUser(updated));
  });

  app.post("/api/profile/change-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = updatePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { comparePasswords } = await import("./auth");
    const isValid = await comparePasswords(validation.data.currentPassword, user.password);
    if (!isValid) {
      return res.status(400).send("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(validation.data.newPassword);
    await storage.updateUser(user.id, { password: hashedPassword });

    res.sendStatus(200);
  });

  // Outlook connection status check
  app.get("/api/profile/outlook-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { isOutlookConnected } = await import("./outlook");
    const connected = await isOutlookConnected();

    // Update user's connection status in database
    await storage.updateUser(req.user!.id, {
      outlookConnected: connected ? 1 : 0,
    });

    res.json({ connected });
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const allUsers = await storage.getAllUsers();
    const sanitizedUsers = allUsers.map(sanitizeUser);
    res.json(sanitizedUsers);
  });

  const updateUserSchema = z.object({
    active: z.number().min(0).max(1),
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updated = await storage.updateUser(req.params.id, validation.data);
    if (!updated) {
      return res.status(404).send("User not found");
    }

    res.json(sanitizeUser(updated));
  });

  const deleteUserSchema = z.object({
    adminUsername: z.string(),
    adminPassword: z.string(),
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = deleteUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Verify admin credentials
    if (validation.data.adminUsername !== "admin" || validation.data.adminPassword !== "laperleSM2025!") {
      return res.status(403).json({ error: "Invalid admin credentials" });
    }

    // Prevent self-deletion
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Check if user has created or updated any reports
    const allReports = await storage.getAllReports();
    const hasReports = allReports.some(
      report => report.createdBy === req.params.id || report.updatedBy === req.params.id
    );

    if (hasReports) {
      return res.status(400).json({ 
        error: "Cannot delete user who has created or modified reports. Please reassign or delete their reports first." 
      });
    }

    await storage.deleteUser(req.params.id);
    res.sendStatus(204);
  });

  // Scenes routes
  app.get("/api/scenes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const scenes = await storage.getAllScenes();
    res.json(scenes);
  });

  app.post("/api/scenes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertSceneSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const scene = await storage.createScene(validation.data);
    res.json(scene);
  });

  app.patch("/api/scenes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertSceneSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const scene = await storage.updateScene(req.params.id, validation.data);
    if (!scene) return res.sendStatus(404);
    res.json(scene);
  });

  app.delete("/api/scenes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteScene(req.params.id);
    res.sendStatus(204);
  });

  // Scene Departments routes
  app.get("/api/scenes/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sceneDepartments = await storage.getSceneDepartments(req.params.id);
    res.json(sceneDepartments);
  });

  app.post("/api/scenes/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { departmentIds } = req.body;
    if (!Array.isArray(departmentIds)) {
      return res.status(400).json({ error: "departmentIds must be an array" });
    }
    await storage.setSceneDepartments(req.params.id, departmentIds);
    const sceneDepartments = await storage.getSceneDepartments(req.params.id);
    res.json(sceneDepartments);
  });

  // Scene Artist Groups routes
  app.get("/api/scenes/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sceneArtistGroups = await storage.getSceneArtistGroups(req.params.id);
    res.json(sceneArtistGroups);
  });

  app.post("/api/scenes/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistGroupIds } = req.body;
    if (!Array.isArray(artistGroupIds)) {
      return res.status(400).json({ error: "artistGroupIds must be an array" });
    }
    await storage.setSceneArtistGroups(req.params.id, artistGroupIds);
    const sceneArtistGroups = await storage.getSceneArtistGroups(req.params.id);
    res.json(sceneArtistGroups);
  });

  // Scene Artists routes
  app.get("/api/scenes/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sceneArtists = await storage.getSceneArtists(req.params.id);
    res.json(sceneArtists);
  });

  app.post("/api/scenes/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistIds } = req.body;
    if (!Array.isArray(artistIds)) {
      return res.status(400).json({ error: "artistIds must be an array" });
    }
    await storage.setSceneArtists(req.params.id, artistIds);
    const sceneArtists = await storage.getSceneArtists(req.params.id);
    res.json(sceneArtists);
  });

  // Acts routes
  app.get("/api/acts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const acts = await storage.getAllActs();
    res.json(acts);
  });

  app.post("/api/acts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertActSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const act = await storage.createAct(validation.data);
    res.json(act);
  });

  app.patch("/api/acts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertActSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const act = await storage.updateAct(req.params.id, validation.data);
    if (!act) return res.sendStatus(404);
    res.json(act);
  });

  app.delete("/api/acts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteAct(req.params.id);
    res.sendStatus(204);
  });

  // Act Departments routes
  app.get("/api/acts/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actDepartments = await storage.getActDepartments(req.params.id);
    res.json(actDepartments);
  });

  app.post("/api/acts/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { departmentIds } = req.body;
    if (!Array.isArray(departmentIds)) {
      return res.status(400).json({ error: "departmentIds must be an array" });
    }
    await storage.setActDepartments(req.params.id, departmentIds);
    const actDepartments = await storage.getActDepartments(req.params.id);
    res.json(actDepartments);
  });

  // Act Artists routes
  app.get("/api/acts/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actArtists = await storage.getActArtists(req.params.id);
    res.json(actArtists);
  });

  app.post("/api/acts/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistIds } = req.body;
    if (!Array.isArray(artistIds)) {
      return res.status(400).json({ error: "artistIds must be an array" });
    }
    await storage.setActArtists(req.params.id, artistIds);
    const actArtists = await storage.getActArtists(req.params.id);
    res.json(actArtists);
  });

  // Act Artist Groups routes
  app.get("/api/acts/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actArtistGroups = await storage.getActArtistGroups(req.params.id);
    res.json(actArtistGroups);
  });

  app.post("/api/acts/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistGroupIds } = req.body;
    if (!Array.isArray(artistGroupIds)) {
      return res.status(400).json({ error: "artistGroupIds must be an array" });
    }
    await storage.setActArtistGroups(req.params.id, artistGroupIds);
    const actArtistGroups = await storage.getActArtistGroups(req.params.id);
    res.json(actArtistGroups);
  });

  // Departments routes
  app.get("/api/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const departments = await storage.getAllDepartments();
    res.json(departments);
  });

  app.post("/api/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertDepartmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const department = await storage.createDepartment(validation.data);
    res.json(department);
  });

  app.patch("/api/departments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertDepartmentSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const department = await storage.updateDepartment(req.params.id, validation.data);
    if (!department) return res.sendStatus(404);
    res.json(department);
  });

  app.get("/api/departments/:id/technicians", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const technicians = await storage.getTechniciansByDepartment(req.params.id);
    res.json(technicians);
  });

  app.delete("/api/departments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Check for references before attempting deletion
      const [actDepts, deptAssignments, techDepts] = await Promise.all([
        db.select().from(actDepartments).where(eq(actDepartments.departmentId, req.params.id)),
        db.select().from(departmentAssignments).where(eq(departmentAssignments.departmentId, req.params.id)),
        db.select().from(technicianDepartments).where(eq(technicianDepartments.departmentId, req.params.id))
      ]);

      if (actDepts.length > 0 || deptAssignments.length > 0 || techDepts.length > 0) {
        const issues: string[] = [];
        
        if (actDepts.length > 0) {
          issues.push(`${actDepts.length} act/scene assignment${actDepts.length > 1 ? 's' : ''} (remove in Settings → Acts/Scenes)`);
        }
        if (deptAssignments.length > 0) {
          issues.push(`${deptAssignments.length} training assignment${deptAssignments.length > 1 ? 's' : ''} (remove in report training sessions)`);
        }
        if (techDepts.length > 0) {
          issues.push(`${techDepts.length} technician${techDepts.length > 1 ? 's' : ''} (reassign or delete in Settings → Technicians)`);
        }

        return res.status(400).json({ 
          error: "Cannot delete department", 
          message: `This department is still in use by: ${issues.join('; ')}. Please remove these references first.`
        });
      }

      await storage.deleteDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      if (error.code === '23503') {
        return res.status(400).json({ 
          error: "Cannot delete department", 
          message: "This department is still being used. Please remove all references first." 
        });
      }
      throw error;
    }
  });

  // Location Types routes
  app.get("/api/location-types", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locationTypes = await storage.getAllLocationTypes();
    res.json(locationTypes);
  });

  app.post("/api/location-types", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertLocationTypeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const locationType = await storage.createLocationType(validation.data);
    res.json(locationType);
  });

  app.patch("/api/location-types/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertLocationTypeSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const locationType = await storage.updateLocationType(req.params.id, validation.data);
    if (!locationType) return res.sendStatus(404);
    res.json(locationType);
  });

  app.delete("/api/location-types/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteLocationType(req.params.id);
    res.sendStatus(204);
  });

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getAllLocations();
    res.json(locations);
  });

  app.post("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertLocationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const location = await storage.createLocation(validation.data);
    res.json(location);
  });

  app.patch("/api/locations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertLocationSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const location = await storage.updateLocation(req.params.id, validation.data);
    if (!location) return res.sendStatus(404);
    res.json(location);
  });

  app.delete("/api/locations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteLocation(req.params.id);
    res.sendStatus(204);
  });

  // Artist Groups routes
  app.get("/api/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groups = await storage.getAllArtistGroups();
    res.json(groups);
  });

  app.post("/api/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertArtistGroupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const group = await storage.createArtistGroup(validation.data);
    res.json(group);
  });

  app.patch("/api/artist-groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertArtistGroupSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const group = await storage.updateArtistGroup(req.params.id, validation.data);
    if (!group) return res.sendStatus(404);
    res.json(group);
  });

  app.delete("/api/artist-groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteArtistGroup(req.params.id);
    res.sendStatus(204);
  });

  // Artists routes
  app.get("/api/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const artists = await storage.getAllArtists();
    res.json(artists);
  });

  app.post("/api/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertArtistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const artist = await storage.createArtist(validation.data);
    res.json(artist);
  });

  app.patch("/api/artists/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertArtistSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const artist = await storage.updateArtist(req.params.id, validation.data);
    if (!artist) return res.sendStatus(404);
    res.json(artist);
  });

  app.delete("/api/artists/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteArtist(req.params.id);
    res.sendStatus(204);
  });

  // Technicians routes
  app.get("/api/technicians", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const technicians = await storage.getAllTechnicians();
    res.json(technicians);
  });

  app.post("/api/technicians", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertTechnicianSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const technician = await storage.createTechnician(validation.data);
    res.json(technician);
  });

  app.patch("/api/technicians/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertTechnicianSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const technician = await storage.updateTechnician(req.params.id, validation.data);
    if (!technician) return res.sendStatus(404);
    res.json(technician);
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTechnician(req.params.id);
    res.sendStatus(204);
  });

  // Technician Departments routes
  app.get("/api/technicians/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const departments = await storage.getTechnicianDepartments(req.params.id);
    res.json(departments);
  });

  app.put("/api/technicians/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = z.object({
      departmentIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    await storage.setTechnicianDepartments(req.params.id, validation.data.departmentIds);
    const departments = await storage.getTechnicianDepartments(req.params.id);
    res.json(departments);
  });

  // Report Template routes
  app.get("/api/report-template", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const template = await storage.getReportTemplate();
    res.json(template || null);
  });

  app.put("/api/report-template", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertReportTemplateSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const template = await storage.updateReportTemplate(validation.data, req.user!.id);
    res.json(template);
  });

  // Reports routes
  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reports = await storage.getAllReports();
    res.json(reports);
  });

  app.get("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const report = await storage.getReport(req.params.id);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.get("/api/reports/date/:date", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const report = await storage.getReportByDate(req.params.date);
    res.json(report || null);
  });

  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const report = await storage.createReport(validation.data, req.user!.id);
    res.json(report);
  });

  app.patch("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertReportSchema.partial().omit({ createdBy: true }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const report = await storage.updateReport(req.params.id, validation.data, req.user!.id);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.delete("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteReport(req.params.id);
    res.sendStatus(204);
  });

  // Trainings routes
  app.get("/api/trainings/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const allTrainings = await db
      .select()
      .from(trainings)
      .orderBy(asc(trainings.startTime), asc(trainings.endTime));
    res.json(allTrainings);
  });

  app.get("/api/reports/:reportId/trainings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trainings = await storage.getTrainingsByReportId(req.params.reportId);
    res.json(trainings);
  });

  app.get("/api/trainings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const training = await storage.getTraining(req.params.id);
    if (!training) return res.sendStatus(404);
    res.json(training);
  });

  app.post("/api/trainings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { locationIds, artistIds, ...trainingData } = req.body;
    const validation = insertTrainingSchema.safeParse(trainingData);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const training = await storage.createTraining(validation.data, req.user!.id);
    
    // Set training locations if provided
    if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
      await storage.setTrainingLocations(training.id, locationIds);
    }
    
    // Set training artists if provided
    if (artistIds && Array.isArray(artistIds) && artistIds.length > 0) {
      await storage.setTrainingArtists(training.id, artistIds);
    }
    
    res.json(training);
  });

  app.patch("/api/trainings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { locationIds, artistIds, ...trainingData } = req.body;
    const validation = updateTrainingSchema.safeParse(trainingData);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const training = await storage.updateTraining(req.params.id, validation.data, req.user!.id);
    if (!training) return res.sendStatus(404);
    
    // Update training locations if provided
    if (locationIds && Array.isArray(locationIds)) {
      await storage.setTrainingLocations(req.params.id, locationIds);
    }
    
    // Update training artists if provided
    if (artistIds && Array.isArray(artistIds)) {
      await storage.setTrainingArtists(req.params.id, artistIds);
    }
    
    res.json(training);
  });

  app.delete("/api/trainings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTraining(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/trainings/:trainingId/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getTrainingLocations(req.params.trainingId);
    res.json(locations);
  });

  app.get("/api/trainings/:trainingId/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trainingArtists = await storage.getTrainingArtists(req.params.trainingId);
    res.json(trainingArtists);
  });

  // Department Assignments routes
  app.get("/api/trainings/:trainingId/assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assignments = await storage.getAssignmentsByTrainingId(req.params.trainingId);
    res.json(assignments);
  });

  app.post("/api/assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertDepartmentAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const assignment = await storage.createAssignment(validation.data);
    res.json(assignment);
  });

  app.patch("/api/assignments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertDepartmentAssignmentSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const assignment = await storage.updateAssignment(req.params.id, validation.data);
    if (!assignment) return res.sendStatus(404);
    res.json(assignment);
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteAssignment(req.params.id);
    res.sendStatus(204);
  });

  // Get all junction table data for search
  app.get("/api/training-locations/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trainingLocations = await storage.getAllTrainingLocations();
    res.json(trainingLocations);
  });

  app.get("/api/training-artists/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trainingArtists = await storage.getAllTrainingArtists();
    res.json(trainingArtists);
  });

  app.get("/api/assignments/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assignments = await storage.getAllAssignments();
    res.json(assignments);
  });

  // Email preview endpoint
  app.get("/api/reports/:reportId/email-preview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { formatEmailBody, replaceDateVariable } = await import("./emailFormatter");

      // Get report and template data
      const report = await storage.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).send("Report not found");
      }

      const template = await storage.getReportTemplate();
      if (!template || !template.emailSubjectTemplate) {
        return res.status(400).send("Email template not configured");
      }

      // Get all trainings for this report with full details
      const trainings = await storage.getTrainingsByReportId(req.params.reportId);
      const scenes = await storage.getAllScenes();
      const acts = await storage.getAllActs();
      const locations = await storage.getAllLocations();
      const users = await storage.getAllUsers();
      const artists = await storage.getAllArtists();
      const artistGroups = await storage.getAllArtistGroups();
      const departments = await storage.getAllDepartments();
      const technicians = await storage.getAllTechnicians();

      // Format training data
      const trainingData = await Promise.all(trainings.map(async (training) => {
        const scene = scenes.find(s => s.id === training.sceneId);
        const act = acts.find(a => a.id === training.actId);
        const location = locations.find(l => l.id === training.locationId);
        const stageManager = users.find(u => u.id === training.stageManagerId);
        
        // Get artists (just names, no roles)
        const trainingArtists = await storage.getTrainingArtists(training.id);
        const artistNames = trainingArtists
          .map(ta => artists.find(a => a.id === ta.artistId))
          .filter(a => a)
          .map(a => a!.stageName || `${a!.firstName} ${a!.lastName}`);

        // Get departments with lead technicians
        const assignments = await storage.getAssignmentsByTrainingId(training.id);
        const departmentNames = assignments.map(assignment => {
          const dept = departments.find(d => d.id === assignment.departmentId);
          if (!dept) return '';
          
          if (assignment.leadTechnicianId) {
            const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
            if (tech) {
              const techName = tech.technicianName || `${tech.firstName} ${tech.lastName}`;
              return `${dept.name} (${techName})`;
            }
          }
          return dept.name;
        }).filter(n => n);

        let trainingName = training.customName || '';
        if (!trainingName && scene) trainingName = scene.name;
        if (!trainingName && act) trainingName = act.name;

        return {
          trainingName,
          startTime: training.startTime,
          endTime: training.endTime,
          locationName: location?.name,
          stageManagerName: stageManager?.name || undefined,
          artistNames,
          departmentNames,
          goalNotes: training.goalNotes || undefined,
          notes: training.notes || undefined,
          followUpNotes: training.followUpNotes || undefined,
        };
      }));

      // Format email
      const subject = replaceDateVariable(template.emailSubjectTemplate, report.date);
      const body = formatEmailBody(
        {
          date: report.date,
          stageManagerOnDuty: report.stageManagerOnDuty || undefined,
          notes: report.notes || undefined,
          trainings: trainingData,
        },
        template.emailBodyPrefix || undefined
      );

      res.json({ subject, body });
    } catch (error: any) {
      console.error("Failed to preview email:", error);
      res.status(500).send(error.message || "Failed to preview email");
    }
  });

  // PDF generation endpoint
  app.get("/api/reports/:reportId/pdf", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { formatPdfBody } = await import("./emailFormatter");
      const { generatePdfFromHtml } = await import("./pdfGenerator");

      // Get report and template data
      const report = await storage.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).send("Report not found");
      }

      const template = await storage.getReportTemplate();

      // Get all trainings for this report with full details
      const trainings = await storage.getTrainingsByReportId(req.params.reportId);
      const scenes = await storage.getAllScenes();
      const acts = await storage.getAllActs();
      const locations = await storage.getAllLocations();
      const users = await storage.getAllUsers();
      const artists = await storage.getAllArtists();
      const departments = await storage.getAllDepartments();
      const technicians = await storage.getAllTechnicians();

      // Format training data
      const trainingData = await Promise.all(trainings.map(async (training) => {
        const scene = scenes.find(s => s.id === training.sceneId);
        const act = acts.find(a => a.id === training.actId);
        const location = locations.find(l => l.id === training.locationId);
        const stageManager = users.find(u => u.id === training.stageManagerId);
        
        // Get artists (just names, no roles)
        const trainingArtists = await storage.getTrainingArtists(training.id);
        const artistNames = trainingArtists
          .map(ta => artists.find(a => a.id === ta.artistId))
          .filter(a => a)
          .map(a => a!.stageName || `${a!.firstName} ${a!.lastName}`);

        // Get departments with lead technicians
        const assignments = await storage.getAssignmentsByTrainingId(training.id);
        const departmentNames = assignments.map(assignment => {
          const dept = departments.find(d => d.id === assignment.departmentId);
          if (!dept) return '';
          
          if (assignment.leadTechnicianId) {
            const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
            if (tech) {
              const techName = tech.technicianName || `${tech.firstName} ${tech.lastName}`;
              return `${dept.name} (${techName})`;
            }
          }
          return dept.name;
        }).filter(n => n);

        let trainingName = training.customName || '';
        if (!trainingName && scene) trainingName = scene.name;
        if (!trainingName && act) trainingName = act.name;

        return {
          trainingName,
          startTime: training.startTime,
          endTime: training.endTime,
          locationName: location?.name,
          stageManagerName: stageManager?.name || undefined,
          artistNames,
          departmentNames,
          goalNotes: training.goalNotes || undefined,
          notes: training.notes || undefined,
          followUpNotes: training.followUpNotes || undefined,
        };
      }));

      // Format HTML for PDF with template header
      const htmlContent = formatPdfBody(
        {
          date: report.date,
          stageManagerOnDuty: report.stageManagerOnDuty || undefined,
          notes: report.notes || undefined,
          trainings: trainingData,
        },
        template ? {
          leftImageUrl: template.leftImageUrl,
          title: template.title,
          rightImageUrl: template.rightImageUrl,
        } : undefined
      );

      // Generate PDF
      const pdfBuffer = await generatePdfFromHtml(htmlContent);

      // Set headers for PDF download
      const dateFormatted = report.date.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
      const fileName = `ART-SM-REP Borealis Training Report ${dateFormatted}.pdf`;
      console.log('[PDF Export] Report date:', report.date, '-> Formatted:', dateFormatted);
      console.log('[PDF Export] Filename:', fileName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      res.status(500).send(error.message || "Failed to generate PDF");
    }
  });

  // Email sending endpoint
  app.post("/api/reports/:reportId/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { getUncachableOutlookClient } = await import("./outlook");

      // Get custom values from request body (if provided)
      const customValues = req.body as {
        to?: string;
        cc?: string;
        bcc?: string;
        subject?: string;
        body?: string;
      } | undefined;

      let subject: string;
      let body: string;
      let toEmails: string[];
      let ccEmails: string[];
      let bccEmails: string[];

      if (customValues && customValues.subject && customValues.body) {
        // Use custom values from the preview dialog
        subject = customValues.subject;
        body = customValues.body;
        toEmails = customValues.to ? customValues.to.split(',').map(e => e.trim()).filter(e => e) : [];
        ccEmails = customValues.cc ? customValues.cc.split(',').map(e => e.trim()).filter(e => e) : [];
        bccEmails = customValues.bcc ? customValues.bcc.split(',').map(e => e.trim()).filter(e => e) : [];
      } else {
        // Use template values (fallback for direct sending)
        const { formatEmailBody, replaceDateVariable } = await import("./emailFormatter");

        const report = await storage.getReport(req.params.reportId);
        if (!report) {
          return res.status(404).send("Report not found");
        }

        const template = await storage.getReportTemplate();
        if (!template || !template.emailSubjectTemplate) {
          return res.status(400).send("Email template not configured");
        }

        const trainings = await storage.getTrainingsByReportId(req.params.reportId);
        const scenes = await storage.getAllScenes();
        const acts = await storage.getAllActs();
        const locations = await storage.getAllLocations();
        const users = await storage.getAllUsers();
        const artists = await storage.getAllArtists();
        const artistGroups = await storage.getAllArtistGroups();
        const departments = await storage.getAllDepartments();
        const technicians = await storage.getAllTechnicians();

        const trainingData = await Promise.all(trainings.map(async (training) => {
          const scene = scenes.find(s => s.id === training.sceneId);
          const act = acts.find(a => a.id === training.actId);
          const location = locations.find(l => l.id === training.locationId);
          const stageManager = users.find(u => u.id === training.stageManagerId);
          
          const trainingArtists = await storage.getTrainingArtists(training.id);
          const artistNames = trainingArtists
            .map(ta => artists.find(a => a.id === ta.artistId))
            .filter(a => a)
            .map(a => a!.stageName || `${a!.firstName} ${a!.lastName}`);

          const assignments = await storage.getAssignmentsByTrainingId(training.id);
          const departmentNames = assignments.map(assignment => {
            const dept = departments.find(d => d.id === assignment.departmentId);
            if (!dept) return '';
            
            if (assignment.leadTechnicianId) {
              const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
              if (tech) {
                const techName = tech.technicianName || `${tech.firstName} ${tech.lastName}`;
                return `${dept.name} (${techName})`;
              }
            }
            return dept.name;
          }).filter(n => n);

          let trainingName = training.customName || '';
          if (!trainingName && scene) trainingName = scene.name;
          if (!trainingName && act) trainingName = act.name;

          return {
            trainingName,
            startTime: training.startTime,
            endTime: training.endTime,
            locationName: location?.name,
            stageManagerName: stageManager?.name || undefined,
            artistNames,
            departmentNames,
            goalNotes: training.goalNotes || undefined,
            notes: training.notes || undefined,
            followUpNotes: training.followUpNotes || undefined,
          };
        }));

        subject = replaceDateVariable(template.emailSubjectTemplate, report.date);
        body = formatEmailBody(
          {
            date: report.date,
            stageManagerOnDuty: report.stageManagerOnDuty || undefined,
            notes: report.notes || undefined,
            trainings: trainingData,
          },
          template.emailBodyPrefix || undefined
        );

        toEmails = template.emailTo || [];
        ccEmails = template.emailCc || [];
        bccEmails = template.emailBcc || [];
      }

      // Generate PDF for attachment
      const { generatePdfFromHtml } = await import("./pdfGenerator");
      const report = await storage.getReport(req.params.reportId);
      
      if (!report) {
        return res.status(404).send("Report not found");
      }

      const pdfBuffer = await generatePdfFromHtml(body);
      const pdfBase64 = pdfBuffer.toString('base64');
      const dateFormatted = report.date.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
      const pdfFileName = `ART-SM-REP Borealis Training Report ${dateFormatted}.pdf`;

      // Get Outlook client and send email
      const client = await getUncachableOutlookClient();

      const message = {
        subject,
        body: {
          contentType: 'HTML',
          content: body,
        },
        toRecipients: toEmails.filter(e => e).map(email => ({
          emailAddress: { address: email }
        })),
        ccRecipients: ccEmails.filter(e => e).map(email => ({
          emailAddress: { address: email }
        })),
        bccRecipients: bccEmails.filter(e => e).map(email => ({
          emailAddress: { address: email }
        })),
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            "name": pdfFileName,
            "contentType": "application/pdf",
            "contentBytes": pdfBase64
          }
        ]
      };

      await client.api('/me/sendMail').post({ message });

      res.json({ success: true, message: "Email sent successfully with PDF attachment" });
    } catch (error: any) {
      console.error("Email sending error:", error);
      res.status(500).json({ 
        error: "Failed to send email", 
        message: error.message || "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
