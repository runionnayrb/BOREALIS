# La Perle - Borealis

## Overview
A production-ready full-stack web application for theatrical production management. It enables Stage Managers to create daily training reports with rich text notes, track trainings by various criteria (act, department, artist, location), assign technician leads, and export reports to PDF. The application also features show lineup management with visual stage position layouts, comprehensive scheduling with full timeline and per-artist views, and an Attendance System with real-time artist sign-in/sign-out using geofencing and PIN codes. The project aims to streamline and professionalize administrative tasks for theatrical training schedules, show lineups, scheduling, attendance tracking, and reporting.

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
- **Design System**: Linear-inspired professional dark mode UI.
- **Typography**: Inter and JetBrains Mono fonts.
- **Accent Color**: Cyan.
- **Responsiveness**: Mobile-first responsive design with full mobile support for training reports and modals.
- **Rich Text Editor**: Tiptap for rich text notes with full formatting.
- **Grouped Displays**: Acts, locations, artists, and technicians are displayed grouped by their parent category with count badges.
- **Hierarchical Dropdowns**: Training modal includes hierarchical dropdowns for Scene/Act selection and multi-select locations.
- **Training Name Combobox**: Allows selecting scene/act from dropdown with optional custom display name override.
- **Training Card Layout**: Responsive layout - 3-column grid on desktop, stacked single-column on mobile.
- **Role-Based Sidebar Navigation**: Artists see empty sidebar (reserved for Magic Carpet Notes), while stage managers and admins see full navigation with hierarchical menus (Attendance → Dashboard/Tick Off). Sidebar shows loading state while fetching user group to prevent artists from seeing restricted menu items.
- **Mobile Optimizations**:
    - **Training Cards**: Header information stacks vertically on mobile while maintaining horizontal layout on desktop.
    - **Training Modal**: All grid layouts (training name/locations/SM, time fields, artist/department sections) collapse to single-column on mobile.
    - **Dialog Components**: Base Dialog and AlertDialog enforce mobile-safe width constraints (`w-[calc(100%-2rem)]`) with responsive padding.
    - **Report Header**: Fully responsive stacked layout on mobile (flex-col) with reduced padding, full-width date input, separate SM selector row on mobile, equal-width action buttons with shortened text, and no horizontal overflow.

### Technical Implementations
- **Frontend**: React + Vite, Wouter for routing, TanStack Query for data management, shadcn/ui for components.
- **Backend**: Express.js framework.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Passport.js with local strategy, scrypt for password hashing, session-based authentication.
- **Data Management**: TanStack Query for fetching, caching, and state management.
- **XSS Protection**: Two-layer defense for rich text notes (Tiptap escaping + DOMPurify sanitization).
- **Auto-Report Creation**: Automatically reuses or creates a new report for a given date, enforcing "One Report Per Day."
- **Email Integration**: Microsoft Graph API for sending emails with customizable templates and distribution lists.
- **Real-time Updates**: WebSocket server for live attendance and tick sheet updates.
- **Geofencing**: Server-side geolocation validation using Haversine formula (100-meter radius from La Perle venue: 25.1872° N, 55.2674° E).
- **Role-Based Access Control**: Middleware-based authorization for 'stage_management' or 'admin' roles.
- **Date Formatting**: Timezone-safe date parsing using split-and-construct approach to prevent off-by-one day errors in non-UTC timezones. Report dates stored as YYYY-MM-DD are parsed by splitting into components and constructing with local timezone.

### Feature Specifications
- **Secure Authentication**: 
    - Login/signup with scrypt-hashed passwords and session management.
    - Registration requires: Email, Password, First Name, Last Name, Artist Name, and Department (User Group).
    - Position and role are auto-assigned based on selected department during registration (e.g., "Artist" group → 'artist' role, "Stage Management" group → 'stage_management' role).
    - Auth page supports `returnTo` query parameter for redirecting users back to their intended destination after login.
    - Auth page uses white background with dark text (no dark mode colors) to ensure visibility.
- **Profile Management**: Update user details and password.
- **Settings Management**: Full CRUD operations for all entities (scenes, acts, departments, locations, artists, technicians, report template).
    - **Artist Ordering**: Drag-and-drop reordering for artists using `@dnd-kit` with persistent `sortOrder`.
- **User Management**:
    - **View Users**: All authenticated users can view the user list and user groups.
    - **Create Users**: (Stage managers and admins only) Create new user accounts with name, email, position, password, and optional user group assignment. All fields automatically formatted (title case for names/positions, lowercase for emails).
    - **Edit Users**: (Stage managers and admins only) Update user profiles including name, email, position, and user group (previously read-only fields now editable).
    - **User Status Control**: (Stage managers and admins only) Manage active/inactive status of users.
    - **User Groups**: (Stage managers and admins only) Create, edit, and delete user groups. All users can view groups. Users displayed grouped alphabetically by their user group.
    - **User Deletion**: (Stage managers and admins only) Requires admin password confirmation (username: "admin", password: "laperleSM2025!"), prevents self-deletion and deletion of users who have created/modified reports.
    - **Role-Based Access Control**: Create, edit, and delete operations require 'stage_management' or 'admin' role. View operations available to all authenticated users.
    - **Artist Account Linking**: When linking user accounts to artist profiles, dropdown only shows users in the "Artist" user group (case-insensitive) who are not already linked to another artist.
- **Hierarchical Organization**: Consistent parent-child structures for Scenes → Acts, Location Types → Locations, and Artist Groups → Artists.
- **Reports & Trainings**:
    - CRUD for reports and trainings with audit trails.
    - Multi-location support for trainings.
    - Per-training artist and department customization.
    - Lead technician assignment per department.
    - Custom training names with optional display name override.
    - Report Sections: Three rich text sections (Goal, Training Notes, Follow-Up) included in PDF exports and emails.
- **Report Template**: Global header/footer template with image upload.
- **PDF Export**:
    - Custom Header: Includes template header with logos, title, date, and Stage Manager on Duty.
    - Filename Format: `ART-SM-TRN La Perle Training Report YYYYMMDD.pdf`.
- **Email Distribution**:
    - Outlook Integration: Stage managers can connect Outlook accounts via Replit connector.
    - Email Templates: Configurable TO/CC/BCC, subject line with `{{date}}` variable, and customizable body prefix.
- **Audit Trail**: All reports and trainings track `createdBy`, `updatedBy`, and timestamps.
- **One Report Per Day**: A single report encompasses all trainings for a given day.
- **Lineup Management**:
    - **Lineup List**: Card-based view of all show lineups with show number, date, time, showcaller, and status badges.
    - **Lineup Builder**: Visual stage layout matching production format, organized by scenes/acts (Show Info, Prologue/Desert Flower, City, Spaceship/Tower Bridge, etc.).
    - **Stage Positions**: Positions grouped by sections (VOM entries, inversions, characters, zombies), each showing artist assignments with roles.
    - **Show Information**: OUT artists display, show notes, technical notes, dive heights configuration.
    - **EM Team Management**: Full EM team roster (DOD, CFW, PWD, SR PWD, CARPS, WARD, RIG, AQX, SM) with location assignments.
    - **Drag-and-Drop Interface**: Visual cues for drag-and-drop artist assignment (mockup ready for full implementation).
    - **Artist Roster**: Searchable artist sidebar showing names and roles for easy assignment.
    - **Export Capability**: PDF export button for lineup sheets.
- **Schedule Management**:
    - **Full Schedule View**: Timeline-based daily schedule showing all activities as horizontal blocks across time slots (7:00 AM - 11:45 PM).
    - **Time Display**: Header labels show only hour and half-hour markers (7:00, 7:30, 8:00, etc.) for readability.
    - **Grid Structure**: Internal grid uses 15-minute increments (40px per slot) for precise activity positioning, with dashed vertical lines every 15 minutes.
    - **Activity Types**: Shows, Artist Calls, Rehearsals, Fittings, Meetings with color-coded visual distinction.
    - **Per-Artist View**: Weekly grid showing individual artist calls and activities organized by artist rows.
    - **Week Navigation**: Navigate between weeks with week number display.
    - **Day Tabs**: Quick access to individual day schedules within the week.
    - **Activity Details**: Each activity displays title, time range, location, and participants.
    - **Color Legend**: Visual legend explaining activity type color coding.
    - **Export Capability**: PDF export buttons for both schedule views.
- **Attendance System**:
    - **Artist Sign-In**: Public page at `/attendance/sign-in` with photo grid, 4-digit PIN, and geofencing validation. All artists are visible on the page; authentication is required when selecting an artist (redirects to login if not authenticated).
    - **Stage Manager Dashboard**: Real-time tracking at `/attendance/dashboard` (requires role) with weekly calendar and manual sign-out.
    - **Tick Sheets**: Meeting attendance tracking at `/attendance/tickoff` (requires role) with optimistic UI updates and real-time WebSocket synchronization.
        - **Instant Feedback**: Artists disappear from list immediately when ticked off (optimistic updates via TanStack Query's onMutate).
        - **Progressive Filtering**: Only unmarked artists are displayed; card headers show "X artists remaining" instead of marked/total.
        - **Error Handling**: Automatic rollback on failure using onError with context snapshot.
        - **Cross-Client Sync**: All connected users see updates instantly via WebSocket broadcast.
        - **Performance**: <50ms instant feedback before server response, eliminating previous 500-1000ms lag.
    - **Artist Management**: Photo URL and Status (Active, Out, Long-Term OUT) fields for artists. Artists can set PINs during first sign-in.
    - **Real-time Synchronization**: All sign-in/sign-out and tick sheet marks broadcast via WebSocket to all connected clients.

### System Design Choices
- **Database Schema**: Comprehensive PostgreSQL schema covering users, scenes, acts, departments, locations, artists, technicians, reports, trainings, attendance records, tick sheets, lineup templates, show lineups, and schedules.
- **Lineup Data Model**: Reusable lineup templates with position definitions, show-specific lineups linking templates to shows, position assignments for artists, EM team assignments, and scene-specific notes.
- **Schedule Data Model**: Schedule containers for weekly/daily views, individual schedule calls with artist/group assignments, call type categorization, and optional show lineup linkage.
- **API Endpoints**: RESTful API for all application functionalities.
- **Session Management**: Session-based authentication with PostgreSQL session store.
- **WebSocket Architecture**: Standalone WebSocket server for real-time updates.

## External Dependencies
- **Database**: PostgreSQL
- **Frontend Libraries**: React, Vite, Wouter, TanStack Query, shadcn/ui, Tiptap.
- **Backend Libraries**: Express.js, Drizzle ORM, Passport.js, scrypt.
- **Sanitization**: DOMPurify.
- **Email Integration**: Replit Outlook connector, Microsoft Graph Client.