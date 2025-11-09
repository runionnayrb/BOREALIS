import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Initialize database with required admin user
 * This ensures the admin account exists in both development and production
 */
export async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    const adminEmail = "bryan.runion@laperle.com";
    
    // Check if admin user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (!existingUser) {
      console.log(`🔧 Creating admin user: ${adminEmail}`);
      
      // Create admin user with a default password
      // User should change this on first login
      const hashedPassword = await hashPassword("ChangeMe123!");
      
      await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Bryan",
        lastName: "Runion",
        preferredName: "Bryan",
        name: "Bryan Runion",
        position: "Stage Manager",
        role: "admin",
        active: 1,
        outlookConnected: 1,
        mustChangePassword: 1, // Force password change on first login
      });
      
      console.log(`✅ Admin user created successfully`);
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Temporary Password: ChangeMe123!`);
      console.log(`⚠️  You will be required to change this password on first login`);
    } else {
      // Ensure existing user has admin role
      if (existingUser.role !== 'admin') {
        console.log(`🔧 Updating ${adminEmail} to admin role`);
        await db.update(users)
          .set({ role: 'admin' })
          .where(eq(users.email, adminEmail));
        console.log(`✅ User updated to admin role`);
      } else {
        console.log(`✅ Admin user ${adminEmail} already exists with admin role`);
      }
    }
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    // Don't throw - allow server to start even if initialization fails
  }
}
