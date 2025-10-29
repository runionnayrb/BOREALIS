# La Perle - Borealis

## Overview
La Perle - Borealis is a production-ready, full-stack web application designed to streamline theatrical production management. It empowers Stage Managers to efficiently handle daily training reports, show lineup management, comprehensive scheduling, and real-time attendance tracking. The application supports rich text notes, tracking by various criteria (act, department, artist, location), technician lead assignments, and PDF report exports. Key features include visual stage position layouts for lineups, detailed schedule views, and an Attendance System with geofencing and PIN-based artist sign-in/sign-out. The overarching goal is to professionalize and simplify administrative tasks for theatrical productions.

## User Preferences
- All Stage Managers see the same interface (no user-based filtering).
- I prefer a linear-inspired professional dark mode UI with Inter/JetBrains Mono fonts and cyan accent.
- I expect mobile-first responsive design.
- I prefer robust XSS protection in rich text editors: Two-layer defense with Tiptap escaping and DOMPurify sanitization.
- I want a chronological sorting of training sessions by start time, then end time (earliest to latest).
- I prefer that training notes use RichTextEditor (Tiptap) with full formatting support including bullet/numbered lists.
- I want toast notifications for all user actions (create, update, delete).
- I prefer that all queries use TanStack Query for data fetching with automatic caching and all mutations invalidate relevant query caches for real-time updates.
- I want artist order to be manually controllable and not change when artists are updated.
- I prefer professional date formatting: Report dates display as "Wednesday, October 25, 2025" instead of raw YYYY-MM-DD format.

## System Architecture

### UI/UX Decisions
- **Design System**: Linear-inspired professional dark mode with Inter/JetBrains Mono fonts and cyan accent.
- **Responsiveness**: Mobile-first responsive design with full mobile support for all components.
- **Rich Text Editor**: Tiptap for rich text notes.
- **Navigation**: Role-based sidebar navigation with hierarchical menus.
- **Component Design**: Grouped displays for entities, hierarchical dropdowns, responsive card layouts, and mobile-optimized dialogs.

### Technical Implementations
- **Frontend**: React + Vite, Wouter for routing, TanStack Query for data management, shadcn/ui for components.
- **Backend**: Express.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Passport.js (local strategy, scrypt hashing, session-based).
- **Security**: Two-layer XSS protection (Tiptap + DOMPurify), role-based access control.
- **Real-time**: WebSocket server for live updates (attendance, tick sheets).
- **Geofencing**: Server-side validation using Haversine formula for attendance.
- **Data Handling**: TanStack Query for caching and state management, automatic department assignment creation, timezone-safe date parsing.
- **Email**: Microsoft Graph API integration for sending emails.

### Feature Specifications
- **Authentication & User Management**: Secure login/signup, profile management, CRUD for users and user groups (admin/SM only), password reset, role-based access, artist account linking.
- **Settings Management**: Full CRUD for all entities (scenes, acts, departments, locations, artists, technicians, report template) including drag-and-drop artist reordering.
- **Reports & Trainings**: CRUD for reports and trainings, multi-location support, per-training artist/department customization, lead technician assignment, custom training names, rich text sections (Goal, Training Notes, Follow-Up), one report per day enforcement, audit trails.
- **PDF Export**: Customizable header/footer, specific filename formatting.
- **Email Distribution**: Outlook integration, configurable email templates.
- **Lineup Management**: Card-based view, visual drag-and-drop lineup builder with stage positions and artist assignments, EM team management, searchable artist roster, PDF export.
- **Schedule Management**: Timeline-based full schedule view (15-minute increments), per-artist weekly view, activity types with color-coding, PDF export.
- **Attendance System**: Public sign-in page with photo grid and PIN, geofencing, real-time SM dashboard with manual sign-out, Tick Sheets with optimistic UI and WebSocket sync, artist PIN management.

### System Design Choices
- **Database Schema**: Comprehensive PostgreSQL schema for all application entities.
- **Data Models**: Reusable lineup templates, show-specific lineups, and structured schedule containers.
- **API**: RESTful API for all functionalities.
- **Session Management**: Session-based authentication using PostgreSQL.
- **WebSocket**: Dedicated server for real-time communication.

## External Dependencies
- **Database**: PostgreSQL
- **Frontend Libraries**: React, Vite, Wouter, TanStack Query, shadcn/ui, Tiptap.
- **Backend Libraries**: Express.js, Drizzle ORM, Passport.js, scrypt.
- **Sanitization**: DOMPurify.
- **Email Integration**: Replit Outlook connector, Microsoft Graph Client.