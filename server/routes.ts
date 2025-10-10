import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, sanitizeUser, hashPassword } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { trainings } from "@shared/schema";
import {
  insertActSchema,
  insertDepartmentSchema,
  insertLocationSchema,
  insertArtistGroupSchema,
  insertArtistSchema,
  insertTechnicianSchema,
  insertReportTemplateSchema,
  insertReportSchema,
  insertTrainingSchema,
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

  app.delete("/api/departments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteDepartment(req.params.id);
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
    const allTrainings = await db.select().from(trainings);
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
    const validation = insertTrainingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const training = await storage.createTraining(validation.data, req.user!.id);
    res.json(training);
  });

  app.patch("/api/trainings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertTrainingSchema.partial().omit({ createdBy: true, reportId: true }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const training = await storage.updateTraining(req.params.id, validation.data, req.user!.id);
    if (!training) return res.sendStatus(404);
    res.json(training);
  });

  app.delete("/api/trainings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTraining(req.params.id);
    res.sendStatus(204);
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

  const httpServer = createServer(app);

  return httpServer;
}
