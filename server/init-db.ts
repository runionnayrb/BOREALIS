import { db } from "./db";
import { 
  users, 
  migrations, 
  technicians, 
  artisticStaff, 
  technicianDepartments, 
  artisticStaffDepartments,
  departments 
} from "@shared/schema";
import { eq, inArray, and, sql as sqlOp } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Migration function type
 */
type MigrationFunction = {
  name: string;
  run: () => Promise<void>;
};

/**
 * Migration: Move technicians from artistic-type departments to artistic_staff table (v2)
 * This is v2 because the original migration had a bug and was already marked complete
 */
const migrateArtisticTechniciansV2: MigrationFunction = {
  name: 'migrate_artistic_technicians_v2',
  run: async () => {
    console.log('🔄 Running migration: migrate_artistic_technicians_v2');
    
    try {
      // Use a transaction for atomicity
      await db.transaction(async (tx) => {
        // Step 1: Get all departments with type='artistic'
        const artisticDepts = await tx.query.departments.findMany({
          where: eq(departments.type, 'artistic'),
        });
        
        if (artisticDepts.length === 0) {
          console.log('  ℹ️  No artistic departments found, skipping migration');
          return;
        }
        
        const artisticDeptIds = artisticDepts.map(d => d.id);
        console.log(`  📋 Found ${artisticDepts.length} artistic departments`);
        
        // Step 2: Get all technician-department assignments for artistic departments
        const artisticTechAssignments = await tx.query.technicianDepartments.findMany({
          where: inArray(technicianDepartments.departmentId, artisticDeptIds),
        });
        
        if (artisticTechAssignments.length === 0) {
          console.log('  ℹ️  No technicians assigned to artistic departments, skipping migration');
          return;
        }
        
        // Get unique technician IDs (use Array.from to avoid downlevel iteration issues)
        const technicianIds = Array.from(new Set(artisticTechAssignments.map(a => a.technicianId)));
        console.log(`  👥 Found ${technicianIds.length} technicians in artistic departments`);
        
        // Step 3: Get ALL department assignments for these technicians to determine migration strategy
        const allTechDeptAssignments = await tx.query.technicianDepartments.findMany({
          where: inArray(technicianDepartments.technicianId, technicianIds),
        });
        
        // Group by technician to check their department types
        const techDeptMap = new Map<string, { artistic: string[], technical: string[] }>();
        const artisticDeptIdSet = new Set(artisticDeptIds);
        
        allTechDeptAssignments.forEach(assignment => {
          if (!techDeptMap.has(assignment.technicianId)) {
            techDeptMap.set(assignment.technicianId, { artistic: [], technical: [] });
          }
          const map = techDeptMap.get(assignment.technicianId)!;
          if (artisticDeptIdSet.has(assignment.departmentId)) {
            map.artistic.push(assignment.departmentId);
          } else {
            map.technical.push(assignment.departmentId);
          }
        });
        
        // Everyone with at least one artistic department gets copied to artistic_staff
        const techsToMigrate = Array.from(techDeptMap.keys());
        console.log(`  ✅ Will migrate ${techsToMigrate.length} technicians with artistic departments`);
        
        // Step 4: Get full technician records for migration
        const techniciansToMove = await tx.query.technicians.findMany({
          where: inArray(technicians.id, techsToMigrate),
        });
        
        // Step 5: Insert into artistic_staff (preserving all fields including IDs)
        for (const tech of techniciansToMove) {
          await tx.insert(artisticStaff).values({
            id: tech.id, // Preserve UUID to maintain references
            firstName: tech.firstName,
            lastName: tech.lastName,
            preferredName: tech.preferredName,
            role: tech.role,
            photoUrl: tech.photoUrl,
            userId: tech.userId,
            status: tech.status,
            sortOrder: tech.sortOrder,
            archivedAt: tech.archivedAt,
            createdAt: tech.createdAt,
          }).onConflictDoNothing(); // Skip if already exists
        }
        
        console.log(`  ✅ Inserted ${techniciansToMove.length} records into artistic_staff`);
        
        // Step 6: Copy department assignments to artistic_staff_departments
        const assignmentsToMove = artisticTechAssignments.filter(a => 
          techsToMigrate.includes(a.technicianId)
        );
        
        for (const assignment of assignmentsToMove) {
          await tx.insert(artisticStaffDepartments).values({
            artisticStaffId: assignment.technicianId, // Use same ID
            departmentId: assignment.departmentId,
            sortOrder: assignment.sortOrder,
            createdAt: assignment.createdAt,
          }).onConflictDoNothing(); // Skip if already exists
        }
        
        console.log(`  ✅ Copied ${assignmentsToMove.length} artistic department assignments`);
        
        // Step 7: Remove ONLY artistic assignments from technician_departments
        await tx.delete(technicianDepartments)
          .where(
            and(
              inArray(technicianDepartments.technicianId, techsToMigrate),
              inArray(technicianDepartments.departmentId, artisticDeptIds)
            )
          );
        
        console.log(`  ✅ Removed artistic assignments from technician_departments`);
        
        // Step 8: Delete from technicians table ONLY if they have NO technical departments
        const techsOnlyArtistic: string[] = [];
        techDeptMap.forEach((deptInfo, techId) => {
          if (deptInfo.technical.length === 0) {
            techsOnlyArtistic.push(techId);
          } else {
            console.log(`  ℹ️  Keeping ${techId} in technicians (has ${deptInfo.technical.length} technical depts)`);
          }
        });
        
        if (techsOnlyArtistic.length > 0) {
          await tx.delete(technicians)
            .where(inArray(technicians.id, techsOnlyArtistic));
          console.log(`  ✅ Removed ${techsOnlyArtistic.length} people with only artistic departments from technicians`);
        }
        
        console.log(`  🎉 Migration complete! Migrated ${techsToMigrate.length} people with artistic departments`);
      });
    } catch (error) {
      console.error('  ❌ Migration failed:', error);
      throw error; // Re-throw to prevent migration from being marked as complete
    }
  },
};

/**
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('🔄 Checking for pending migrations...');
  
  const allMigrations: MigrationFunction[] = [
    migrateArtisticTechniciansV2,
  ];
  
  try {
    // Ensure migrations table exists
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS migrations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          run_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    } catch (createError) {
      console.error('  ⚠️  Could not create migrations table:', createError);
      // Continue anyway - table might already exist
    }
    
    // Get list of completed migrations
    let completedMigrations: { name: string }[] = [];
    try {
      completedMigrations = await db.query.migrations.findMany();
    } catch (queryError) {
      console.log('  ℹ️  No previous migrations found (first run)');
      completedMigrations = [];
    }
    const completedNames = new Set(completedMigrations.map(m => m.name));
    
    // Find pending migrations
    const pendingMigrations = allMigrations.filter(m => !completedNames.has(m.name));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations up to date');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);
    
    // Run each pending migration
    for (const migration of pendingMigrations) {
      try {
        console.log(`\n🔄 Running: ${migration.name}`);
        await migration.run();
        
        // Mark as complete
        await db.insert(migrations).values({
          name: migration.name,
        });
        
        console.log(`✅ Migration ${migration.name} completed successfully\n`);
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        throw error; // Stop on first failure
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration runner failed:', error);
    // Don't throw - allow server to start even if migrations fail
  }
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
    
    // Run migrations after admin user setup
    await runMigrations();
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    // Don't throw - allow server to start even if initialization fails
  }
}
