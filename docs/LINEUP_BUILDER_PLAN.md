# Lineup Builder & Daily Lineup - Technical Specification

## Overview
Visual lineup management system for La Perle show operations. Stage Managers create flexible lineup templates with drag-and-drop positioning, then instantiate them for specific shows with real-time eligibility validation, auto-fill from previous performances, and track-based assignment propagation.

---

## Role-Based Access Control

### User Roles
- **Admin**: Full access to all features, can override any restriction
- **Stage Management**: Create/edit templates and daily lineups, manage assignments, override with justification
- **Coaching**: Manage integration plans, view/edit coaching-owned positions only
- **Performance Wellness**: Manage artist restrictions that affect eligibility
- **Read Only**: View lineups and reports only

### Permission Matrix
| Feature | Admin | Stage Mgmt | Coaching | Perf Wellness | Read Only |
|---------|-------|------------|----------|---------------|-----------|
| Edit Lineup Builder | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create Daily Lineup | ✓ | ✓ | ✗ | ✗ | ✗ |
| Assign Artists | ✓ | ✓ | Coaching positions only | ✗ | ✗ |
| Override Restrictions | ✓ | ✓ (with justification) | ✗ | ✗ | ✗ |
| Manage Restrictions | ✓ | ✗ | ✗ | ✓ | ✗ |
| Publish Lineup | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Lineups | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Data Model

### 1. Lineup Templates (The Canonical Design)

**lineup_templates**
```
id: UUID
name: string (e.g., "Standard Show Template")
version: string (e.g., "V01.00")
canvasWidth: integer (e.g., 1200)
canvasHeight: integer (e.g., 800)
createdBy: UUID → users.id
createdAt: timestamp
updatedAt: timestamp
```

**template_scenes**
```
id: UUID
templateId: UUID → lineup_templates.id
name: string (e.g., "PROLOGUE / DESERT FLOWER")
sortOrder: integer
stageImageUrl: string (background image for this scene)
stageImageLocked: boolean (prevents accidental moving)
createdAt: timestamp
```

**positions** (draggable blocks on canvas)
```
id: UUID
templateSceneId: UUID → template_scenes.id
label: string (e.g., "Pearl Girl", "VOM 5 Entry") - can duplicate across scenes
departmentId: UUID → departments.id (optional)
ownership: enum ('stage_management' | 'coaching')
maxAssignees: integer (null = unlimited)

// Layout coordinates (pixels on canvas)
x: integer
y: integer
width: integer
height: integer
zIndex: integer

// Styling
backgroundColor: string (hex color)
borderColor: string
borderWidth: integer
textColor: string
fontSize: integer
fontWeight: string
iconName: string (optional - 'medic', 'bicycle', etc.)

// Requirements
requiredCompetencyIds: UUID[] (array)
integrationPlanId: UUID → integration_plan_templates.id (optional)

createdAt: timestamp
```

### 2. Position Tracks (Link Positions Across Scenes)

**position_tracks**
```
id: UUID
templateId: UUID → lineup_templates.id
name: string (e.g., "Pearl Girl Track", "King Character Arc")
autoLinkByLabel: boolean (if true, auto-includes positions with matching label)
linkedLabel: string (if autoLinkByLabel, which label to match)
createdAt: timestamp
```

**position_track_members** (junction table)
```
id: UUID
trackId: UUID → position_tracks.id
positionId: UUID → positions.id
createdAt: timestamp
```

**How Tracks Work:**
1. **Auto-link mode**: Set `autoLinkByLabel=true` and `linkedLabel="Pearl Girl"` → automatically includes all "Pearl Girl" positions across all scenes
2. **Manual mode**: Set `autoLinkByLabel=false`, manually add positions even if labels differ (e.g., "King's Guard" + "Guard Leader" + "Royal Protector")
3. **Assignment behavior**: When assigning artist to any position in a track, system attempts to assign to ALL track positions. If restricted in specific scene, that position shows blank with yellow fill.

### 3. Competencies & Tasks

**competencies**
```
id: UUID
departmentId: UUID → departments.id
name: string
requiresTaskIds: UUID[] (array → tasks.id)
createdAt: timestamp
```

**tasks**
```
id: UUID
title: string
detail: text
evidenceType: string (e.g., "video", "signoff", "documentation")
signoffRole: enum ('coach', 'sm', 'physio', 'rigging', 'other')
createdAt: timestamp
```

### 4. Integration Plans

**integration_plan_templates**
```
id: UUID
name: string
linkedToType: enum ('scene' | 'act' | 'position')
linkedToId: UUID (polymorphic - scene/act/position ID)
steps: JSON array of {order, title, detail, required, signoffRole}
createdAt: timestamp
updatedAt: timestamp
```

**reintegration_plans** (per artist, for return after absence)
```
id: UUID
artistId: UUID → artists.id
status: enum ('active' | 'completed' | 'paused')
steps: JSON array (similar structure to template steps)
createdAt: timestamp
updatedAt: timestamp
```

### 5. Distinguished Artists

**distinguished_artists**
```
id: UUID
artistId: UUID → artists.id
status: enum ('OUT' | 'BACK_IN' | 'LONG_TERM_OUT')
reason: text
effectiveFrom: date
expectedReturn: date (optional)
createdAt: timestamp
updatedAt: timestamp
```

**Business Rules:**
- OUT and LONG_TERM_OUT artists are hidden from position pickers
- Cannot be assigned to any position
- BACK_IN artists are eligible again
- Show Info page auto-populates OUT/BACK_IN list

### 6. Performance Wellness Restrictions

**performance_wellness_restrictions**
```
id: UUID
artistId: UUID → artists.id
category: enum ('medical', 'coaching', 'rigging', 'physio', 'other')
severity: enum ('hard' | 'soft')
scopeType: enum ('scene' | 'act' | 'position' | 'department')
scopeIds: UUID[] (array of scene/act/position/department IDs)
notes: text
effectiveFrom: date
effectiveTo: date (optional)
createdBy: UUID → users.id
createdAt: timestamp
updatedAt: timestamp
```

**Business Rules:**
- **Hard restriction**: Blocks assignment completely (fail state)
- **Soft restriction**: Shows warning but allows assignment
- Scope determines where restriction applies (can be multiple scenes, positions, etc.)

### 7. Daily Lineup Instances (Show Day)

**daily_lineup_instances**
```
id: UUID
templateId: UUID → lineup_templates.id
date: date
showNumber: string (e.g., "#3445")
showTime: string (e.g., "21:00")
dayNotes: text
publishedAt: timestamp (null if draft)
publishToken: string (for digital display URL)
copiedFromInstanceId: UUID → daily_lineup_instances.id (tracks auto-fill source)
createdBy: UUID → users.id
createdAt: timestamp
updatedAt: timestamp
```

**lineup_assignments**
```
id: UUID
dailyLineupId: UUID → daily_lineup_instances.id
positionId: UUID → positions.id
artistId: UUID → artists.id
trackId: UUID → position_tracks.id (optional - if part of track assignment)
validationState: enum ('pass' | 'warn' | 'fail')
validationReasons: text[] (array of reason strings)
isTrackRestricted: boolean (true if artist restricted in this specific position but assigned via track)
overrideJustification: text (required if overriding failed validation)
createdAt: timestamp
updatedAt: timestamp
```

### 8. Print & Display Presets

**print_presets**
```
id: UUID
name: string (e.g., "A4 Standard", "A3 Large Format")
paperSize: enum ('A3' | 'A4')
scenesPerPage: integer (default: 4)
marginTop: integer (mm)
marginBottom: integer (mm)
marginLeft: integer (mm)
marginRight: integer (mm)
gutter: integer (spacing between scenes)
headerLogoUrl: string
footerLogoUrl: string
fontScale: decimal (1.0 = normal)
createdAt: timestamp
```

**digital_display_presets**
```
id: UUID
name: string
highContrast: boolean
autoRefreshSeconds: integer
autoRotateScenes: boolean
rotateIntervalSeconds: integer
createdAt: timestamp
```

### 9. Audit Log

**audit_log**
```
id: UUID
entityType: string (e.g., 'lineup_assignment', 'position', 'template')
entityId: UUID
action: enum ('create' | 'update' | 'delete' | 'assign' | 'override' | 'publish')
userId: UUID → users.id
changes: JSON (diff of what changed)
timestamp: timestamp
```

---

## Key Workflows

### 1. Create Lineup Template (Lineup Builder)

**Access:** Button on Daily Lineup page → Opens full-screen modal (Admin + Stage Management only)

**Steps:**
1. Create template with name and version
2. Add scenes (name, sort order, upload stage image)
3. For each scene:
   - Set canvas background image
   - Drag/resize/position blocks on canvas
   - Configure each position via inspector:
     - Label, department, ownership
     - Max assignees
     - Required competencies
     - Link to integration plan
     - Styling (colors, borders, fonts, icon)
4. Create position tracks:
   - Auto-link by label (all "Pearl Girl" positions)
   - OR manually link different positions to create character arc
5. Save version (V01.00, V01.01, etc.)

**Features:**
- Undo/redo
- Keyboard nudge (arrow keys)
- Snap to grid
- Duplicate positions
- Lock/unlock stage image
- Version comparison
- Preview read-only

### 2. Create Daily Lineup (Show Day Workflow)

**Route:** `/lineups/daily/new`

**Steps:**
1. Select template
2. Enter date, show number, show time
3. **Auto-fill toggle**: Copy assignments from most recent instance
   - Fetches last show with same template
   - Copies all assignments by position ID
   - Re-runs eligibility checks
   - Flags new restrictions with yellow
4. Adjust assignments as needed
5. Publish when ready

### 3. Assign Artists to Positions

**Interaction Flow:**

**Single Position Assignment:**
1. Drag artist chip from artist rail onto position
2. System checks if position is in a track
3. If in track → Confirm dialog: "Assign to all 5 positions in Pearl Girl Track?"
4. Run eligibility validation for each position:
   - Distinguished Artists check
   - Restrictions check (hard/soft)
   - Ownership check
   - Competencies/tasks check
   - Integration plan check
   - Capacity check
5. Update assignment states:
   - Green border: Valid assignment
   - Yellow border: Soft restriction warning
   - Red border: Failed validation
   - Yellow fill + empty: Track position where artist is restricted

**Swap Assignment:**
1. Drag assigned artist onto another assigned artist
2. Positions swap
3. Re-validate both
4. If either in track, handle track reassignment

### 4. Eligibility Validation Rules (Order of Execution)

**Validation Service Checks:**

1. **Distinguished Artists** (highest priority)
   - If artist status = OUT or LONG_TERM_OUT → FAIL
   - Hide from position pickers
   - Return: `{state: 'fail', reasons: ['Artist is OUT - reason']}`

2. **Performance Wellness Restrictions**
   - Check if restriction scope includes this position
   - Hard restriction → FAIL
   - Soft restriction → WARN
   - Return reasons with category and notes

3. **Ownership & Access Control**
   - Coaching users can only assign to coaching-owned positions
   - Stage Management can assign anywhere
   - Return: `{state: 'fail', reasons: ['Access denied - coaching only']}`

4. **Required Competencies & Tasks**
   - Check artist has all required competencies
   - Check required tasks completed
   - Incomplete → FAIL
   - Return missing competencies/tasks

5. **Integration Plan Requirements**
   - If position has linked integration plan
   - Check required steps completed
   - Plan settings determine warn vs fail

6. **Reintegration Plan**
   - If artist has active reintegration plan
   - Check if plan constrains this position
   - Warn or fail based on plan configuration

7. **Capacity & Duplicates**
   - Check maxAssignees not exceeded
   - Check artist not double-booked in same scene
   - Return: `{state: 'fail', reasons: ['Position at capacity', 'Artist already assigned to VOM 1 Entry']}`

**Override Pathway:**
- Stage Management can override with required justification
- Override logged in audit trail
- Separate permission for overriding hard Performance Wellness restriction (default: off)

### 5. Publish Workflow

**Pre-Publish Validation:**
1. Check all critical positions assigned (or acknowledged gaps)
2. Review conflicts and warnings panel
3. Confirm publish action

**Publish Steps:**
1. Lock instance for editing (`publishedAt = now`)
2. Write audit entry with full lineup snapshot
3. Generate PDF with 4 scenes per page
4. Create/regenerate `publishToken` for digital display
5. Show success confirmation with:
   - PDF download link
   - Digital display URL: `/display/{id}?token={token}`

**Post-Publish:**
- Instance becomes read-only
- Can create new version for changes
- Digital display auto-refreshes

---

## Visual States & UI Patterns

### Position Block States (on Canvas)

| State | Visual | Meaning |
|-------|--------|---------|
| Unassigned | Light gray fill, dashed border | No artist assigned |
| Assigned + Valid | Green border, artist name | Passed all checks |
| Assigned + Warning | Yellow border, artist name, ⚠️ icon | Soft restriction |
| Assigned + Failed | Red border, artist name, ✗ icon | Failed validation |
| Track Restricted | Yellow fill, empty, ⚠️ icon | Artist assigned to track but restricted here |
| Locked (published) | Grayed out, no interaction | Published lineup |

### Artist Rail Filters

- **Department**: Show only artists from selected department
- **Eligibility**: Show only eligible for current scene
- **Has Restrictions**: Flag artists with active restrictions
- **Has Reintegration Plan**: Flag artists in reintegration
- **Search**: Filter by name
- **Show OUT Artists Toggle**: Display OUT/LONG_TERM_OUT for reference (blocked from assignment)

### Scene Tabs

- Tab per scene with scene name
- Badge showing unassigned count (e.g., "CITY (3)")
- Badge showing warning/error count
- Active tab highlights current scene canvas

---

## Routes & Pages

### Frontend Routes

| Route | Page | Access |
|-------|------|--------|
| `/lineups/daily` | Daily Lineup list | All authenticated |
| `/lineups/daily/new` | Create new daily lineup | Admin, Stage Mgmt |
| `/lineups/daily/:id` | Daily lineup detail with canvas | All authenticated |
| `/display/:id?token=xxx` | Digital display (read-only) | Public with valid token |
| `/settings/competencies` | Competencies & tasks management | Admin, Stage Mgmt |
| `/settings/integration-plans` | Integration plan templates | Admin, Stage Mgmt, Coaching |
| `/settings/restrictions` | Performance wellness restrictions | Admin, Perf Wellness |
| `/settings/print-presets` | Print preset configuration | Admin, Stage Mgmt |

**Note:** Lineup Builder is NOT a top-level route - it's a full-screen modal/drawer opened via button on Daily Lineup detail page.

### Backend API Routes

**Templates:**
- `GET /api/lineup-templates` - List all templates
- `POST /api/lineup-templates` - Create template
- `GET /api/lineup-templates/:id` - Get template with scenes and positions
- `PATCH /api/lineup-templates/:id` - Update template
- `DELETE /api/lineup-templates/:id` - Delete template

**Scenes:**
- `POST /api/templates/:templateId/scenes` - Add scene to template
- `PATCH /api/scenes/:id` - Update scene
- `POST /api/scenes/:id/upload-image` - Upload stage image
- `DELETE /api/scenes/:id` - Delete scene

**Positions:**
- `POST /api/scenes/:sceneId/positions` - Add position to scene
- `PATCH /api/positions/:id` - Update position (layout, styling, requirements)
- `DELETE /api/positions/:id` - Delete position

**Tracks:**
- `POST /api/templates/:templateId/tracks` - Create position track
- `PATCH /api/tracks/:id` - Update track settings
- `POST /api/tracks/:id/positions` - Add positions to track
- `DELETE /api/tracks/:id/positions/:positionId` - Remove position from track
- `GET /api/tracks/:id/positions` - Get all positions in track

**Competencies & Tasks:**
- `GET /api/competencies` - List competencies
- `POST /api/competencies` - Create competency
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task

**Integration Plans:**
- `GET /api/integration-plan-templates` - List templates
- `POST /api/integration-plan-templates` - Create template
- `GET /api/artists/:artistId/reintegration-plan` - Get artist's plan
- `PATCH /api/reintegration-plans/:id` - Update plan steps

**Distinguished Artists:**
- `GET /api/distinguished-artists` - List all with filters
- `POST /api/distinguished-artists` - Set artist status
- `PATCH /api/distinguished-artists/:id` - Update status

**Restrictions:**
- `GET /api/restrictions` - List restrictions (filtered by role)
- `POST /api/restrictions` - Create restriction (Perf Wellness only)
- `PATCH /api/restrictions/:id` - Update restriction
- `DELETE /api/restrictions/:id` - Delete restriction

**Daily Lineups:**
- `GET /api/daily-lineups` - List instances with filters
- `POST /api/daily-lineups` - Create instance (with auto-fill option)
- `GET /api/daily-lineups/:id` - Get instance with all assignments
- `PATCH /api/daily-lineups/:id` - Update instance
- `POST /api/daily-lineups/:id/publish` - Publish lineup

**Assignments:**
- `POST /api/daily-lineups/:id/assignments` - Assign artist to position (handles tracks)
- `PATCH /api/assignments/:id` - Update assignment (for overrides)
- `DELETE /api/assignments/:id` - Remove assignment
- `POST /api/assignments/:id/validate` - Run eligibility check
- `POST /api/assignments/swap` - Swap two artists

**Export:**
- `GET /api/daily-lineups/:id/pdf` - Generate PDF export
- `GET /api/daily-lineups/:id/email-preview` - Preview email format

---

## PDF Export Specification

### Layout: 4 Scenes Per Page (2x2 Grid)

**Page 1: Show Info Cover**
- Header with logos and title
- Show date, number, and time
- Distinguished Artists section (auto-populated):
  - OUT Today (with reasons)
  - Back In Today
  - Long Term Out
- Show notes (editable)
- EM Team assignments section (TBD)

**Pages 2+: Scene Layouts**
- 2x2 grid, 4 scenes per page
- Each scene cell:
  - Scene name as header
  - Canvas layout with all positions at correct x/y coordinates
  - Assigned artist names in position blocks
  - Position styling preserved (colors, borders, icons)
- Auto-flow scenes in template order
- Page break after every 4 scenes

**Filename Format:**
```
ART SM LNP La Perle Lineup YYYYMMDD HHMM.pdf
Example: ART SM LNP La Perle Lineup 20251017 2100.pdf
```

**Presets:**
- A4: Margins 15mm, Gutter 10mm
- A3: Margins 20mm, Gutter 15mm
- Configurable font scale (0.8x - 1.2x)
- Header/footer logo URLs

---

## Digital Display Specification

**Route:** `/display/:dailyId?token={publishToken}`

**Features:**
- Token authentication (validates against `publishToken` in database)
- Read-only view (no editing controls)
- High contrast mode for visibility
- Auto-refresh every N seconds (from preset)
- Optional auto-rotate scenes with configurable interval
- Scene selector (manual navigation)
- Full-screen optimized for backstage monitors
- Responsive scaling

**Use Case:** 
Display published lineup on backstage monitors so crew can see assignments in real-time without accessing the editing interface.

---

## Mobile Responsive Design

**Adaptations for Mobile/Tablet:**

1. **Scene Navigation:**
   - Tabs → Dropdown selector on mobile
   - Sticky header with scene selector

2. **Canvas View:**
   - Scales to fit screen width
   - Pinch to zoom enabled
   - Pan to navigate large canvases

3. **Artist Rail:**
   - Collapsible drawer (swipe from right)
   - Large tap targets (min 44x44px)
   - Simplified filters with bottom sheet

4. **Drag & Drop:**
   - Touch-friendly drag handles
   - Long-press to initiate drag
   - Visual feedback during drag

5. **Publish Bar:**
   - Sticky bottom bar
   - Large publish button
   - Conflicts count badge

---

## Technical Implementation Notes

### Canvas Rendering System

**Approach:** SVG-based canvas with responsive scaling

```javascript
// Template defines fixed canvas size
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Scale factor based on container size
const scale = Math.min(
  containerWidth / CANVAS_WIDTH,
  containerHeight / CANVAS_HEIGHT
);

// Render positions with scaled coordinates
positions.map(pos => (
  <rect
    x={pos.x * scale}
    y={pos.y * scale}
    width={pos.width * scale}
    height={pos.height * scale}
    fill={pos.backgroundColor}
    stroke={pos.borderColor}
    strokeWidth={pos.borderWidth}
  />
));
```

### Track Assignment Algorithm

```javascript
async function assignArtistToTrack(artistId, trackId, dailyLineupId) {
  // Get all positions in track
  const positions = await getTrackPositions(trackId);
  
  const results = [];
  for (const position of positions) {
    // Run eligibility check
    const validation = await validateAssignment(artistId, position.id);
    
    if (validation.state === 'fail' && validation.isRestricted) {
      // Mark as track-restricted, don't assign
      results.push({
        positionId: position.id,
        assigned: false,
        isTrackRestricted: true,
        validationState: 'fail',
        validationReasons: validation.reasons
      });
    } else {
      // Assign (even if warn state)
      await createAssignment({
        dailyLineupId,
        positionId: position.id,
        artistId,
        trackId,
        validationState: validation.state,
        validationReasons: validation.reasons,
        isTrackRestricted: false
      });
      results.push({ positionId: position.id, assigned: true });
    }
  }
  
  return results;
}
```

### Auto-Fill from Previous Show

```javascript
async function autoFillFromPrevious(newInstanceId, templateId) {
  // Find most recent published instance with same template
  const previousInstance = await db
    .select()
    .from(daily_lineup_instances)
    .where(eq(daily_lineup_instances.templateId, templateId))
    .where(isNotNull(daily_lineup_instances.publishedAt))
    .orderBy(desc(daily_lineup_instances.date))
    .limit(1);
  
  if (!previousInstance) return;
  
  // Get all assignments from previous
  const previousAssignments = await getAssignments(previousInstance.id);
  
  // Copy assignments to new instance
  for (const assignment of previousAssignments) {
    // Re-validate eligibility (restrictions may have changed)
    const validation = await validateAssignment(
      assignment.artistId,
      assignment.positionId
    );
    
    await createAssignment({
      dailyLineupId: newInstanceId,
      positionId: assignment.positionId,
      artistId: assignment.artistId,
      trackId: assignment.trackId,
      validationState: validation.state,
      validationReasons: validation.reasons
    });
  }
  
  // Mark copy source for audit trail
  await updateInstance(newInstanceId, {
    copiedFromInstanceId: previousInstance.id
  });
}
```

---

## Testing Checklist

### Unit Tests - Eligibility Service

- [ ] Distinguished Artist OUT → fail
- [ ] Distinguished Artist LONG_TERM_OUT → fail
- [ ] Distinguished Artist BACK_IN → pass
- [ ] Hard restriction in scope → fail
- [ ] Soft restriction in scope → warn
- [ ] Restriction out of scope → pass
- [ ] Missing required competency → fail
- [ ] Incomplete integration plan step → warn/fail
- [ ] Position at capacity → fail
- [ ] Artist double-booked in scene → fail
- [ ] Ownership violation (coaching to SM position) → fail
- [ ] Valid assignment → pass

### Integration Tests - Track System

- [ ] Auto-link track creates when positions added with matching label
- [ ] Manual track links different position labels
- [ ] Assign to track assigns all eligible positions
- [ ] Assign to track skips restricted position (yellow indicator)
- [ ] Removing position from track updates assignments
- [ ] Deleting track doesn't delete positions

### E2E Tests - User Workflows

- [ ] Create template with scenes and positions
- [ ] Upload stage images per scene
- [ ] Create position track (auto-link by label)
- [ ] Create position track (manual link)
- [ ] Create daily lineup with auto-fill
- [ ] Assign artist to single position
- [ ] Assign artist to track (confirms and assigns all)
- [ ] Override failed validation with justification
- [ ] Publish lineup (locks, generates PDF, creates token)
- [ ] View digital display with token
- [ ] PDF exports with correct 4-scenes-per-page layout

---

## Future Enhancements (Post-MVP)

- [ ] Template inheritance (base template + variations)
- [ ] Bulk artist upload for onboarding
- [ ] Mobile app for field assignments
- [ ] SMS notifications for assignment changes
- [ ] Historical analytics (artist performance tracking)
- [ ] Multi-language support
- [ ] Advanced conflict resolution AI
- [ ] Integration with costume/props departments

---

## Glossary

- **Template**: The canonical lineup design with scenes and positioned blocks
- **Scene**: One segment of the show (e.g., "PROLOGUE", "CITY")
- **Position**: A draggable block on the canvas representing a role/location to assign
- **Track**: Linked positions across scenes (e.g., "Pearl Girl" appears in 3 scenes)
- **Daily Instance**: A lineup for a specific show date, created from a template
- **Assignment**: Connecting an artist to a position for a specific show
- **Distinguished Artist**: Artist with special status (OUT, BACK_IN, LONG_TERM_OUT)
- **Restriction**: Performance Wellness constraint limiting artist assignments
- **Eligibility**: Whether an artist can be assigned to a position (pass/warn/fail)
- **Override**: Stage Management bypassing a failed eligibility check with justification
- **Publish**: Locking a daily lineup and generating PDF/display outputs

---

*Last Updated: October 23, 2025*
