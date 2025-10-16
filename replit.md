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
- **Training Name Combobox**: Unified combobox field for training names that allows selecting scene/act from dropdown (required) with optional custom display name override. Custom names appear as the only title on training cards (no scene/act shown underneath).
- **Training Card Layout**: 3-column grid layout with training name above start time (left), location above end time (middle), and stage manager above duration (right).

### Technical Implementations
- **Frontend**: React + Vite, Wouter for routing, TanStack Query for data management, shadcn/ui for components.
- **Backend**: Express.js framework.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Passport.js with a local strategy, bcrypt for password hashing, and session-based authentication. The apiRequest utility handles all API calls and returns parsed JSON directly.
- **Data Management**: TanStack Query for data fetching, caching, and state management.
- **XSS Protection**: Two-layer defense for rich text notes (Tiptap escaping + DOMPurify sanitization).
- **Auto-Report Creation**: When adding the first training to a new report, the system automatically checks for an existing report on that date (GET /api/reports/date/:date) and either reuses it or creates a new one, respecting the "One Report Per Day" constraint.
- **Email Integration**: Replit Outlook connector for OAuth authentication. Training reports can be sent via email using Microsoft Graph API with customizable templates, distribution lists, and automatic date variable replacement.

### Feature Specifications
- **Secure Authentication**: Login/signup with hashed passwords and session management.
- **Profile Management**: Update user details and password.
- **Settings Management**: Full CRUD operations for all entities (scenes, acts, departments, locations, artists, technicians, report template).
- **User Management**: 
    - Control active/inactive status of users
    - **User Deletion with Admin Authentication**: Delete users with admin password confirmation dialog. Requires admin credentials (username: "admin", password: "laperleSM2025!"). Prevents self-deletion and deletion of users who have created or modified reports.
- **Hierarchical Organization**: Consistent parent-child structures for Scenes → Acts, Location Types → Locations, and Artist Groups → Artists.
- **Reports & Trainings**:
    - CRUD for reports and trainings with audit trails.
    - **Multi-location support** for trainings.
    - Per-training artist and department customization with auto-population from scene/act assignments.
    - **Lead technician assignment**: Each department can have a lead technician assigned during training editing. Displayed as "Department (LeadName)" on training cards.
    - **Custom training names**: Optional display name override for trainings. Scene/act selection is required (provides departments/artists), custom name is optional for special naming (e.g., "Emergency Safety Protocol"). Displays custom name as title with scene/act as subtitle on training cards.
    - **Report Sections**: Each report includes three rich text sections with half-height editors (min-h-16): Goal (for daily objectives), Training Notes (for general training observations), and Follow-Up (for action items and next steps). All sections support full Tiptap formatting and are included in PDF exports and email distribution.
- **Report Template**: Global header/footer template with image upload.
- **PDF Export**:
    - **Custom Header**: PDF reports include template header with left/right logo images and centered title. Date and Stage Manager on Duty appear centered below the title within the header section.
    - **Filename Format**: Exported PDFs use the naming convention `ART-SM-TRN La Perle Training Report YYYYMMDD.pdf` where the date is dynamically generated from the report date.
    - **Export Button**: Loading spinner displayed during PDF generation. Download triggers automatically upon completion.
- **Email Distribution**:
    - **Outlook Integration**: Stage managers can connect their Outlook accounts via Replit connector to send reports directly from the app.
    - **Email Templates**: Configure TO/CC/BCC distribution lists, subject line with {{date}} variable replacement, and customizable email body prefix in Settings.
    - **Automated Formatting**: Training data is automatically formatted into readable email content with session details, times, locations, stage managers, artists, and notes.
    - **Send Report Button**: Available in report editor when user has connected Outlook account. Sends formatted email with training details to configured recipients. Email dialog opens instantly with loading state while fetching preview data.
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
- **Email Integration**: Replit Outlook connector, Microsoft Graph Client (@microsoft/microsoft-graph-client) for sending emails via Outlook.