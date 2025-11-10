import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, sanitizeUser, hashPassword, toTitleCase, comparePasswords } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { trainings, actDepartments, departmentAssignments, technicians, technicianDepartments } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { setupWebSocket, broadcastAttendanceUpdate, broadcastArtistStatusUpdate, broadcastTickSheetUpdate } from "./websocket";
import { isWithinVenue, getDistanceFromVenue, validateGeofence } from "./geofencing";
import { insertAttendanceRecordSchema, insertTickSheetSchema, insertTickSheetMarkSchema } from "@shared/schema";
import { requireRole } from "./middleware/roleAuth";
import { applyRolePermissions } from "./applyRolePermissions";
import {
  canViewReports,
  canCreateReports,
  canEditReports,
  canViewSettingsReportTemplate,
  canEditSettingsReportTemplate,
  canViewLineupsPositions,
  canCreateLineupsPositions,
  canEditLineupsPositions,
  canViewLineupsCompetencies,
  canCreateLineupsCompetencies,
  canEditLineupsCompetencies,
  canViewLineupsTrainingPrograms,
  canCreateLineupsTrainingPrograms,
  canEditLineupsTrainingPrograms,
  canViewLineupsRules,
  canCreateLineupsRules,
  canEditLineupsRules,
  canViewLineupsRestrictions,
  canViewSettingsDepartments,
  canEditSettingsDepartments,
} from "./middleware/permissionAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  insertSceneSchema,
  insertActSchema,
  insertCueSchema,
  insertDepartmentSchema,
  insertLocationTypeSchema,
  insertLocationSchema,
  insertUserGroupSchema,
  insertArtistGroupSchema,
  insertArtistSchema,
  insertTechnicianSchema,
  insertArtisticStaffSchema,
  insertReportTemplateSchema,
  insertReportSchema,
  insertTrainingSchema,
  updateTrainingSchema,
  insertDepartmentAssignmentSchema,
  insertUserPermissionSchema,
  updateUserPermissionSchema,
  insertSystemSettingSchema,
  insertTrainingProgramSchema,
  featureNames,
  userRoles,
  bulkRolePageAccessSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user (from blueprint:javascript_auth_all_persistance)
  setupAuth(app);

  // Profile management routes
  const updateProfileSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    position: z.string().optional(),
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

    // Normalize formatting: lowercase email, title case for names
    const formattedData = {
      ...validation.data,
      email: validation.data.email ? validation.data.email.toLowerCase() : undefined,
      name: validation.data.name ? toTitleCase(validation.data.name) : undefined,
      position: validation.data.position ? toTitleCase(validation.data.position) : undefined,
    };

    // Check if email is being changed and if it's already taken (email already normalized)
    if (formattedData.email) {
      const existingUser = await storage.getUserByEmail(formattedData.email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Email already in use");
      }
    }

    const updated = await storage.updateUser(req.user!.id, formattedData);
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

  app.get("/api/users/unlinked-profiles", requireRole('stage_management', 'admin'), async (req, res) => {
    const artists = await storage.getUnlinkedArtists();
    const allUnlinkedStaff = await storage.getUnlinkedTechnicians();
    const departments = await storage.getAllDepartments();
    
    // Batch-fetch ALL department assignments in a single query to avoid N+1
    const allDepartmentAssignments = await storage.getAllTechnicianDepartments();
    
    // Create a map of department ID to department type for O(1) lookups
    const departmentTypeMap = new Map(
      departments.map(d => [d.id, d.type])
    );
    
    // Create a map of staff ID to their department assignments
    const staffDeptMap = new Map<string, typeof allDepartmentAssignments>();
    for (const assignment of allDepartmentAssignments) {
      if (!staffDeptMap.has(assignment.technicianId)) {
        staffDeptMap.set(assignment.technicianId, []);
      }
      staffDeptMap.get(assignment.technicianId)!.push(assignment);
    }
    
    // Filter staff by department type
    const artisticStaff: typeof allUnlinkedStaff = [];
    const technicians: typeof allUnlinkedStaff = [];
    
    for (const staff of allUnlinkedStaff) {
      const staffDepartments = staffDeptMap.get(staff.id) || [];
      
      // If staff has no department assignments, include them in both lists
      // so they're available for linking regardless of profile type selected
      if (staffDepartments.length === 0) {
        artisticStaff.push(staff);
        technicians.push(staff);
        continue;
      }
      
      // Check if assigned to any artistic departments
      const hasArtisticDept = staffDepartments.some(sd => 
        departmentTypeMap.get(sd.departmentId) === 'artistic'
      );
      
      // Check if assigned to any technical departments
      const hasTechnicalDept = staffDepartments.some(sd => 
        departmentTypeMap.get(sd.departmentId) === 'technical'
      );
      
      if (hasArtisticDept) {
        artisticStaff.push(staff);
      }
      if (hasTechnicalDept) {
        technicians.push(staff);
      }
    }
    
    res.json({ artists, artisticStaff, technicians });
  });

  const createUserSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    preferredName: z.string().min(1),
    email: z.string().email(),
    role: z.string().min(1),
    password: z.string().min(6),
    userGroupId: z.string().nullable().optional(),
    profileType: z.enum(['artist', 'artisticStaff', 'technician']).optional(),
    profileId: z.string().optional(),
  });

  app.post("/api/users/create", requireRole('stage_management', 'admin'), async (req, res) => {

    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Normalize formatting: lowercase email, title case for names
    const formattedData = {
      firstName: toTitleCase(validation.data.firstName),
      lastName: toTitleCase(validation.data.lastName),
      preferredName: toTitleCase(validation.data.preferredName),
      email: validation.data.email.toLowerCase(),
      role: validation.data.role,
      password: validation.data.password,
      userGroupId: validation.data.userGroupId,
      profileType: validation.data.profileType,
      profileId: validation.data.profileId,
    };

    // Security: Only admins can create admin accounts
    if (formattedData.role === 'admin' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only administrators can create admin accounts",
      });
    }

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(formattedData.email);
    if (existingUser) {
      return res.status(400).send("Email already in use");
    }

    // Hash password
    const hashedPassword = await hashPassword(formattedData.password);

    // Create user with the actual role from the form
    const newUser = await storage.createUser({
      firstName: formattedData.firstName,
      lastName: formattedData.lastName,
      preferredName: formattedData.preferredName,
      email: formattedData.email,
      password: hashedPassword,
      role: formattedData.role as any,
    } as any);

    // Update position field with role and userGroupId
    await storage.updateUser(newUser.id, {
      position: formattedData.role,
      userGroupId: formattedData.userGroupId || null,
    });

    // Link to profile if specified
    if (formattedData.profileType && formattedData.profileId) {
      if (formattedData.profileType === 'artist') {
        await storage.updateArtist(formattedData.profileId, { userId: newUser.id });
      } else if (formattedData.profileType === 'artisticStaff') {
        await storage.updateArtisticStaff(formattedData.profileId, { userId: newUser.id });
      } else if (formattedData.profileType === 'technician') {
        await storage.updateTechnician(formattedData.profileId, { userId: newUser.id });
      }
    }

    // Apply role-based permissions automatically
    try {
      await applyRolePermissions(newUser.id, formattedData.role as any);
    } catch (error: any) {
      console.error(`Failed to apply role permissions for new user ${newUser.id}:`, error);
    }

    const updatedUser = await storage.getUser(newUser.id);
    res.status(201).json(sanitizeUser(updatedUser!));
  });

  const updateUserSchema = z.object({
    active: z.number().min(0).max(1).optional(),
    userGroupId: z.string().nullable().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    preferredName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    position: z.string().optional(),
    role: z.string().optional(),
  });

  app.patch("/api/users/:id", requireRole('stage_management', 'admin'), async (req, res) => {

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Get the target user to check if this is Bryan Runion
    const targetUser = await storage.getUser(req.params.id);
    if (!targetUser) {
      return res.status(404).send("User not found");
    }

    // Special protection for Bryan Runion's admin status
    if (targetUser.email === 'bryan.runion@laperle.com' && 
        validation.data.role && 
        validation.data.role !== 'admin' &&
        targetUser.role === 'admin') {
      return res.status(403).json({
        error: "Protected account",
        message: "Cannot remove admin status from Bryan Runion's account. This account is protected.",
        requiresAdminAuth: true,
      });
    }

    // Normalize formatting: lowercase email, title case for names/positions
    const formattedData = {
      ...validation.data,
      email: validation.data.email ? validation.data.email.toLowerCase() : undefined,
      firstName: validation.data.firstName ? toTitleCase(validation.data.firstName) : undefined,
      lastName: validation.data.lastName ? toTitleCase(validation.data.lastName) : undefined,
      preferredName: validation.data.preferredName ? toTitleCase(validation.data.preferredName) : undefined,
      name: validation.data.name ? toTitleCase(validation.data.name) : undefined,
      position: validation.data.position ? toTitleCase(validation.data.position) : undefined,
    };

    // Security: Only admins can promote users to admin
    if (formattedData.role === 'admin' && targetUser.role !== 'admin' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only administrators can promote users to admin role",
      });
    }

    // Check if email is being changed and if it's already taken
    if (formattedData.email) {
      const existingUser = await storage.getUserByEmail(formattedData.email);
      if (existingUser && existingUser.id !== req.params.id) {
        return res.status(400).send("Email already in use");
      }
    }

    const updated = await storage.updateUser(req.params.id, formattedData);
    if (!updated) {
      return res.status(404).send("User not found");
    }

    // If role was changed, apply role-based permissions automatically
    if (formattedData.role && formattedData.role !== targetUser.role) {
      try {
        await applyRolePermissions(updated.id, formattedData.role as any);
      } catch (error: any) {
        console.error(`Failed to apply role permissions for user ${updated.id}:`, error);
      }
    }

    res.json(sanitizeUser(updated));
  });

  // Special route to remove Bryan Runion's admin status with credential verification
  app.post("/api/users/:id/remove-admin-protected", requireRole('admin'), async (req, res) => {
    try {
      const { username, password, newRole } = req.body;

      if (!username || !password || !newRole) {
        return res.status(400).json({ error: "Admin credentials and new role required" });
      }

      // Get the target user
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // This route is only for Bryan Runion's account
      if (targetUser.email !== 'bryan.runion@laperle.com') {
        return res.status(403).json({ error: "This route is only for protected accounts" });
      }

      // Verify the provided credentials match Bryan Runion's account
      const authenticatedUser = await storage.getUserByEmail(username.toLowerCase());
      if (!authenticatedUser || authenticatedUser.email !== 'bryan.runion@laperle.com') {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await comparePasswords(password, authenticatedUser.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Allow the role change
      const updated = await storage.updateUser(req.params.id, { role: newRole });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      // Apply role-based permissions automatically
      try {
        await applyRolePermissions(updated.id, newRole as any);
      } catch (error: any) {
        console.error(`Failed to apply role permissions for user ${updated.id}:`, error);
      }

      res.json({ success: true, user: sanitizeUser(updated) });
    } catch (error) {
      console.error("Error in remove-admin-protected:", error);
      res.status(500).json({ error: "Failed to update protected account" });
    }
  });

  const deleteUserSchema = z.object({
    adminUsername: z.string(),
    adminPassword: z.string(),
  });

  app.delete("/api/users/:id", requireRole('stage_management', 'admin'), async (req, res) => {

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

  // Password reset routes
  app.post("/api/users/:id/reset-password", requireRole('stage_management', 'admin'), async (req, res) => {
    // Generate temporary password (8 characters: letters and numbers)
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const temporaryPassword = generateTempPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Update user with new password and set mustChangePassword flag
    const updated = await storage.updateUser(req.params.id, {
      password: hashedPassword,
      mustChangePassword: 1,
    });

    if (!updated) {
      return res.status(404).send("User not found");
    }

    // Return the temporary password (only this one time)
    res.json({ 
      temporaryPassword,
      user: sanitizeUser(updated)
    });
  });

  const changePasswordSchema = z.object({
    currentPassword: z.string().optional(), // Optional for forced password change
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/users/change-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Get current user
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // If not forced change, require and verify current password
    if (!user.mustChangePassword) {
      if (!validation.data.currentPassword) {
        return res.status(400).send("Current password is required");
      }
      const { comparePasswords } = await import("./auth");
      const isValid = await comparePasswords(validation.data.currentPassword, user.password);
      if (!isValid) {
        return res.status(400).send("Current password is incorrect");
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(validation.data.newPassword);

    // Update user with new password and clear mustChangePassword flag
    const updated = await storage.updateUser(user.id, {
      password: hashedPassword,
      mustChangePassword: 0,
    });

    if (!updated) {
      return res.status(500).send("Failed to update password");
    }

    res.json({ 
      success: true,
      user: sanitizeUser(updated)
    });
  });

  // Artist photo upload routes
  app.post("/api/photos/upload", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error fetching object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
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

  app.post("/api/acts/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { acts } = req.body;
    if (!Array.isArray(acts)) {
      return res.status(400).json({ error: "acts must be an array" });
    }
    await storage.reorderActs(acts);
    res.sendStatus(200);
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

  // Cues routes
  app.get("/api/cues", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cues = await storage.getAllCues();
    res.json(cues);
  });

  app.post("/api/cues", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertCueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const cue = await storage.createCue(validation.data);
    res.json(cue);
  });

  app.patch("/api/cues/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertCueSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const cue = await storage.updateCue(req.params.id, validation.data);
    if (!cue) return res.sendStatus(404);
    res.json(cue);
  });

  app.delete("/api/cues/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteCue(req.params.id);
    res.sendStatus(204);
  });

  app.post("/api/cues/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { cues } = req.body;
    if (!Array.isArray(cues)) {
      return res.status(400).json({ error: "cues must be an array" });
    }
    await storage.reorderCues(cues);
    res.sendStatus(200);
  });

  // Cue Departments routes
  app.get("/api/cues/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cueDepartments = await storage.getCueDepartments(req.params.id);
    res.json(cueDepartments);
  });

  app.post("/api/cues/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { departmentIds } = req.body;
    if (!Array.isArray(departmentIds)) {
      return res.status(400).json({ error: "departmentIds must be an array" });
    }
    await storage.setCueDepartments(req.params.id, departmentIds);
    const cueDepartments = await storage.getCueDepartments(req.params.id);
    res.json(cueDepartments);
  });

  // Cue Artists routes
  app.get("/api/cues/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cueArtists = await storage.getCueArtists(req.params.id);
    res.json(cueArtists);
  });

  app.post("/api/cues/:id/artists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistIds } = req.body;
    if (!Array.isArray(artistIds)) {
      return res.status(400).json({ error: "artistIds must be an array" });
    }
    await storage.setCueArtists(req.params.id, artistIds);
    const cueArtists = await storage.getCueArtists(req.params.id);
    res.json(cueArtists);
  });

  // Cue Artist Groups routes
  app.get("/api/cues/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cueArtistGroups = await storage.getCueArtistGroups(req.params.id);
    res.json(cueArtistGroups);
  });

  app.post("/api/cues/:id/artist-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistGroupIds } = req.body;
    if (!Array.isArray(artistGroupIds)) {
      return res.status(400).json({ error: "artistGroupIds must be an array" });
    }
    await storage.setCueArtistGroups(req.params.id, artistGroupIds);
    const cueArtistGroups = await storage.getCueArtistGroups(req.params.id);
    res.json(cueArtistGroups);
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

  // User Groups routes
  // Public endpoint for registration form
  app.get("/api/user-groups", async (req, res) => {
    const groups = await storage.getAllUserGroups();
    res.json(groups);
  });

  app.get("/api/user-groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const group = await storage.getUserGroup(req.params.id);
    if (!group) return res.sendStatus(404);
    res.json(group);
  });

  app.post("/api/user-groups", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = insertUserGroupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const group = await storage.createUserGroup(validation.data);
    res.json(group);
  });

  app.patch("/api/user-groups/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = insertUserGroupSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const group = await storage.updateUserGroup(req.params.id, validation.data);
    if (!group) return res.sendStatus(404);
    res.json(group);
  });

  app.delete("/api/user-groups/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    await storage.deleteUserGroup(req.params.id);
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
    
    // Normalize photo URL if it's a full GCS URL
    if (validation.data.photoUrl) {
      const objectStorageService = new ObjectStorageService();
      validation.data.photoUrl = objectStorageService.normalizeObjectEntityPath(validation.data.photoUrl);
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
    
    // Normalize photo URL if it's a full GCS URL
    if (validation.data.photoUrl) {
      const objectStorageService = new ObjectStorageService();
      validation.data.photoUrl = objectStorageService.normalizeObjectEntityPath(validation.data.photoUrl);
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

  app.post("/api/artists/:id/archive", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.archiveArtistWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Artist not found" });
    }
  });

  app.post("/api/artists/:id/unarchive", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.unarchiveArtistWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Artist not found" });
    }
  });

  app.get("/api/artists/archived", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const archivedArtists = await storage.getAllArchivedArtists();
    res.json(archivedArtists);
  });

  app.post("/api/artists/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { artistIds } = req.body;
    if (!Array.isArray(artistIds)) {
      return res.status(400).json({ error: "artistIds must be an array" });
    }
    await storage.reorderArtists(artistIds);
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

  app.post("/api/technicians/:id/archive", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.archiveTechnicianWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Technician not found" });
    }
  });

  app.post("/api/technicians/:id/unarchive", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.unarchiveTechnicianWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Technician not found" });
    }
  });

  app.get("/api/technicians/archived", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const archivedTechnicians = await storage.getAllArchivedTechnicians();
    res.json(archivedTechnicians);
  });

  app.post("/api/technicians/:id/link-user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = z.object({ userId: z.string() }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    try {
      await storage.linkUserToTechnician(req.params.id, validation.data.userId);
      res.sendStatus(204);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to link user" });
    }
  });

  app.post("/api/technicians/:id/unlink-user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.unlinkUserFromTechnician(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Technician not found" });
    }
  });

  app.put("/api/technicians/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = z.object({
      technicianIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    await storage.reorderTechnicians(validation.data.technicianIds);
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

  app.put("/api/departments/:id/technicians/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = z.object({
      technicianIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    await storage.reorderTechniciansInDepartment(req.params.id, validation.data.technicianIds);
    res.sendStatus(204);
  });

  // Artistic Staff routes
  app.get("/api/artistic-staff", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const artisticStaff = await storage.getAllArtisticStaff();
    res.json(artisticStaff);
  });

  app.get("/api/artistic-staff/archived", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const archivedStaff = await storage.getAllArchivedArtisticStaff();
    res.json(archivedStaff);
  });

  app.get("/api/artistic-staff/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const staff = await storage.getArtisticStaff(req.params.id);
    if (!staff) return res.sendStatus(404);
    res.json(staff);
  });

  app.post("/api/artistic-staff", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = insertArtisticStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const staff = await storage.createArtisticStaff(validation.data);
    res.json(staff);
  });

  app.patch("/api/artistic-staff/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = insertArtisticStaffSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const staff = await storage.updateArtisticStaff(req.params.id, validation.data);
    if (!staff) return res.sendStatus(404);
    res.json(staff);
  });

  app.delete("/api/artistic-staff/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    await storage.deleteArtisticStaff(req.params.id);
    res.sendStatus(204);
  });

  app.post("/api/artistic-staff/:id/archive", requireRole('stage_management', 'admin'), async (req, res) => {
    try {
      await storage.archiveArtisticStaffWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Artistic staff not found" });
    }
  });

  app.post("/api/artistic-staff/:id/unarchive", requireRole('stage_management', 'admin'), async (req, res) => {
    try {
      await storage.unarchiveArtisticStaffWithUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : "Artistic staff not found" });
    }
  });

  app.put("/api/artistic-staff/reorder", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = z.object({
      artisticStaffIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    await storage.reorderArtisticStaff(validation.data.artisticStaffIds);
    res.sendStatus(204);
  });

  // Artistic Staff Departments routes
  app.get("/api/artistic-staff/:id/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const departments = await storage.getArtisticStaffDepartments(req.params.id);
    res.json(departments);
  });

  app.put("/api/artistic-staff/:id/departments", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = z.object({
      departmentIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    try {
      await storage.setArtisticStaffDepartments(req.params.id, validation.data.departmentIds);
      const departments = await storage.getArtisticStaffDepartments(req.params.id);
      res.json(departments);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to set departments" });
    }
  });

  app.put("/api/departments/:id/artistic-staff/reorder", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = z.object({
      artisticStaffIds: z.array(z.string()),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    await storage.reorderArtisticStaffInDepartment(req.params.id, validation.data.artisticStaffIds);
    res.sendStatus(204);
  });

  // Attendance routes
  app.get("/api/attendance/artists", async (req, res) => {
    const artists = await storage.getAllArtists();
    // Include active and long_term_out artists (long_term_out can sign in for physio, etc.)
    const availableArtists = artists.filter(a => a.status === 'active' || a.status === 'long_term_out');
    // Return only public fields, excluding sensitive data like pinCode
    const publicArtists = availableArtists.map(({ pinCode, role, createdAt, ...publicFields }) => publicFields);
    res.json(publicArtists);
  });

  app.get("/api/attendance/artist-groups", async (req, res) => {
    const groups = await storage.getAllArtistGroups();
    res.json(groups);
  });

  app.post("/api/attendance/setup-pin", async (req, res) => {
    const validation = z.object({
      artistId: z.string(),
      pinCode: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.getArtist(validation.data.artistId);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    if (artist.pinCode) {
      return res.status(400).json({ error: "PIN already set" });
    }

    await storage.updateArtist(validation.data.artistId, {
      pinCode: validation.data.pinCode,
    });

    res.json({ success: true });
  });

  app.post("/api/attendance/sign-in", async (req, res) => {
    const validation = z.object({
      artistId: z.string(),
      pinCode: z.string().length(4),
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional().default(100), // GPS accuracy in meters
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.getArtist(validation.data.artistId);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    // Require linked user account for all sign-ins
    if (!artist.userId) {
      return res.status(403).json({ error: "This artist profile must be linked to a user account before signing in. Please contact your stage manager." });
    }

    if (artist.pinCode !== validation.data.pinCode) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    // Verify user authentication matches the linked account
    if (!req.user) {
      return res.status(401).json({ error: "You must be signed in to your account to sign in." });
    }
    if (req.user.id !== artist.userId) {
      return res.status(403).json({ error: "You must be signed in to the account linked to this artist profile." });
    }

    // Get existing geofence session for hysteresis
    const session = await storage.getGeofenceSession(validation.data.artistId);

    // Validate geofence with accuracy and hysteresis
    const geofenceResult = validateGeofence(
      validation.data.latitude,
      validation.data.longitude,
      validation.data.accuracy,
      session
    );

    if (!geofenceResult.isInside) {
      return res.status(403).json({ 
        error: "Not at venue", 
        message: geofenceResult.message,
        distance: geofenceResult.distanceToEdge,
        accuracy: Math.round(validation.data.accuracy),
      });
    }

    // Update geofence session
    await storage.upsertGeofenceSession({
      artistId: validation.data.artistId,
      isInside: 1,
      lastCheckedAt: new Date(),
      lastLatitude: validation.data.latitude.toString(),
      lastLongitude: validation.data.longitude.toString(),
      lastAccuracy: validation.data.accuracy.toString(),
    });

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await storage.getAttendanceRecord(validation.data.artistId, today);

    if (existingRecord?.signInTime && !existingRecord.signOutTime) {
      return res.status(400).json({ error: "Already signed in" });
    }

    let record;
    if (existingRecord && existingRecord.signOutTime) {
      record = await storage.updateAttendanceRecord(existingRecord.id, {
        signInTime: new Date(),
        signInLatitude: validation.data.latitude.toString(),
        signInLongitude: validation.data.longitude.toString(),
        signOutTime: null,
        signOutLatitude: null,
        signOutLongitude: null,
      });
    } else {
      record = await storage.createAttendanceRecord({
        artistId: validation.data.artistId,
        date: today,
        signInTime: new Date(),
        signInLatitude: validation.data.latitude.toString(),
        signInLongitude: validation.data.longitude.toString(),
      });
    }

    if (record) {
      broadcastAttendanceUpdate({
        record,
        artist,
        action: "sign_in",
      });
    }

    res.json({ success: true, record });
  });

  app.post("/api/attendance/sign-out", async (req, res) => {
    const validation = z.object({
      artistId: z.string(),
      pinCode: z.string().length(4),
      latitude: z.number(),
      longitude: z.number(),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.getArtist(validation.data.artistId);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    // Require linked user account for all sign-outs
    if (!artist.userId) {
      return res.status(403).json({ error: "This artist profile must be linked to a user account before signing out. Please contact your stage manager." });
    }

    if (artist.pinCode !== validation.data.pinCode) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    // Verify user authentication matches the linked account
    if (!req.user) {
      return res.status(401).json({ error: "You must be signed in to your account to sign out." });
    }
    if (req.user.id !== artist.userId) {
      return res.status(403).json({ error: "You must be signed in to the account linked to this artist profile." });
    }

    const today = new Date().toISOString().split('T')[0];
    const record = await storage.getAttendanceRecord(validation.data.artistId, today);

    if (!record || !record.signInTime) {
      return res.status(400).json({ error: "Not signed in" });
    }

    if (record.signOutTime) {
      return res.status(400).json({ error: "Already signed out" });
    }

    const updatedRecord = await storage.updateAttendanceRecord(record.id, {
      signOutTime: new Date(),
      signOutLatitude: validation.data.latitude.toString(),
      signOutLongitude: validation.data.longitude.toString(),
    });

    if (updatedRecord) {
      broadcastAttendanceUpdate({
        record: updatedRecord,
        artist,
        action: "sign_out",
      });
    }

    res.json({ success: true, record: updatedRecord });
  });

  app.get("/api/attendance/status/:artistId", async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const record = await storage.getAttendanceRecord(req.params.artistId, today);
    res.json(record || null);
  });

  app.get("/api/attendance/today", requireRole('stage_management', 'admin'), async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const records = await storage.getAttendanceRecordsByDate(today);
    const artists = await storage.getAllArtists();
    
    const attendanceMap = new Map(records.map(r => [r.artistId, r]));
    
    const statusList = artists.map(artist => ({
      artist,
      record: attendanceMap.get(artist.id) || null,
      isSignedIn: attendanceMap.get(artist.id)?.signInTime && !attendanceMap.get(artist.id)?.signOutTime,
    }));
    
    res.json(statusList);
  });

  // Helper function to check if a sign-in time is late (after 17:00 Dubai time)
  function isSignInLate(signInTime: Date | string | null): boolean {
    if (!signInTime) return false;
    
    // Convert to Date object if it's a string
    const date = typeof signInTime === 'string' ? new Date(signInTime) : signInTime;
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid sign-in time:', signInTime);
      return false;
    }
    
    // Get the hour in Dubai timezone
    const dubaiHour = parseInt(date.toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      hour: 'numeric',
      hour12: false
    }));
    
    return dubaiHour >= 17; // 5 PM (17:00) or later
  }

  app.get("/api/attendance/week", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid date range", details: validation.error.issues });
    }

    const records = await storage.getAttendanceRecordsByDateRange(
      validation.data.startDate,
      validation.data.endDate
    );
    
    // Get all artists to populate artist data in records
    const artists = await storage.getAllArtists();
    const artistMap = new Map(artists.map(a => [a.id, a]));
    
    // Generate array of dates in the range (7 days for a week)
    const dateArray: string[] = [];
    const start = new Date(validation.data.startDate);
    const end = new Date(validation.data.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateArray.push(d.toISOString().split('T')[0]);
    }
    
    // Group records by artist and date, and add isLate flag
    const artistRecordsMap = new Map<string, Map<string, any>>();
    
    records.forEach(record => {
      if (!artistRecordsMap.has(record.artistId)) {
        artistRecordsMap.set(record.artistId, new Map());
      }
      // Add isLate flag to each record based on Dubai timezone
      const recordWithLateFlag = {
        ...record,
        isLate: isSignInLate(record.signInTime),
      };
      artistRecordsMap.get(record.artistId)!.set(record.date, recordWithLateFlag);
    });
    
    // Build response with artist data, one record per day (null if absent)
    const weekRecords = artists
      .filter(artist => artist.status === 'active')
      .map(artist => {
        const artistRecords = artistRecordsMap.get(artist.id) || new Map();
        const records = dateArray.map(date => artistRecords.get(date) || null);
        
        return {
          artist,
          records,
        };
      });
    
    res.json(weekRecords);
  });

  app.post("/api/attendance/manual-sign-out", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = z.object({
      artistId: z.string(),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.getArtist(validation.data.artistId);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const today = new Date().toISOString().split('T')[0];
    const record = await storage.getAttendanceRecord(validation.data.artistId, today);

    if (!record || !record.signInTime) {
      return res.status(400).json({ error: "Artist is not signed in" });
    }

    if (record.signOutTime) {
      return res.status(400).json({ error: "Artist already signed out" });
    }

    const updatedRecord = await storage.updateAttendanceRecord(record.id, {
      signOutTime: new Date(),
      signedOutBy: req.user!.id,
    });

    if (updatedRecord) {
      broadcastAttendanceUpdate({
        record: updatedRecord,
        artist,
        action: "sign_out",
      });
    }

    res.json({ success: true, record: updatedRecord });
  });

  app.post("/api/attendance/manual-sign-in", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = z.object({
      artistId: z.string(),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.getArtist(validation.data.artistId);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await storage.getAttendanceRecord(validation.data.artistId, today);

    if (existingRecord?.signInTime && !existingRecord.signOutTime) {
      return res.status(400).json({ error: "Artist is already signed in" });
    }

    let record;
    if (existingRecord && existingRecord.signOutTime) {
      // Re-sign in after being signed out
      record = await storage.updateAttendanceRecord(existingRecord.id, {
        signInTime: new Date(),
        signedInBy: req.user!.id,
        signOutTime: null,
        signedOutBy: null,
      });
    } else {
      // First sign-in of the day
      record = await storage.createAttendanceRecord({
        artistId: validation.data.artistId,
        date: today,
        signInTime: new Date(),
        signedInBy: req.user!.id,
      });
    }

    if (record) {
      broadcastAttendanceUpdate({
        record,
        artist,
        action: "sign_in",
      });
    }

    res.json({ success: true, record });
  });

  app.patch("/api/artists/:id/status", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = z.object({
      status: z.enum(['active', 'out', 'long_term_out']),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const artist = await storage.updateArtist(req.params.id, {
      status: validation.data.status,
    });

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    broadcastArtistStatusUpdate({
      artistId: req.params.id,
      status: validation.data.status,
    });

    res.json(artist);
  });

  app.patch("/api/artists/:id/link-user", requireRole('stage_management', 'admin'), async (req, res) => {
    const validation = z.object({
      userId: z.string(),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const user = await storage.getUser(validation.data.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingLink = await storage.getArtistByUserId(validation.data.userId);
    if (existingLink) {
      return res.status(400).json({ error: "This user is already linked to another artist profile" });
    }

    const artist = await storage.updateArtist(req.params.id, {
      userId: validation.data.userId,
    });

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json(artist);
  });

  app.patch("/api/artists/:id/unlink-user", requireRole('stage_management', 'admin'), async (req, res) => {
    const artist = await storage.updateArtist(req.params.id, {
      userId: null,
    });

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json(artist);
  });

  // Tick Sheet routes
  app.get("/api/tick-sheets", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const activeOnly = req.query.active === 'true';
    const sheets = activeOnly 
      ? await storage.getActiveTickSheets() 
      : await storage.getAllTickSheets();
    
    res.json(sheets);
  });

  app.post("/api/tick-sheets", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = insertTickSheetSchema.safeParse({
      ...req.body,
      createdBy: req.user!.id,
    });
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const sheet = await storage.createTickSheet(validation.data);
    res.json(sheet);
  });

  app.get("/api/tick-sheets/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const sheet = await storage.getTickSheet(req.params.id);
    if (!sheet) {
      return res.status(404).json({ error: "Tick sheet not found" });
    }
    
    res.json(sheet);
  });

  app.get("/api/tick-sheets/:id/marks", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const marks = await storage.getTickSheetMarks(req.params.id);
    res.json(marks);
  });

  app.post("/api/tick-sheets/:id/marks", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = z.object({
      artistId: z.string(),
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const sheet = await storage.getTickSheet(req.params.id);
    if (!sheet) {
      return res.status(404).json({ error: "Tick sheet not found" });
    }

    const mark = await storage.createTickSheetMark({
      tickSheetId: req.params.id,
      artistId: validation.data.artistId,
      markedBy: req.user!.id,
    });

    broadcastTickSheetUpdate({
      tickSheetId: req.params.id,
      mark,
      artistId: validation.data.artistId,
      action: "mark",
    });

    res.json(mark);
  });

  app.delete("/api/tick-sheets/:id/marks/:artistId", requireRole('stage_management', 'admin'), async (req, res) => {
    
    await storage.deleteTickSheetMarksByArtist(req.params.id, req.params.artistId);

    broadcastTickSheetUpdate({
      tickSheetId: req.params.id,
      artistId: req.params.artistId,
      action: "unmark",
    });

    res.sendStatus(204);
  });

  app.post("/api/tick-sheets/:id/reset", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const sheet = await storage.getTickSheet(req.params.id);
    if (!sheet) {
      return res.status(404).json({ error: "Tick sheet not found" });
    }

    await storage.resetTickSheet(req.params.id);

    broadcastTickSheetUpdate({
      tickSheetId: req.params.id,
      artistId: "",
      action: "reset",
    });

    res.json({ success: true });
  });

  app.patch("/api/tick-sheets/:id", requireRole('stage_management', 'admin'), async (req, res) => {
    
    const validation = insertTickSheetSchema.partial().safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }

    const sheet = await storage.updateTickSheet(req.params.id, validation.data);
    if (!sheet) {
      return res.status(404).json({ error: "Tick sheet not found" });
    }
    
    res.json(sheet);
  });

  // Report Template routes
  app.get("/api/report-template", canViewSettingsReportTemplate, async (req, res) => {
    const template = await storage.getReportTemplate();
    res.json(template || null);
  });

  app.put("/api/report-template", canEditSettingsReportTemplate, async (req, res) => {
    const validation = insertReportTemplateSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const template = await storage.updateReportTemplate(validation.data, req.user!.id);
    res.json(template);
  });

  // Reports routes
  app.get("/api/reports", canViewReports, async (req, res) => {
    const reports = await storage.getAllReports();
    res.json(reports);
  });

  app.get("/api/reports/:id", canViewReports, async (req, res) => {
    const report = await storage.getReport(req.params.id);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.get("/api/reports/date/:date", canViewReports, async (req, res) => {
    const report = await storage.getReportByDate(req.params.date);
    res.json(report || null);
  });

  app.post("/api/reports", canCreateReports, async (req, res) => {
    const validation = insertReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const report = await storage.createReport(validation.data, req.user!.id);
    res.json(report);
  });

  app.patch("/api/reports/:id", canEditReports, async (req, res) => {
    const validation = insertReportSchema.partial().omit({ createdBy: true }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const report = await storage.updateReport(req.params.id, validation.data, req.user!.id);
    if (!report) return res.sendStatus(404);
    res.json(report);
  });

  app.delete("/api/reports/:id", canEditReports, async (req, res) => {
    await storage.deleteReport(req.params.id);
    res.sendStatus(204);
  });

  // Trainings routes
  app.get("/api/trainings/all", canViewReports, async (req, res) => {
    const allTrainings = await db
      .select()
      .from(trainings)
      .orderBy(asc(trainings.startTime), asc(trainings.endTime));
    res.json(allTrainings);
  });

  app.get("/api/reports/:reportId/trainings", canViewReports, async (req, res) => {
    const trainings = await storage.getTrainingsByReportId(req.params.reportId);
    res.json(trainings);
  });

  app.get("/api/trainings/:id", canViewReports, async (req, res) => {
    const training = await storage.getTraining(req.params.id);
    if (!training) return res.sendStatus(404);
    res.json(training);
  });

  app.post("/api/trainings", canCreateReports, async (req, res) => {
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

  app.patch("/api/trainings/:id", canEditReports, async (req, res) => {
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

  app.delete("/api/trainings/:id", canEditReports, async (req, res) => {
    await storage.deleteTraining(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/trainings/:trainingId/locations", canViewReports, async (req, res) => {
    const locations = await storage.getTrainingLocations(req.params.trainingId);
    res.json(locations);
  });

  app.get("/api/trainings/:trainingId/artists", canViewReports, async (req, res) => {
    const trainingArtists = await storage.getTrainingArtists(req.params.trainingId);
    res.json(trainingArtists);
  });

  // Department Assignments routes
  app.get("/api/trainings/:trainingId/assignments", canViewReports, async (req, res) => {
    const assignments = await storage.getAssignmentsByTrainingId(req.params.trainingId);
    res.json(assignments);
  });

  app.post("/api/assignments", canCreateReports, async (req, res) => {
    const validation = insertDepartmentAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const assignment = await storage.createAssignment(validation.data);
    res.json(assignment);
  });

  app.patch("/api/assignments/:id", canEditReports, async (req, res) => {
    const validation = insertDepartmentAssignmentSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
    }
    const assignment = await storage.updateAssignment(req.params.id, validation.data);
    if (!assignment) return res.sendStatus(404);
    res.json(assignment);
  });

  app.delete("/api/assignments/:id", canEditReports, async (req, res) => {
    await storage.deleteAssignment(req.params.id);
    res.sendStatus(204);
  });

  // Get all junction table data for search
  app.get("/api/training-locations/all", canViewReports, async (req, res) => {
    const trainingLocations = await storage.getAllTrainingLocations();
    res.json(trainingLocations);
  });

  app.get("/api/training-artists/all", canViewReports, async (req, res) => {
    const trainingArtists = await storage.getAllTrainingArtists();
    res.json(trainingArtists);
  });

  app.get("/api/assignments/all", canViewReports, async (req, res) => {
    const assignments = await storage.getAllAssignments();
    res.json(assignments);
  });

  // Email preview endpoint
  app.get("/api/reports/:reportId/email-preview", canViewReports, async (req, res) => {

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
          .map(a => a!.preferredName || `${a!.firstName} ${a!.lastName}`);

        // Get departments with lead technicians
        const assignments = await storage.getAssignmentsByTrainingId(training.id);
        const departmentNames = assignments.map(assignment => {
          const dept = departments.find(d => d.id === assignment.departmentId);
          if (!dept) return '';
          
          if (assignment.leadTechnicianId) {
            const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
            if (tech) {
              const techName = tech.preferredName || `${tech.firstName} ${tech.lastName}`;
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
  app.get("/api/reports/:reportId/pdf", canViewReports, async (req, res) => {

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
          .map(a => a!.preferredName || `${a!.firstName} ${a!.lastName}`);

        // Get departments with lead technicians
        const assignments = await storage.getAssignmentsByTrainingId(training.id);
        const departmentNames = assignments.map(assignment => {
          const dept = departments.find(d => d.id === assignment.departmentId);
          if (!dept) return '';
          
          if (assignment.leadTechnicianId) {
            const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
            if (tech) {
              const techName = tech.preferredName || `${tech.firstName} ${tech.lastName}`;
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
      const fileName = `ART-SM-REP La Perle Training Report ${dateFormatted}.pdf`;
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
  app.post("/api/reports/:reportId/send-email", canEditReports, async (req, res) => {

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
            .map(a => a!.preferredName || `${a!.firstName} ${a!.lastName}`);

          const assignments = await storage.getAssignmentsByTrainingId(training.id);
          const departmentNames = assignments.map(assignment => {
            const dept = departments.find(d => d.id === assignment.departmentId);
            if (!dept) return '';
            
            if (assignment.leadTechnicianId) {
              const tech = technicians.find(t => t.id === assignment.leadTechnicianId);
              if (tech) {
                const techName = tech.preferredName || `${tech.firstName} ${tech.lastName}`;
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
      const pdfFileName = `ART-SM-REP La Perle Training Report ${dateFormatted}.pdf`;

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

  // User Permissions Routes (Admin only)
  app.get("/api/permissions", requireRole('admin'), async (req, res) => {
    try {
      const permissions = await storage.getAllUserPermissions();
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/:userId", requireRole('admin'), async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  // Get all permissions for a specific user (for frontend sidebar filtering)
  app.get("/api/permissions/user/:userId", async (req, res) => {
    try {
      // Users can only fetch their own permissions unless they're admin
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }
      
      // Validate and normalize the userId parameter to prevent path traversal and case bypasses
      const userIdSchema = z.string().uuid();
      const validation = userIdSchema.safeParse(req.params.userId);
      
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      const requestedUserId = validation.data.toLowerCase();
      const currentUserId = req.user!.id.toLowerCase();
      
      // Non-admin users can only access their own permissions
      if (currentUserId !== requestedUserId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Cannot access other users' permissions" });
      }
      
      const permissions = await storage.getUserPermissions(requestedUserId);
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.get("/api/permissions/user/:userId/feature/:feature", requireRole('admin'), async (req, res) => {
    try {
      const permission = await storage.getUserPermissionByFeature(req.params.userId, req.params.feature);
      if (!permission) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json(permission);
    } catch (error: any) {
      console.error("Error fetching permission:", error);
      res.status(500).json({ error: "Failed to fetch permission" });
    }
  });

  app.post("/api/permissions", requireRole('admin'), async (req, res) => {
    try {
      const validation = insertUserPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.issues,
        });
      }
      
      const permission = await storage.createUserPermission(validation.data);
      res.status(201).json(permission);
    } catch (error: any) {
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.patch("/api/permissions/:id", requireRole('admin'), async (req, res) => {
    try {
      const validation = updateUserPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.issues,
        });
      }
      
      const permission = await storage.updateUserPermission(req.params.id, validation.data);
      if (!permission) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json(permission);
    } catch (error: any) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  app.delete("/api/permissions/:id", requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteUserPermission(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ error: "Failed to delete permission" });
    }
  });

  // Bulk update permissions for a user
  app.post("/api/permissions/bulk/:userId", requireRole('admin'), async (req, res) => {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array" });
      }
      
      // Validate each permission in the array
      const permissionSchema = z.object({
        feature: z.enum(featureNames),
        canView: z.number().min(0).max(1),
        canCreate: z.number().min(0).max(1),
        canEdit: z.number().min(0).max(1),
      });
      
      for (const perm of permissions) {
        const validation = permissionSchema.safeParse(perm);
        if (!validation.success) {
          return res.status(400).json({
            error: "Invalid permission data",
            details: validation.error.issues,
          });
        }
      }
      
      await storage.bulkUpsertUserPermissions(req.params.userId, permissions);
      res.json({ success: true, message: "Permissions updated successfully" });
    } catch (error: any) {
      console.error("Error bulk updating permissions:", error);
      res.status(500).json({ error: "Failed to bulk update permissions" });
    }
  });

  // System Settings Routes (Admin only)
  app.get("/api/settings", requireRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/category/:category", requireRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getSystemSettingsByCategory(req.params.category);
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching settings by category:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", requireRole('admin'), async (req, res) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", requireRole('admin'), async (req, res) => {
    try {
      const validation = insertSystemSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.issues,
        });
      }
      
      const setting = await storage.createSystemSetting(validation.data);
      res.status(201).json(setting);
    } catch (error: any) {
      console.error("Error creating setting:", error);
      res.status(500).json({ error: "Failed to create setting" });
    }
  });

  app.patch("/api/settings/:key", requireRole('admin'), async (req, res) => {
    try {
      const { value } = req.body;
      const updatedBy = req.user?.id;
      const setting = await storage.updateSystemSetting(req.params.key, value, updatedBy);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteSystemSetting(req.params.key);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  // Get feature names for permission management
  app.get("/api/features", requireRole('admin'), async (req, res) => {
    try {
      res.json(featureNames);
    } catch (error: any) {
      console.error("Error fetching features:", error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Role Page Access routes
  app.get("/api/role-page-access", requireRole('admin'), async (req, res) => {
    try {
      const access = await storage.getAllRolePageAccess();
      res.json(access);
    } catch (error: any) {
      console.error("Error fetching role page access:", error);
      res.status(500).json({ error: "Failed to fetch role page access" });
    }
  });

  app.get("/api/role-page-access/role/:role", requireRole('admin'), async (req, res) => {
    try {
      const access = await storage.getRolePageAccessByRole(req.params.role);
      res.json(access);
    } catch (error: any) {
      console.error("Error fetching role page access:", error);
      res.status(500).json({ error: "Failed to fetch role page access" });
    }
  });

  // Bulk update role page access for a role
  app.post("/api/role-page-access/bulk/:role", requireRole('admin'), async (req, res) => {
    try {
      // Validate role parameter
      if (!userRoles.includes(req.params.role as any)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Validate request body
      const validation = bulkRolePageAccessSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: validation.error.errors 
        });
      }
      
      await storage.bulkUpsertRolePageAccess(req.params.role, validation.data.pages);
      res.json({ success: true, message: "Role page access updated successfully" });
    } catch (error: any) {
      console.error("Error bulk updating role page access:", error);
      res.status(500).json({ error: "Failed to bulk update role page access" });
    }
  });

  // ========== LINEUP FOUNDATION ROUTES ==========

  // Training Programs
  app.get("/api/training-programs", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const programs = await storage.getAllTrainingPrograms();
      res.json(programs);
    } catch (error: any) {
      console.error("Error fetching training programs:", error);
      res.status(500).json({ error: "Failed to fetch training programs" });
    }
  });

  app.get("/api/training-programs/templates", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const templates = await storage.getTrainingProgramTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching program templates:", error);
      res.status(500).json({ error: "Failed to fetch program templates" });
    }
  });

  app.get("/api/training-programs/:id", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const program = await storage.getTrainingProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ error: "Training program not found" });
      }
      res.json(program);
    } catch (error: any) {
      console.error("Error fetching training program:", error);
      res.status(500).json({ error: "Failed to fetch training program" });
    }
  });

  app.post("/api/training-programs", canCreateLineupsTrainingPrograms, async (req, res) => {
    try {
      console.log("Creating training program with data:", JSON.stringify(req.body, null, 2));
      const validation = insertTrainingProgramSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation failed:", validation.error.issues);
        return res.status(400).json({ error: "Validation failed", details: validation.error.issues });
      }
      const program = await storage.createTrainingProgram({ ...validation.data, createdBy: req.user?.id });
      res.status(201).json(program);
    } catch (error: any) {
      console.error("Error creating training program:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to create training program", details: error.message });
    }
  });

  app.patch("/api/training-programs/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const program = await storage.updateTrainingProgram(req.params.id, { ...req.body, updatedBy: req.user?.id });
      if (!program) {
        return res.status(404).json({ error: "Training program not found" });
      }
      res.json(program);
    } catch (error: any) {
      console.error("Error updating training program:", error);
      res.status(500).json({ error: "Failed to update training program" });
    }
  });

  app.delete("/api/training-programs/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      await storage.deleteTrainingProgram(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting training program:", error);
      res.status(500).json({ error: "Failed to delete training program" });
    }
  });

  app.post("/api/training-programs/:templateId/create-from-template", canCreateLineupsTrainingPrograms, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Program name is required" });
      }
      const newProgram = await storage.createProgramFromTemplate(req.params.templateId, name, req.user?.id);
      res.status(201).json(newProgram);
    } catch (error: any) {
      console.error("Error creating program from template:", error);
      res.status(500).json({ error: "Failed to create program from template" });
    }
  });

  // Program Steps
  app.get("/api/training-programs/:programId/steps", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const steps = await storage.getProgramSteps(req.params.programId);
      res.json(steps);
    } catch (error: any) {
      console.error("Error fetching program steps:", error);
      res.status(500).json({ error: "Failed to fetch program steps" });
    }
  });

  app.post("/api/program-steps", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const step = await storage.createProgramStep(req.body);
      res.status(201).json(step);
    } catch (error: any) {
      console.error("Error creating program step:", error);
      res.status(500).json({ error: "Failed to create program step" });
    }
  });

  app.patch("/api/program-steps/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const step = await storage.updateProgramStep(req.params.id, req.body);
      if (!step) {
        return res.status(404).json({ error: "Program step not found" });
      }
      res.json(step);
    } catch (error: any) {
      console.error("Error updating program step:", error);
      res.status(500).json({ error: "Failed to update program step" });
    }
  });

  app.delete("/api/program-steps/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      await storage.deleteProgramStep(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting program step:", error);
      res.status(500).json({ error: "Failed to delete program step" });
    }
  });

  app.patch("/api/program-steps/:id/sign-off", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const step = await storage.getProgramStep(req.params.id);
      if (!step) {
        return res.status(404).json({ error: "Program step not found" });
      }

      const currentUser = await storage.getUser(req.user.id);
      let canSignOff = false;

      if (currentUser?.role === 'admin') {
        canSignOff = true;
      } else {
        const technician = await storage.getTechnicianByUserId(req.user.id);
        if (!technician) {
          return res.status(403).json({ error: "You do not have permission to sign off this step" });
        }

        const technicianAssignments = await storage.getTechnicianDepartments(technician.id);
        const technicianDepartmentIds = technicianAssignments.map((a) => a.departmentId);

        const signOffDept = await storage.getDepartment(step.departmentSignOffId);
        
        if (signOffDept?.name === "Stage Management" && signOffDept.type === "artistic") {
          canSignOff = technicianDepartmentIds.includes(step.departmentSignOffId);
        } else {
          const roles = await storage.getDepartmentRoles(step.departmentSignOffId);
          const userRoles = roles.filter((r) => r.technicianId === technician.id);
          canSignOff = userRoles.some((r) => ['hod', 'ahod', 'lead'].includes(r.roleType));
        }
      }

      if (!canSignOff) {
        return res.status(403).json({ error: "You do not have permission to sign off this step" });
      }

      const updatedStep = await storage.updateProgramStep(req.params.id, {
        signedOffByUserId: req.user.id,
        signedOffAt: new Date(),
      });

      res.json(updatedStep);
    } catch (error: any) {
      console.error("Error signing off step:", error);
      res.status(500).json({ error: "Failed to sign off step" });
    }
  });

  // Program Artists
  app.get("/api/training-programs/:programId/artists", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const programArtists = await storage.getProgramArtists(req.params.programId);
      res.json(programArtists);
    } catch (error: any) {
      console.error("Error fetching program artists:", error);
      res.status(500).json({ error: "Failed to fetch program artists" });
    }
  });

  app.get("/api/artists/:artistId/programs", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const programs = await storage.getArtistPrograms(req.params.artistId);
      res.json(programs);
    } catch (error: any) {
      console.error("Error fetching artist programs:", error);
      res.status(500).json({ error: "Failed to fetch artist programs" });
    }
  });

  app.post("/api/program-artists", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const programArtist = await storage.createProgramArtist(req.body);
      res.status(201).json(programArtist);
    } catch (error: any) {
      console.error("Error adding artist to program:", error);
      res.status(500).json({ error: "Failed to add artist to program" });
    }
  });

  app.patch("/api/program-artists/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const programArtist = await storage.updateProgramArtist(req.params.id, req.body);
      if (!programArtist) {
        return res.status(404).json({ error: "Program artist not found" });
      }
      res.json(programArtist);
    } catch (error: any) {
      console.error("Error updating program artist:", error);
      res.status(500).json({ error: "Failed to update program artist" });
    }
  });

  app.delete("/api/program-artists/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      await storage.deleteProgramArtist(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error removing artist from program:", error);
      res.status(500).json({ error: "Failed to remove artist from program" });
    }
  });

  // Step Status Records
  app.get("/api/program-artists/:programArtistId/steps", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const records = await storage.getStepStatusRecords(req.params.programArtistId);
      res.json(records);
    } catch (error: any) {
      console.error("Error fetching step status records:", error);
      res.status(500).json({ error: "Failed to fetch step status records" });
    }
  });

  app.post("/api/step-status-records", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const record = await storage.createStepStatusRecord({ ...req.body, recordedBy: req.user?.id });
      res.status(201).json(record);
    } catch (error: any) {
      console.error("Error creating step status record:", error);
      res.status(500).json({ error: "Failed to create step status record" });
    }
  });

  app.patch("/api/step-status-records/:id", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const record = await storage.updateStepStatusRecord(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Step status record not found" });
      }
      res.json(record);
    } catch (error: any) {
      console.error("Error updating step status record:", error);
      res.status(500).json({ error: "Failed to update step status record" });
    }
  });

  // Final Validations
  app.get("/api/program-artists/:programArtistId/validation", canViewLineupsTrainingPrograms, async (req, res) => {
    try {
      const validation = await storage.getFinalValidation(req.params.programArtistId);
      res.json(validation || null);
    } catch (error: any) {
      console.error("Error fetching final validation:", error);
      res.status(500).json({ error: "Failed to fetch final validation" });
    }
  });

  app.post("/api/final-validations", canEditLineupsTrainingPrograms, async (req, res) => {
    try {
      const validation = await storage.createFinalValidation({ ...req.body, validatedBy: req.user?.id });
      res.status(201).json(validation);
    } catch (error: any) {
      console.error("Error creating final validation:", error);
      res.status(500).json({ error: "Failed to create final validation" });
    }
  });

  // Competencies
  app.get("/api/competencies", canViewLineupsCompetencies, async (req, res) => {
    try {
      const competencies = await storage.getAllCompetencies();
      res.json(competencies);
    } catch (error: any) {
      console.error("Error fetching competencies:", error);
      res.status(500).json({ error: "Failed to fetch competencies" });
    }
  });

  app.get("/api/competencies/:id", canViewLineupsCompetencies, async (req, res) => {
    try {
      const competency = await storage.getCompetency(req.params.id);
      if (!competency) {
        return res.status(404).json({ error: "Competency not found" });
      }
      res.json(competency);
    } catch (error: any) {
      console.error("Error fetching competency:", error);
      res.status(500).json({ error: "Failed to fetch competency" });
    }
  });

  app.post("/api/competencies", canCreateLineupsCompetencies, async (req, res) => {
    try {
      const competency = await storage.createCompetency(req.body);
      res.status(201).json(competency);
    } catch (error: any) {
      console.error("Error creating competency:", error);
      res.status(500).json({ error: "Failed to create competency" });
    }
  });

  app.patch("/api/competencies/:id", canEditLineupsCompetencies, async (req, res) => {
    try {
      const competency = await storage.updateCompetency(req.params.id, req.body);
      if (!competency) {
        return res.status(404).json({ error: "Competency not found" });
      }
      res.json(competency);
    } catch (error: any) {
      console.error("Error updating competency:", error);
      res.status(500).json({ error: "Failed to update competency" });
    }
  });

  app.delete("/api/competencies/:id", canEditLineupsCompetencies, async (req, res) => {
    try {
      await storage.deleteCompetency(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting competency:", error);
      res.status(500).json({ error: "Failed to delete competency" });
    }
  });

  // Positions
  app.get("/api/positions", canViewLineupsPositions, async (req, res) => {
    try {
      const positions = await storage.getAllPositions();
      res.json(positions);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", canViewLineupsPositions, async (req, res) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(position);
    } catch (error: any) {
      console.error("Error fetching position:", error);
      res.status(500).json({ error: "Failed to fetch position" });
    }
  });

  app.post("/api/positions", canCreateLineupsPositions, async (req, res) => {
    try {
      const position = await storage.createPosition(req.body);
      res.status(201).json(position);
    } catch (error: any) {
      console.error("Error creating position:", error);
      res.status(500).json({ error: "Failed to create position" });
    }
  });

  app.patch("/api/positions/:id", canEditLineupsPositions, async (req, res) => {
    try {
      const position = await storage.updatePosition(req.params.id, req.body);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(position);
    } catch (error: any) {
      console.error("Error updating position:", error);
      res.status(500).json({ error: "Failed to update position" });
    }
  });

  app.delete("/api/positions/:id", canEditLineupsPositions, async (req, res) => {
    try {
      await storage.deletePosition(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting position:", error);
      res.status(500).json({ error: "Failed to delete position" });
    }
  });

  // Position Competencies
  app.get("/api/positions/:positionId/competencies", canViewLineupsPositions, async (req, res) => {
    try {
      const competencies = await storage.getPositionCompetencies(req.params.positionId);
      res.json(competencies);
    } catch (error: any) {
      console.error("Error fetching position competencies:", error);
      res.status(500).json({ error: "Failed to fetch position competencies" });
    }
  });

  app.put("/api/positions/:positionId/competencies", canEditLineupsPositions, async (req, res) => {
    try {
      const { competencyIds } = req.body;
      await storage.setPositionCompetencies(req.params.positionId, competencyIds);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error setting position competencies:", error);
      res.status(500).json({ error: "Failed to set position competencies" });
    }
  });

  // Position Tracks (Linked Positions)
  app.get("/api/position-tracks", canViewLineupsPositions, async (req, res) => {
    try {
      const tracks = await storage.getAllPositionTracks();
      res.json(tracks);
    } catch (error: any) {
      console.error("Error fetching position tracks:", error);
      res.status(500).json({ error: "Failed to fetch position tracks" });
    }
  });

  app.get("/api/position-tracks/:id", canViewLineupsPositions, async (req, res) => {
    try {
      const track = await storage.getPositionTrack(req.params.id);
      if (!track) {
        return res.status(404).json({ error: "Position track not found" });
      }
      res.json(track);
    } catch (error: any) {
      console.error("Error fetching position track:", error);
      res.status(500).json({ error: "Failed to fetch position track" });
    }
  });

  app.post("/api/position-tracks", canCreateLineupsPositions, async (req, res) => {
    try {
      const track = await storage.createPositionTrack(req.body);
      res.status(201).json(track);
    } catch (error: any) {
      console.error("Error creating position track:", error);
      res.status(500).json({ error: "Failed to create position track" });
    }
  });

  app.patch("/api/position-tracks/:id", canEditLineupsPositions, async (req, res) => {
    try {
      const track = await storage.updatePositionTrack(req.params.id, req.body);
      if (!track) {
        return res.status(404).json({ error: "Position track not found" });
      }
      res.json(track);
    } catch (error: any) {
      console.error("Error updating position track:", error);
      res.status(500).json({ error: "Failed to update position track" });
    }
  });

  app.delete("/api/position-tracks/:id", canEditLineupsPositions, async (req, res) => {
    try {
      await storage.deletePositionTrack(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting position track:", error);
      res.status(500).json({ error: "Failed to delete position track" });
    }
  });

  app.get("/api/position-tracks/:trackId/positions", canViewLineupsPositions, async (req, res) => {
    try {
      const positions = await storage.getTrackPositions(req.params.trackId);
      res.json(positions);
    } catch (error: any) {
      console.error("Error fetching track positions:", error);
      res.status(500).json({ error: "Failed to fetch track positions" });
    }
  });

  app.post("/api/position-tracks/:trackId/positions", canEditLineupsPositions, async (req, res) => {
    try {
      const { positionIds } = req.body;
      await storage.addPositionsToTrack(req.params.trackId, positionIds);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error adding positions to track:", error);
      res.status(500).json({ error: "Failed to add positions to track" });
    }
  });

  app.delete("/api/position-tracks/:trackId/positions/:positionId", canEditLineupsPositions, async (req, res) => {
    try {
      await storage.removePositionFromTrack(req.params.trackId, req.params.positionId);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error removing position from track:", error);
      res.status(500).json({ error: "Failed to remove position from track" });
    }
  });

  // Lineup Rules
  app.get("/api/lineup-rules", canViewLineupsRules, async (req, res) => {
    try {
      const rules = req.query.active === 'true' 
        ? await storage.getActiveLineupRules()
        : await storage.getAllLineupRules();
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching lineup rules:", error);
      res.status(500).json({ error: "Failed to fetch lineup rules" });
    }
  });

  app.get("/api/lineup-rules/:id", canViewLineupsRules, async (req, res) => {
    try {
      const rule = await storage.getLineupRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ error: "Lineup rule not found" });
      }
      res.json(rule);
    } catch (error: any) {
      console.error("Error fetching lineup rule:", error);
      res.status(500).json({ error: "Failed to fetch lineup rule" });
    }
  });

  app.post("/api/lineup-rules", canCreateLineupsRules, async (req, res) => {
    try {
      const rule = await storage.createLineupRule({ ...req.body, createdBy: req.user?.id });
      res.status(201).json(rule);
    } catch (error: any) {
      console.error("Error creating lineup rule:", error);
      res.status(500).json({ error: "Failed to create lineup rule" });
    }
  });

  app.patch("/api/lineup-rules/:id", canEditLineupsRules, async (req, res) => {
    try {
      const rule = await storage.updateLineupRule(req.params.id, { ...req.body, updatedBy: req.user?.id });
      if (!rule) {
        return res.status(404).json({ error: "Lineup rule not found" });
      }
      res.json(rule);
    } catch (error: any) {
      console.error("Error updating lineup rule:", error);
      res.status(500).json({ error: "Failed to update lineup rule" });
    }
  });

  app.delete("/api/lineup-rules/:id", canEditLineupsRules, async (req, res) => {
    try {
      await storage.deleteLineupRule(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting lineup rule:", error);
      res.status(500).json({ error: "Failed to delete lineup rule" });
    }
  });

  // PWD Restrictions (Read-only for Stage Management)
  app.get("/api/pwd-restrictions", canViewLineupsRestrictions, async (req, res) => {
    try {
      const restrictions = req.query.active === 'true'
        ? await storage.getActivePwdRestrictions()
        : await storage.getAllPwdRestrictions();
      res.json(restrictions);
    } catch (error: any) {
      console.error("Error fetching PWD restrictions:", error);
      res.status(500).json({ error: "Failed to fetch PWD restrictions" });
    }
  });

  app.get("/api/pwd-restrictions/:id", canViewLineupsRestrictions, async (req, res) => {
    try {
      const restriction = await storage.getPwdRestriction(req.params.id);
      if (!restriction) {
        return res.status(404).json({ error: "PWD restriction not found" });
      }
      res.json(restriction);
    } catch (error: any) {
      console.error("Error fetching PWD restriction:", error);
      res.status(500).json({ error: "Failed to fetch PWD restriction" });
    }
  });

  app.get("/api/artists/:artistId/pwd-restrictions", canViewLineupsRestrictions, async (req, res) => {
    try {
      const restrictions = await storage.getArtistPwdRestrictions(req.params.artistId);
      res.json(restrictions);
    } catch (error: any) {
      console.error("Error fetching artist PWD restrictions:", error);
      res.status(500).json({ error: "Failed to fetch artist PWD restrictions" });
    }
  });

  // PWD Restrictions Management (Admin only - managed by PWD team)
  app.post("/api/pwd-restrictions", requireRole('admin'), async (req, res) => {
    try {
      const restriction = await storage.createPwdRestriction({ ...req.body, createdBy: req.user?.id });
      res.status(201).json(restriction);
    } catch (error: any) {
      console.error("Error creating PWD restriction:", error);
      res.status(500).json({ error: "Failed to create PWD restriction" });
    }
  });

  app.patch("/api/pwd-restrictions/:id", requireRole('admin'), async (req, res) => {
    try {
      const restriction = await storage.updatePwdRestriction(req.params.id, { ...req.body, updatedBy: req.user?.id });
      if (!restriction) {
        return res.status(404).json({ error: "PWD restriction not found" });
      }
      res.json(restriction);
    } catch (error: any) {
      console.error("Error updating PWD restriction:", error);
      res.status(500).json({ error: "Failed to update PWD restriction" });
    }
  });

  app.delete("/api/pwd-restrictions/:id", requireRole('admin'), async (req, res) => {
    try {
      await storage.deletePwdRestriction(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting PWD restriction:", error);
      res.status(500).json({ error: "Failed to delete PWD restriction" });
    }
  });

  // Department Roles (for Settings → Departments)
  app.get("/api/departments/:departmentId/roles", canViewSettingsDepartments, async (req, res) => {
    try {
      const roles = await storage.getDepartmentRoles(req.params.departmentId);
      res.json(roles);
    } catch (error: any) {
      console.error("Error fetching department roles:", error);
      res.status(500).json({ error: "Failed to fetch department roles" });
    }
  });

  app.post("/api/departments/:departmentId/roles", canEditSettingsDepartments, async (req, res) => {
    try {
      const { technicianId, roleType } = req.body;
      const role = await storage.createDepartmentRole({
        departmentId: req.params.departmentId,
        technicianId,
        roleType,
      });
      res.status(201).json(role);
    } catch (error: any) {
      console.error("Error creating department role:", error);
      res.status(500).json({ error: "Failed to create department role" });
    }
  });

  app.patch("/api/department-roles/:id", canEditSettingsDepartments, async (req, res) => {
    try {
      const { roleType } = req.body;
      const role = await storage.updateDepartmentRole(req.params.id, { roleType });
      if (!role) {
        return res.status(404).json({ error: "Department role not found" });
      }
      res.json(role);
    } catch (error: any) {
      console.error("Error updating department role:", error);
      res.status(500).json({ error: "Failed to update department role" });
    }
  });

  app.delete("/api/department-roles/:id", canEditSettingsDepartments, async (req, res) => {
    try {
      await storage.deleteDepartmentRole(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting department role:", error);
      res.status(500).json({ error: "Failed to delete department role" });
    }
  });

  app.put("/api/departments/:departmentId/roles", canEditSettingsDepartments, async (req, res) => {
    try {
      const { roles } = req.body;
      await storage.setDepartmentRoles(req.params.departmentId, roles);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error setting department roles:", error);
      res.status(500).json({ error: "Failed to set department roles" });
    }
  });

  // Artist Competencies
  app.get("/api/artists/:artistId/competencies", canViewLineupsCompetencies, async (req, res) => {
    try {
      const competencies = await storage.getArtistCompetencies(req.params.artistId);
      res.json(competencies);
    } catch (error: any) {
      console.error("Error fetching artist competencies:", error);
      res.status(500).json({ error: "Failed to fetch artist competencies" });
    }
  });

  app.get("/api/artist-competencies", canViewLineupsCompetencies, async (req, res) => {
    try {
      const { competencyId } = req.query;
      if (!competencyId) {
        return res.status(400).json({ error: "competencyId query parameter is required" });
      }
      const artistCompetencies = await storage.getCompetencyArtists(competencyId as string);
      res.json(artistCompetencies);
    } catch (error: any) {
      console.error("Error fetching artist competencies:", error);
      res.status(500).json({ error: "Failed to fetch artist competencies" });
    }
  });

  app.post("/api/artist-competencies", canEditLineupsCompetencies, async (req, res) => {
    try {
      const competency = await storage.createArtistCompetency({ ...req.body, grantedBy: req.user?.id });
      res.status(201).json(competency);
    } catch (error: any) {
      console.error("Error creating artist competency:", error);
      res.status(500).json({ error: "Failed to create artist competency" });
    }
  });

  app.patch("/api/artist-competencies/:id", canEditLineupsCompetencies, async (req, res) => {
    try {
      const competency = await storage.updateArtistCompetency(req.params.id, req.body);
      if (!competency) {
        return res.status(404).json({ error: "Artist competency not found" });
      }
      res.json(competency);
    } catch (error: any) {
      console.error("Error updating artist competency:", error);
      res.status(500).json({ error: "Failed to update artist competency" });
    }
  });

  app.delete("/api/artist-competencies/:id", canEditLineupsCompetencies, async (req, res) => {
    try {
      await storage.deleteArtistCompetency(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting artist competency:", error);
      res.status(500).json({ error: "Failed to delete artist competency" });
    }
  });

  // Audit Trail
  app.get("/api/audit/:entityType/:entityId", requireRole('admin'), async (req, res) => {
    try {
      const trail = await storage.getAuditTrail(req.params.entityType, req.params.entityId);
      res.json(trail);
    } catch (error: any) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  });

  const httpServer = createServer(app);
  
  setupWebSocket(httpServer);

  return httpServer;
}
