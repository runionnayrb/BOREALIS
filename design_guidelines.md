# La Perle Training Reports - Design Guidelines

## Design Approach: Professional Production Tool

**Selected Framework:** Linear-inspired productivity design with Material Design foundations
**Rationale:** This is a utility-focused production management tool requiring clarity, efficiency, and professional polish for daily operations by technicians, artists, and production staff.

---

## Core Design Principles

1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Rapid Task Completion**: Minimize clicks, maximize efficiency in report creation and training scheduling
3. **Data Hierarchy**: Clear visual distinction between primary actions, data tables, and supporting information
4. **Professional Polish**: Refined aesthetics befitting a world-class theatrical production

---

## Color Palette

### Dark Mode (Primary Interface)
- **Background Base**: 220 15% 8% (deep slate, professional)
- **Surface Elevated**: 220 12% 12% (cards, panels)
- **Border Subtle**: 220 10% 20% (dividers, table borders)
- **Text Primary**: 220 10% 95% (headings, body text)
- **Text Secondary**: 220 8% 65% (labels, metadata)

### Brand & Accent Colors
- **Primary Action**: 195 85% 55% (vibrant cyan - evokes theatrical lighting, professional yet energetic)
- **Primary Hover**: 195 85% 48%
- **Success**: 142 70% 50% (training completed, confirmations)
- **Warning**: 38 92% 55% (scheduling conflicts)
- **Error**: 0 84% 60% (destructive actions)

### Light Mode (Secondary)
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Border**: 220 13% 88%
- **Text Primary**: 220 15% 15%
- **Text Secondary**: 220 10% 45%

---

## Typography

**Font Stack**: 
- Primary: 'Inter' (Google Fonts) - exceptional readability for data-dense interfaces
- Monospace: 'JetBrains Mono' (Google Fonts) - for time displays, durations

**Scale & Hierarchy**:
- App Title: text-xl font-semibold tracking-tight
- Page Headers: text-2xl md:text-3xl font-bold
- Section Headers: text-lg font-semibold
- Body Text: text-sm md:text-base
- Labels: text-xs uppercase tracking-wide font-medium text-secondary
- Data Display (times, durations): text-sm font-mono
- Buttons: text-sm font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistency
- Component padding: p-4 to p-6
- Section gaps: gap-8 to gap-12
- Page margins: px-4 md:px-8 max-w-7xl mx-auto

**Desktop Structure**:
- Fixed left sidebar: w-64, navigation with act/department icons
- Main content area: flex-1 with max-w-6xl centering for optimal reading
- Top bar: h-14 with app branding and global actions

**Mobile Structure**:
- Full-width content with px-4 safe margins
- Bottom tab bar: h-16 with 4 tabs (Reports, New Report, Today, Settings)
- Sticky action buttons: bottom-20 for primary CTAs (Save, Export PDF)

**Grid Patterns**:
- Settings cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Training list: Single column with clear row separation
- Department positions table: Responsive table with horizontal scroll on mobile

---

## Component Library

### Navigation
- **Desktop Sidebar**: Dark surface with hover states (bg-surface-elevated on hover), active state with cyan left border and subtle bg tint
- **Mobile Bottom Tabs**: Fixed position, blur backdrop, icon + label, active tab with cyan accent color

### Buttons
- **Primary**: bg-primary text-white rounded-lg px-4 py-2.5 font-medium hover:bg-primary-hover transition-colors
- **Secondary**: border-2 border-primary text-primary rounded-lg px-4 py-2.5 hover:bg-primary/10
- **Outline on Images**: backdrop-blur-md bg-white/10 border border-white/20 text-white (no hover interactions - inherits button states)
- **Ghost**: text-text-secondary hover:text-text-primary hover:bg-surface-elevated

### Forms & Inputs
- **Text Fields**: h-10 px-3 rounded-md border-2 border-border bg-surface focus:border-primary transition-colors
- **Time Pickers**: Large touch-friendly mobile interface with wheel selection, desktop uses native input with custom styling
- **Dropdowns**: Custom styled with search, filtered by department/act logic, max-h-64 overflow-auto

### Data Display
- **Tables**: Striped rows with hover states, sticky headers on scroll, responsive horizontal scroll wrapper on mobile
- **Cards**: rounded-lg border border-border bg-surface p-4 shadow-sm hover:shadow-md transition
- **Training Rows**: Distinct visual blocks showing Act (bold), Time range, Duration badge (pill style), Department positions in nested grid

### Rich Text Editor (TipTap)
- **Toolbar**: Sticky top on scroll, grouped controls (text formatting | lists | alignment | font size), icon buttons with tooltips
- **Editor Canvas**: min-h-64 border rounded-md p-4 focus-within:border-primary, prose styles for rendered content

### PDF Export Layout
- **Header Section**: 3-column grid with images (max-h-24 object-contain), center title stack (text-2xl font-bold + date string text-sm text-secondary)
- **Page Numbers**: Fixed footer, right-aligned, text-xs text-secondary
- **Page Breaks**: CSS `page-break-before: always` on training sections when needed
- **Print Styles**: @media print with display:none for navigation, adjusted margins for physical printing

---

## Animations & Interactions

**Minimal Motion Philosophy**: Animations only where they provide functional feedback

- **Transitions**: All color/bg changes use transition-colors duration-200
- **Drag & Drop**: Visual lift effect (translate-y-1 shadow-lg) during drag, smooth drop animation
- **Toasts**: Slide in from top-right, auto-dismiss after 4s, backdrop-blur with success/error color coding
- **Modal Dialogs**: Backdrop fade-in (bg-black/50), modal slide-up on mobile, scale-in on desktop
- **Loading States**: Skeleton screens (animate-pulse) for data tables, spinner for actions

---

## Mobile Optimizations

- **Touch Targets**: Minimum 44×44px for all interactive elements
- **Bottom Sheet Patterns**: Time pickers, department selection, act picker slide up from bottom
- **Swipe Gestures**: Swipe-to-delete on training rows (with undo toast)
- **Keyboard Behavior**: Auto-focus next field on enter, numeric keyboard for time input
- **Safe Areas**: pb-safe padding for iPhone notch/home indicator compatibility

---

## Iconography

**Library**: Heroicons (outline for nav, solid for status indicators)
- Navigation: CalendarIcon, DocumentTextIcon, CogIcon, ClockIcon
- Actions: PlusIcon, TrashIcon, PencilIcon, ArrowDownTrayIcon (PDF export)
- Status: CheckCircleIcon (success), ExclamationTriangleIcon (warning)
- Drag Handles: Bars3Icon for reorder UI

---

## Empty States & Messaging

- **Illustration Style**: Minimalist line art icons (Heroicons XL size) with muted accent color
- **Empty Reports List**: "No training reports yet" + "Create your first report" CTA button
- **Today View (No Trainings)**: "No trainings scheduled for today" + "View all reports →" link
- **Zero State Cards**: Centered content with icon, short message, and clear action

---

## Accessibility & Quality

- WCAG AA contrast ratios: All text meets 4.5:1 minimum
- Keyboard navigation: Full tab order, focus rings (ring-2 ring-primary ring-offset-2 ring-offset-background)
- Screen reader: Proper ARIA labels on all interactive elements, live regions for toasts
- Dark mode consistency: All components including inputs, dropdowns, and modals use dark theme colors

---

## Images

**Header Images** (Report Editor):
- Format: Landscape logos/branding (recommended 400×120px)
- Position: Left and right columns of 3-column header grid
- Styling: object-contain max-h-24, optional border-2 border-border rounded
- Fallback: Placeholder with upload icon if no image set

**No Hero Image**: This is a utility application - focus on immediate data access rather than marketing visuals.