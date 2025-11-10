import { db } from "./db";
import { 
  users, 
  migrations, 
  staffMembers,
  technicians,
  staffDepartments,
  technicianDepartments,
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
 * Migration: Consolidate artistic_staff into technicians, then rename to staff_members
 * Idempotent: Safe to run on fresh databases or already-migrated databases
 */
const consolidateAndRenameStaff: MigrationFunction = {
  name: 'consolidate_and_rename_staff',
  run: async () => {
    console.log('🔄 Running migration: consolidate_and_rename_staff');
    
    try {
      // Check if migration is already complete (both tables exist with new names)
      const checkStaffMembers = await db.execute(sql`
        SELECT to_regclass('public.staff_members') AS exists
      `);
      const staffMembersExists = checkStaffMembers.rows[0]?.exists !== null;
      
      const checkStaffDepartments = await db.execute(sql`
        SELECT to_regclass('public.staff_departments') AS exists
      `);
      const staffDepartmentsExists = checkStaffDepartments.rows[0]?.exists !== null;
      
      // If both new tables exist, migration is complete
      if (staffMembersExists && staffDepartmentsExists) {
        console.log('  ℹ️  Migration already complete (staff_members and staff_departments exist), skipping');
        return;
      }
      
      // Handle partial migration (staff_members exists but not staff_departments)
      if (staffMembersExists && !staffDepartmentsExists) {
        console.log('  ⚠️  Partial migration detected, completing staff_departments rename');
        const checkTechnicianDepartments = await db.execute(sql`
          SELECT to_regclass('public.technician_departments') AS exists
        `);
        const technicianDepartmentsExists = checkTechnicianDepartments.rows[0]?.exists !== null;
        
        if (technicianDepartmentsExists) {
          await db.execute(sql`ALTER TABLE technician_departments RENAME TO staff_departments`);
          console.log('  ✅ Renamed technician_departments → staff_departments');
          console.log('  🎉 Migration complete!');
          return;
        } else {
          throw new Error('Inconsistent state: staff_members exists but neither technician_departments nor staff_departments found');
        }
      }
      
      // Handle partial migration (staff_departments exists but not staff_members)
      if (!staffMembersExists && staffDepartmentsExists) {
        console.log('  ⚠️  Partial migration detected, completing staff_members rename');
        const checkTechnicians = await db.execute(sql`
          SELECT to_regclass('public.technicians') AS exists
        `);
        const techniciansExists = checkTechnicians.rows[0]?.exists !== null;
        
        if (techniciansExists) {
          await db.execute(sql`ALTER TABLE technicians RENAME TO staff_members`);
          console.log('  ✅ Renamed technicians → staff_members');
          console.log('  🎉 Migration complete!');
          return;
        } else {
          throw new Error('Inconsistent state: staff_departments exists but neither technicians nor staff_members found');
        }
      }
      
      // Check if legacy tables exist
      const checkArtisticStaff = await db.execute(sql`
        SELECT to_regclass('public.artistic_staff') AS exists
      `);
      const artisticStaffExists = checkArtisticStaff.rows[0]?.exists !== null;
      
      const checkTechnicians = await db.execute(sql`
        SELECT to_regclass('public.technicians') AS exists
      `);
      const techniciansExists = checkTechnicians.rows[0]?.exists !== null;
      
      // If neither table exists, this is a fresh database - skip migration
      if (!artisticStaffExists && !techniciansExists && !staffMembersExists) {
        console.log('  ℹ️  Fresh database detected (no legacy tables), skipping migration');
        return;
      }
      
      // If only technicians exists (no artistic_staff), just rename
      if (!artisticStaffExists && techniciansExists) {
        console.log('  ℹ️  No artistic_staff table found, proceeding with rename only');
        
        await db.execute(sql`ALTER TABLE technicians RENAME TO staff_members`);
        console.log('  ✅ Renamed technicians → staff_members');
        
        await db.execute(sql`ALTER TABLE technician_departments RENAME TO staff_departments`);
        console.log('  ✅ Renamed technician_departments → staff_departments');
        
        console.log('  🎉 Migration complete!');
        return;
      }
      
      // Full migration: consolidate artistic_staff → technicians, then rename
      console.log('  📋 Legacy tables detected, performing full consolidation');
      
      // Step 1: Copy all artistic_staff to technicians (if it exists)
      if (artisticStaffExists && techniciansExists) {
        await db.execute(sql`
          INSERT INTO technicians (id, first_name, last_name, preferred_name, role, photo_url, user_id, status, sort_order, archived_at, created_at)
          SELECT id, first_name, last_name, preferred_name, role, photo_url, user_id, status, sort_order, archived_at, created_at
          FROM artistic_staff
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('  ✅ Copied artistic_staff to technicians');
        
        // Step 2: Copy all artistic_staff_departments to technician_departments
        await db.execute(sql`
          INSERT INTO technician_departments (id, technician_id, department_id, sort_order, created_at)
          SELECT id, artistic_staff_id, department_id, sort_order, created_at
          FROM artistic_staff_departments
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('  ✅ Copied artistic_staff_departments to technician_departments');
        
        // Step 3: Drop artistic_staff tables
        await db.execute(sql`DROP TABLE IF EXISTS artistic_staff_departments CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS artistic_staff CASCADE`);
        console.log('  ✅ Dropped artistic_staff tables');
      }
      
      // Step 4: Rename technicians → staff_members
      await db.execute(sql`ALTER TABLE technicians RENAME TO staff_members`);
      console.log('  ✅ Renamed technicians → staff_members');
      
      // Step 5: Rename technician_departments → staff_departments
      await db.execute(sql`ALTER TABLE technician_departments RENAME TO staff_departments`);
      console.log('  ✅ Renamed technician_departments → staff_departments');
      
      console.log('  🎉 Migration complete!');
    } catch (error) {
      console.error('  ❌ Migration failed:', error);
      throw error;
    }
  },
};

/**
 * Migration: Create role_page_access table
 * Idempotent: Safe to run on fresh databases or already-migrated databases
 */
const createRolePageAccessTable: MigrationFunction = {
  name: 'create_role_page_access_table',
  run: async () => {
    console.log('🔄 Running migration: create_role_page_access_table');
    
    try {
      // Check if table already exists
      const checkTable = await db.execute(sql`
        SELECT to_regclass('public.role_page_access') AS exists
      `);
      const tableExists = checkTable.rows[0]?.exists !== null;
      
      if (tableExists) {
        console.log('  ℹ️  Table role_page_access already exists, skipping');
        return;
      }
      
      // Create the table
      await db.execute(sql`
        CREATE TABLE role_page_access (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          role TEXT NOT NULL,
          page TEXT NOT NULL,
          can_access INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(role, page)
        )
      `);
      console.log('  ✅ Created role_page_access table');
      console.log('  🎉 Migration complete!');
    } catch (error) {
      console.error('  ❌ Migration failed:', error);
      throw error;
    }
  },
};

/**
 * Migration: Add performance indexes for frequently queried columns
 * Idempotent: Safe to run on fresh databases or already-migrated databases
 */
const addPerformanceIndexes: MigrationFunction = {
  name: 'add_performance_indexes',
  run: async () => {
    console.log('🔄 Running migration: add_performance_indexes');
    
    try {
      // Index for reports.date - frequently queried for daily reports
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date)
      `);
      console.log('  ✅ Created index: idx_reports_date');
      
      // Composite index for attendance lookups by date and artistId
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_attendance_date_artist ON attendance_records(date, artist_id)
      `);
      console.log('  ✅ Created index: idx_attendance_date_artist');
      
      // Composite index for user permissions lookups
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_user_permissions_user_perm ON user_permissions(user_id, permission)
      `);
      console.log('  ✅ Created index: idx_user_permissions_user_perm');
      
      // Partial index for active artists (archived_at IS NULL is most common query)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_artists_active ON artists(sort_order) WHERE archived_at IS NULL
      `);
      console.log('  ✅ Created index: idx_artists_active');
      
      // Partial index for active technicians
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(sort_order) WHERE archived_at IS NULL
      `);
      console.log('  ✅ Created index: idx_technicians_active');
      
      // Indexes for frequently filtered join tables
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_act_artists_act ON act_artists(act_id)
      `);
      console.log('  ✅ Created index: idx_act_artists_act');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_scene_artists_scene ON scene_artists(scene_id)
      `);
      console.log('  ✅ Created index: idx_scene_artists_scene');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_training_artists_training ON training_artists(training_id)
      `);
      console.log('  ✅ Created index: idx_training_artists_training');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_technician_departments_tech ON technician_departments(technician_id)
      `);
      console.log('  ✅ Created index: idx_technician_departments_tech');
      
      // Index for trainings by date
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_trainings_date ON trainings(start_time)
      `);
      console.log('  ✅ Created index: idx_trainings_date');
      
      console.log('  🎉 Migration complete!');
    } catch (error) {
      console.error('  ❌ Migration failed:', error);
      throw error;
    }
  },
};

/**
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('🔄 Checking for pending migrations...');
  
  const allMigrations: MigrationFunction[] = [
    consolidateAndRenameStaff,
    createRolePageAccessTable,
    addPerformanceIndexes,
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
