import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Format name to title case (e.g., "bryan runion" -> "Bryan Runion")
export function toTitleCase(str: string | null | undefined): string | undefined {
  if (!str) return undefined;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Safe serializer to remove sensitive fields before sending to client
export function sanitizeUser(user: SelectUser) {
  const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
  return safeUser;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: 'lax',
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Normalize email to lowercase for case-insensitive login
        const normalizedEmail = email.toLowerCase();
        console.log('[Auth] Attempting login for email:', normalizedEmail);
        const user = await storage.getUserByEmail(normalizedEmail);
        console.log('[Auth] User found:', user ? `${user.email} (${user.id})` : 'NO USER FOUND');
        if (!user || !(await comparePasswords(password, user.password))) {
          console.log('[Auth] Login failed: Invalid credentials');
          return done(null, false);
        } else {
          console.log('[Auth] Login successful');
          return done(null, user);
        }
      } catch (error) {
        console.error('[Auth] Error during login:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    // Define registration schema with required fields
    const registrationSchema = insertUserSchema.pick({
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      userGroupId: true,
    }).extend({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      preferredName: z.string().min(1, "Preferred name is required"),
      userGroupId: z.string().min(1, "Department is required"),
    });

    // Validate and sanitize input
    const validation = registrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    // Get user group to determine position and role
    const userGroup = await storage.getUserGroup(validation.data.userGroupId);
    if (!userGroup) {
      return res.status(400).json({ error: "Invalid department selected" });
    }

    // Auto-assign position based on user group
    const position = userGroup.name;
    
    // Auto-assign role based on user group name (case-insensitive)
    let role: string;
    const groupNameLower = userGroup.name.toLowerCase();
    if (groupNameLower === 'artist') {
      role = 'artist';
    } else if (groupNameLower === 'stage management') {
      role = 'stage_management';
    } else if (groupNameLower === 'admin') {
      role = 'admin';
    } else if (groupNameLower === 'coaching') {
      role = 'coaching';
    } else if (groupNameLower === 'performance wellness') {
      role = 'performance_wellness';
    } else {
      role = 'read_only'; // Default to read_only for unknown groups
    }

    // Normalize formatting: lowercase email, title case for names
    const formattedData = {
      email: validation.data.email.toLowerCase(),
      firstName: toTitleCase(validation.data.firstName),
      lastName: toTitleCase(validation.data.lastName),
      preferredName: validation.data.preferredName, // Keep preferred name as entered
      name: `${toTitleCase(validation.data.firstName)} ${toTitleCase(validation.data.lastName)}`, // Construct full name
      position: toTitleCase(position),
      role: role,
      userGroupId: validation.data.userGroupId,
      password: await hashPassword(validation.data.password),
    };

    const existingEmail = await storage.getUserByEmail(formattedData.email);
    if (existingEmail) {
      return res.status(400).send("Email already exists");
    }

    const user = await storage.createUser(formattedData);

    req.login(user, (err) => {
      if (err) return next(err);
      // Ensure session is saved before sending response
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.status(201).json(sanitizeUser(user));
      });
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Ensure session is saved before sending response
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to save session" });
      }
      res.status(200).json(sanitizeUser(req.user!));
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user!));
  });
}
