# La Perle Training Reports

## Overview
A production-ready full-stack web application for theatrical production training management. Stage Managers create daily training reports with rich text notes, track trainings by act/department/artist/location, assign technician leads, and export to PDF.

## Current State (Updated Oct 10, 2025)
- ✅ PostgreSQL database with complete schema (users, scenes, acts, departments, act_departments, location_types, locations, artists, technicians, reports, trainings, assignments)
- ✅ Secure authentication system (login/signup with hashed passwords, session-based)
- ✅ Profile management (update name, position, pronouns, email, password)
- ✅ Settings management with full CRUD for all entities (scenes, acts, departments, location types, locations, artist groups, artists, technicians, report template)
- ✅ User management with active/inactive status control
- ✅ **Hierarchical organization pattern** applied consistently across all entity groups:
  - **Scenes → Acts**: Scenes managed within Acts tab (button in header). **Scene is required when creating/editing acts**
  - **Location Types → Locations**: Location Types managed within Locations tab (button in header)
  - **Artist Groups → Artists**: Artist Groups managed within Artists tab (button in header)
- ✅ **Grouped display**: Acts, locations, artists, and technicians are displayed grouped by their parent category with count badges
  - Acts grouped by scene, locations by type, artists by group, **technicians by department (alphabetical order)**
  - Ungrouped items shown at top without group header (technicians) or with "NO [PARENT]" sections (acts, locations, artists)
- ✅ **Artist role field**: Artists include role information (character/position) displayed below artist name
- ✅ **Technician name field**: Technicians include technicianName (stage/professional name) in addition to firstName/lastName
- ✅ **Act department assignments**: Acts can have required departments assigned; these auto-populate when creating trainings
- ✅ Reports CRUD with audit trail (createdBy, updatedBy, timestamps)
- ✅ Trainings CRUD with location assignment and audit trail
- ✅ Department assignments per training (auto-populated from act's required departments)
- ✅ Rich text editor for report notes
- ✅ SM on Duty dropdown showing only active stage managers
- ✅ Linear-inspired professional dark mode UI with Inter/JetBrains Mono fonts and cyan accent
- ✅ Mobile-first responsive design
- ✅ Image upload for report template (left/right images)

## Design Decisions
- **One report per day** containing all trainings (simplified model)
- **Location assigned to training** (training happens at a location)
- **Hierarchical organization pattern**: Both Acts and Locations use a parent→child structure
  - **Scenes → Acts**: Acts are optionally grouped by scenes for better organization
  - **Location Types → Locations**: Locations are optionally grouped by types (onstage, rehearsal room, etc.)
  - **Artist Groups → Artists**: Artists are optionally grouped by artist groups (ensemble, dancers, etc.)
- **Grouped display in Settings**: Acts, locations, and artists are displayed grouped by their parent category with count badges and "NO [PARENT]" sections for ungrouped items
- **All Stage Managers see same interface** (no user-based filtering)
- **Global report header/footer template** in Settings (applies to all reports)
- **Audit trail enabled**: All reports and trainings track who created/updated them with timestamps

## Architecture
- **Frontend**: React + Vite, Wouter routing, TanStack Query, shadcn/ui components, Tiptap rich text editor
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with local strategy, bcrypt password hashing, session-based

## Database Schema
### Core Tables
- `users` - Stage Managers with auth and profile info (id, email, password, name, position, pronouns, active)
- `scenes` - Performance scenes (id, name, sortOrder) - parent category for acts
- `acts` - Performance acts (id, name, sceneId, sortOrder) - **sceneId is REQUIRED foreign key to scenes**
- `departments` - Technical departments (id, name, sortOrder)
- `act_departments` - **Junction table** for act-department many-to-many relationship (id, actId, departmentId, createdAt)
- `location_types` - Location categories (id, name, sortOrder) - e.g., onstage, rehearsal room, dance studio, offstage, meetings
- `locations` - Training locations (id, name, locationTypeId, sortOrder) - locationTypeId is optional foreign key to location_types
- `artist_groups` - Artist groups/ensembles (id, name, sortOrder)
- `artists` - Individual performers (id, firstName, lastName, stageName, role, artistGroupId)
- `technicians` - Technical leads (id, firstName, lastName, technicianName, role, departmentId)
- `report_template` - Global header/footer for reports (id, title, leftImageUrl, rightImageUrl, updatedBy, updatedAt)

### Reports & Trainings
- `reports` - Daily reports (id, date, stageManagerOnDuty, notes, createdBy, updatedBy, createdAt, updatedAt)
- `trainings` - Training sessions (id, reportId, actId, locationId, startTime, endTime, durationMinutes, notes, createdBy, updatedBy, createdAt, updatedAt)
- `department_assignments` - Per-training department leads (id, trainingId, departmentId, leadTechnicianId, notes) - **auto-created from act's required departments**

## API Endpoints
### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login user
- POST `/api/logout` - Logout user
- GET `/api/user` - Get current user

### User Management
- GET `/api/users` - Get all users (sanitized, no passwords)
- PATCH `/api/users/:id` - Update user active status

### Profile
- PATCH `/api/user` - Update profile
- POST `/api/user/change-password` - Change password

### Settings (All with CRUD)
- `/api/scenes` - Scenes management (categories for organizing acts)
- `/api/acts` - Acts management (with required sceneId)
- `/api/acts/:id/departments` - Get/set act's required departments (GET returns ActDepartment[], POST body: { departmentIds: string[] })
- `/api/departments` - Departments management
- `/api/location-types` - Location types management (categories for organizing locations)
- `/api/locations` - Locations management (with optional locationTypeId)
- `/api/artist-groups` - Artist groups management
- `/api/artists` - Artists management
- `/api/technicians` - Technicians management
- `/api/report-template` - Report template management

### Reports & Trainings
- GET/POST `/api/reports` - List/create reports
- GET/PATCH/DELETE `/api/reports/:id` - Read/update/delete report
- GET `/api/reports/date/:date` - Get report by date
- GET `/api/reports/:reportId/trainings` - Get trainings for report
- GET/POST `/api/trainings` - List/create trainings
- GET/PATCH/DELETE `/api/trainings/:id` - Read/update/delete training
- GET/POST `/api/trainings/:trainingId/assignments` - Department assignments
- PATCH/DELETE `/api/assignments/:id` - Update/delete assignment

## Pending Features
- **Password Reset Flow**: Requires email service setup (Resend, SendGrid, or other) - TO BE IMPLEMENTED LATER
- **Search**: Comprehensive search across dates, acts, artists, locations, notes, times, technicians
- **PDF Export**: Generate PDF reports from training data

## Security Notes
- All passwords are hashed with bcrypt
- User responses sanitized (no password hashes or sensitive data exposed to client)
- Profile updates validate email uniqueness
- Password changes require current password verification
- Session-based authentication with PostgreSQL session store
- All API endpoints require authentication (except register/login)

## Future Integration
- Scheduling app integration for importing trainings (details pending)

## Key Files
- `shared/schema.ts` - Database schema and types (includes SafeUser type without password/tokens)
- `server/auth.ts` - Authentication setup with sanitization
- `server/storage.ts` - Database interface and operations (includes getAllUsers)
- `server/routes.ts` - API endpoints (includes user management routes)
- `server/db.ts` - Database connection
- `client/src/hooks/use-auth.tsx` - Auth context and hooks
- `client/src/pages/Profile.tsx` - Profile management
- `client/src/pages/Settings.tsx` - Settings CRUD interface with Users management tab
- `client/src/pages/ReportEditor.tsx` - Report and trainings editor with SM dropdown
- `client/src/pages/AuthPage.tsx` - Login/signup
- `client/src/components/TrainingCard.tsx` - Training display with audit info
- `client/src/components/RichTextEditor.tsx` - Tiptap rich text editor
- `design_guidelines.md` - UI/UX design system

## Development Notes
- Run `npm run db:push` to sync schema changes to database
- Use `npm run db:push --force` if schema push shows data-loss warnings
- All queries use TanStack Query for data fetching with automatic caching
- All mutations invalidate relevant query caches for real-time updates
- Toast notifications for all user actions (create, update, delete)
