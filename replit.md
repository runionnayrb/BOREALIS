# La Perle Training Reports

## Overview
A production-ready full-stack web application designed for theatrical production training management. It enables Stage Managers to create daily training reports with rich text notes, track trainings by various criteria (act, department, artist, location), assign technician leads, and export reports to PDF. The project's vision is to streamline and professionalize the administrative tasks associated with managing theatrical training schedules and reporting.

## User Preferences
- All Stage Managers see the same interface (no user-based filtering).
- I prefer a linear-inspired professional dark mode UI with Inter/JetBrains Mono fonts and cyan accent.
- I expect mobile-first responsive design.
- I prefer robust XSS protection in rich text editors: Two-layer defense with Tiptap escaping and DOMPurify sanitization.
- I want a chronological sorting of training sessions by start time, then end time (earliest to latest).
- I prefer that training notes use RichTextEditor (Tiptap) with full formatting support including bullet/numbered lists.
- I want toast notifications for all user actions (create, update, delete).
- I prefer that all queries use TanStack Query for data fetching with automatic caching and all mutations invalidate relevant query caches for real-time updates.

## System Architecture
The application is a full-stack web application with a clear separation between frontend and backend.

### UI/UX Decisions
- **Design System**: Linear-inspired professional dark mode UI.
- **Typography**: Inter and JetBrains Mono fonts.
- **Accent Color**: Cyan.
- **Responsiveness**: Mobile-first responsive design.
- **Rich Text Editor**: Tiptap for rich text notes with full formatting.
- **Grouped Displays**: Acts, locations, artists, and technicians are displayed grouped by their parent category with count badges. Ungrouped items are shown at the top or with "NO [PARENT]" sections.
- **Hierarchical Dropdowns**: Training modal includes hierarchical dropdowns for Scene/Act selection (scenes with indented acts) and multi-select locations (types with indented locations).

### Technical Implementations
- **Frontend**: React + Vite, Wouter for routing, TanStack Query for data management, shadcn/ui for components.
- **Backend**: Express.js framework.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Passport.js with a local strategy, bcrypt for password hashing, and session-based authentication.
- **Data Management**: TanStack Query for data fetching, caching, and state management.
- **XSS Protection**: Two-layer defense for rich text notes (Tiptap escaping + DOMPurify sanitization).

### Feature Specifications
- **Secure Authentication**: Login/signup with hashed passwords and session management.
- **Profile Management**: Update user details and password.
- **Settings Management**: Full CRUD operations for all entities (scenes, acts, departments, locations, artists, technicians, report template).
- **User Management**: Control active/inactive status of users.
- **Hierarchical Organization**: Consistent parent-child structures for Scenes → Acts, Location Types → Locations, and Artist Groups → Artists.
- **Reports & Trainings**:
    - CRUD for reports and trainings with audit trails.
    - **Multi-location support** for trainings.
    - Per-training artist and department customization with auto-population from scene/act assignments.
- **Report Template**: Global header/footer template with image upload.
- **Audit Trail**: All reports and trainings track `createdBy`, `updatedBy`, and timestamps.
- **One Report Per Day**: Simplified model where a single report encompasses all trainings for a given day.

### System Design Choices
- **Database Schema**: Comprehensive PostgreSQL schema covering users, scenes, acts, departments, locations, artists, technicians, reports, and trainings, including junction tables for many-to-many relationships.
- **API Endpoints**: RESTful API for authentication, user management, profile updates, settings CRUD, and reports/trainings management.
- **Session Management**: Session-based authentication with PostgreSQL session store.

## External Dependencies
- **Database**: PostgreSQL
- **Frontend Libraries**: React, Vite, Wouter, TanStack Query, shadcn/ui, Tiptap.
- **Backend Libraries**: Express.js, Drizzle ORM, Passport.js, bcrypt.
- **Sanitization**: DOMPurify for XSS protection.