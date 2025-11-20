# SharePoint Integration

## Overview
Add SharePoint integration to allow users to save PDF reports to SharePoint when sending emails. Users will select a SharePoint location (site and document library) via a dialog, and the system will upload the PDF and optionally include a SharePoint link in the email instead of (or in addition to) attaching the file.

## Goal
When sending reports via email, allow users to:
- Save the PDF to SharePoint
- Choose to attach the file directly OR include a SharePoint link in the email (or both)
- Remember their last selected location for convenience

## Implementation Plan

### 1. Set Up SharePoint Integration

**Integration Details:**
- Integration ID: `connector:ccfg_sharepoint_01K4E4GP3G31BE5PGVY2CNTDDK`
- Uses Microsoft Graph API
- Shares authentication with existing Outlook integration
- Required Permissions: `Sites.ReadWrite.All`, `Files.ReadWrite.All`

**Setup Steps:**
- Use `search_integrations` tool to find SharePoint connector
- Use `use_integration` tool with operation `propose_setting_up` to set it up
- The connector handles API key and secret management automatically

### 2. Create Backend SharePoint Service

**File:** `server/services/sharepoint.ts`

**Functions to implement:**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

class SharePointService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  // List all SharePoint sites user can access
  async listSites() {
    // GET /sites?search=*
    return await this.client.api('/sites').query({ search: '*' }).get();
  }

  // List document libraries (drives) for a specific site
  async listDocumentLibraries(siteId: string) {
    // GET /sites/{siteId}/drives
    return await this.client.api(`/sites/${siteId}/drives`).get();
  }

  // List folders in a document library
  async listFolders(driveId: string, folderPath: string = 'root') {
    // GET /drives/{driveId}/root/children
    // or GET /drives/{driveId}/items/{itemId}/children for subfolders
    const path = folderPath === 'root' 
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/root:/${folderPath}:/children`;
    return await this.client.api(path).get();
  }

  // Upload file to SharePoint (for files < 4MB)
  async uploadFile(driveId: string, folderPath: string, fileName: string, fileBuffer: Buffer) {
    // PUT /drives/{driveId}/root:/{folderPath}/{fileName}:/content
    const path = folderPath 
      ? `/drives/${driveId}/root:/${folderPath}/${fileName}:/content`
      : `/drives/${driveId}/root:/${fileName}:/content`;
    
    return await this.client.api(path)
      .headers({ 'Content-Type': 'application/octet-stream' })
      .put(fileBuffer);
  }

  // Create a shareable link for the uploaded file
  async createShareLink(driveId: string, itemId: string) {
    // POST /drives/{driveId}/items/{itemId}/createLink
    return await this.client.api(`/drives/${driveId}/items/${itemId}/createLink`)
      .post({
        type: 'view',
        scope: 'organization'
      });
  }
}
```

### 3. Add API Routes

**File:** `server/routes.ts`

**Endpoints to add:**

```typescript
// List available SharePoint sites
router.get('/api/sharepoint/sites', async (req, res) => {
  // Initialize SharePointService with user's access token
  // Call listSites()
  // Return sites array
});

// List document libraries for a specific site
router.get('/api/sharepoint/sites/:siteId/drives', async (req, res) => {
  // Get siteId from params
  // Call listDocumentLibraries(siteId)
  // Return drives array
});

// List folders in a document library (optional - for folder navigation)
router.get('/api/sharepoint/drives/:driveId/folders', async (req, res) => {
  // Get driveId from params
  // Get folderPath from query params (optional)
  // Call listFolders(driveId, folderPath)
  // Return folders array
});

// Upload PDF to SharePoint
router.post('/api/sharepoint/upload', async (req, res) => {
  // Get driveId, folderPath, fileName, fileBuffer from request
  // Call uploadFile(driveId, folderPath, fileName, fileBuffer)
  // Return uploaded file details (including itemId for link creation)
});

// Create shareable link for uploaded file
router.post('/api/sharepoint/create-link', async (req, res) => {
  // Get driveId, itemId from request
  // Call createShareLink(driveId, itemId)
  // Return shareable link URL
});
```

### 4. Build SharePoint Picker Component

**File:** `client/src/components/SharePointPicker.tsx`

**Component Structure:**

```typescript
interface SharePointPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (location: SharePointLocation) => void;
  pdfBuffer?: Buffer; // The PDF to upload
}

interface SharePointLocation {
  siteId: string;
  siteName: string;
  driveId: string;
  driveName: string;
  folderPath?: string;
  includeLink: boolean; // true = include link in email, false = attach file
}
```

**UI Elements:**
- Dialog with title "Save Report to SharePoint"
- Cascading dropdowns:
  1. **SharePoint Site** - loads on dialog open
  2. **Document Library** - loads when site is selected
  3. **Folder** (optional) - loads when library is selected
- Radio buttons or toggle:
  - "Attach file to email"
  - "Include SharePoint link in email"
  - "Both"
- "Save Last Selection" checkbox (default: checked)
- Cancel and Save buttons

**Data Flow:**
1. Dialog opens
2. Query `/api/sharepoint/sites` to populate site dropdown
3. User selects site → Query `/api/sharepoint/sites/{siteId}/drives`
4. User selects library → (Optional) Query `/api/sharepoint/drives/{driveId}/folders`
5. User selects attachment method
6. User clicks Save → Upload PDF → Call callback with location details

**LocalStorage for Preferences:**
```typescript
const STORAGE_KEY = 'sharepoint_last_location';

// Save last selection
localStorage.setItem(STORAGE_KEY, JSON.stringify({
  siteId,
  siteName,
  driveId,
  driveName,
  folderPath,
  includeLink
}));

// Load last selection on component mount
const lastLocation = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
```

### 5. Integration Into Report Workflow

**File:** The page where reports are sent (likely in the Reports section)

**Current Flow:**
```
User clicks "Send Report" → Email dialog opens → User sends email
```

**New Flow:**
```
User clicks "Send Report" 
  ↓
SharePoint Picker Dialog opens
  ↓
User selects SharePoint location (or uses saved default)
  ↓
User chooses attachment method (file/link/both)
  ↓
User clicks Save in SharePoint dialog
  ↓
System uploads PDF to SharePoint location
  ↓
If "Include Link": System creates shareable link
  ↓
Email composition dialog opens (pre-filled with attachment or link)
  ↓
User sends email
  ↓
Toast notification: "Report saved to SharePoint and sent via email"
```

**Implementation:**
- Add state for SharePoint dialog: `const [sharePointDialogOpen, setSharePointDialogOpen] = useState(false)`
- Modify "Send Report" button to open SharePoint dialog first
- After SharePoint upload completes, proceed to email dialog
- Pass SharePoint URL or attachment to email service

### 6. Microsoft Graph API Reference

**Authentication:**
The Replit SharePoint connector handles authentication automatically via Microsoft Graph API.

**Key Endpoints:**

```
List Sites:
GET https://graph.microsoft.com/v1.0/sites?search=*

List Document Libraries:
GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives

List Folders:
GET https://graph.microsoft.com/v1.0/drives/{driveId}/root/children

Upload File (< 4MB):
PUT https://graph.microsoft.com/v1.0/drives/{driveId}/root:/{folderPath}/{fileName}:/content
Headers: { 'Content-Type': 'application/octet-stream' }
Body: <Binary file content>

Create Shareable Link:
POST https://graph.microsoft.com/v1.0/drives/{driveId}/items/{itemId}/createLink
Body: {
  "type": "view",
  "scope": "organization"
}
```

**For Large Files (> 4MB):**
Use upload session endpoint:
```
POST https://graph.microsoft.com/v1.0/drives/{driveId}/root:/{fileName}:/createUploadSession
```

### 7. Optional: Database Schema for User Preferences

If you want to store SharePoint preferences in the database instead of localStorage:

```sql
ALTER TABLE users ADD COLUMN sharepoint_default_site_id TEXT;
ALTER TABLE users ADD COLUMN sharepoint_default_site_name TEXT;
ALTER TABLE users ADD COLUMN sharepoint_default_drive_id TEXT;
ALTER TABLE users ADD COLUMN sharepoint_default_drive_name TEXT;
ALTER TABLE users ADD COLUMN sharepoint_default_folder_path TEXT;
ALTER TABLE users ADD COLUMN sharepoint_default_include_link BOOLEAN DEFAULT false;
```

Add to Drizzle schema:
```typescript
sharePointDefaultSiteId: text('sharepoint_default_site_id'),
sharePointDefaultSiteName: text('sharepoint_default_site_name'),
sharePointDefaultDriveId: text('sharepoint_default_drive_id'),
sharePointDefaultDriveName: text('sharepoint_default_drive_name'),
sharePointDefaultFolderPath: text('sharepoint_default_folder_path'),
sharePointDefaultIncludeLink: boolean('sharepoint_default_include_link').default(false),
```

## Testing Checklist

- [ ] SharePoint connector is set up and authenticated
- [ ] Can list all SharePoint sites user has access to
- [ ] Can list document libraries for selected site
- [ ] Can navigate folders (if folder navigation is implemented)
- [ ] PDF uploads successfully to SharePoint
- [ ] File appears in correct SharePoint location
- [ ] Can create shareable link for uploaded file
- [ ] Email sends with SharePoint link (when selected)
- [ ] Email sends with file attachment (when selected)
- [ ] Email sends with both link and attachment (when selected)
- [ ] Last selected location is remembered (localStorage or database)
- [ ] Loading states show during API calls
- [ ] Error handling works for API failures
- [ ] Toast notifications confirm success
- [ ] Works on mobile devices

## Implementation Tips

### Start Simple
1. **Phase 1**: Implement site + library selection only (skip folder navigation)
2. **Phase 2**: Add file upload to root of library
3. **Phase 3**: Add folder navigation
4. **Phase 4**: Add shareable link creation

### Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Validate file size before upload (< 4MB for simple upload)
- Handle permission errors (user might not have write access)

### UX Considerations
- Pre-select last used location on dialog open
- Show loading spinners while fetching data
- Disable "Save" button until location is selected
- Show confirmation toast with SharePoint file URL
- Consider adding "Open in SharePoint" link in toast

### Performance
- Use TanStack Query for caching SharePoint site/library lists
- Debounce folder navigation queries
- Show skeleton loaders during data fetching

## Notes

- The existing Outlook integration already uses Microsoft Graph API, so authentication tokens can be shared
- SharePoint and Outlook connectors should work together seamlessly
- Consider whether to upload before or after email confirmation
- File size limit for simple upload is 4MB; larger files require upload sessions
- Shareable links can be scoped to organization or anonymous (consider security)
- Consider adding ability to browse recent SharePoint locations
