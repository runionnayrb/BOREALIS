# La Perle Training Reports

## Overview
A production-ready full-stack web application for theatrical production training management. Stage Managers create daily training reports with rich text notes, track trainings by act/department/artist/location, assign technician leads, and export to PDF.

## Current State
- PostgreSQL database with secure authentication system
- User authentication (login/signup) with hashed passwords
- Profile management (update name, position, pronouns, email, password)
- Linear-inspired professional dark mode UI with Inter/JetBrains Mono fonts and cyan accent
- Mobile-first responsive design

## Design Decisions
- **One report per day** containing all trainings (simplified model)
- **Location assigned to training** (training happens at a location)
- **All Stage Managers see same interface** (no user-based filtering)
- **Global report header/footer template** in Settings (applies to all reports)

## Architecture
- **Frontend**: React + Vite, Wouter routing, TanStack Query, shadcn/ui components
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with local strategy, bcrypt password hashing, session-based

## Pending Features
- **Password Reset Flow**: Requires email service setup (Resend, SendGrid, or other) - TO BE IMPLEMENTED LATER
- **Audit Trail**: Track who created/updated reports and trainings
- **Settings Management**: Acts, departments, locations, artists, technicians CRUD
- **Reports & Trainings**: Full CRUD with database persistence
- **Search**: Comprehensive search across dates, acts, artists, locations, notes, times, technicians
- **PDF Export**: Generate PDF reports from training data

## Security Notes
- All passwords are hashed with bcrypt
- User responses sanitized (no password hashes or sensitive data exposed to client)
- Profile updates validate email uniqueness
- Password changes require current password verification
- Session-based authentication with PostgreSQL session store

## Future Integration
- Scheduling app integration for importing trainings (details pending)

## Key Files
- `shared/schema.ts` - Database schema and types
- `server/auth.ts` - Authentication setup with sanitization
- `server/storage.ts` - Database interface and operations
- `server/routes.ts` - API endpoints
- `client/src/hooks/use-auth.tsx` - Auth context and hooks
- `client/src/pages/Profile.tsx` - Profile management
- `client/src/pages/AuthPage.tsx` - Login/signup
- `design_guidelines.md` - UI/UX design system
