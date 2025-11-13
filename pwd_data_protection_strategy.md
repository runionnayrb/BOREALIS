# PWD Data Protection Strategy
**Performance Wellness Department - Medical Information Security Plan**

---

## Executive Summary

This document outlines the strategy for implementing secure handling of sensitive medical information within the Borealis theatrical production management system. The Performance Wellness Department (PWD) will handle Protected Health Information (PHI) while maintaining necessary show-related restrictions visible to Stage Management for lineup purposes.

**Key Principle**: Separate medical information from show-related operational data, ensuring privacy while enabling production requirements.

---

## Current State Analysis

### Existing Infrastructure
- **Role-Based Access Control**: `performance_wellness` user role exists
- **Restrictions Table**: `pwd_restrictions` table with basic restriction tracking
- **Middleware**: `canManageRestrictions` authorization layer
- **Audit Trail**: Comprehensive audit logging infrastructure (`audit_trail` table)
- **Authentication**: Passport.js with scrypt password hashing

### Current Limitations
- No separation between medical records and show restrictions
- Limited field-level access controls
- No encryption for sensitive medical data
- No consent management system
- Insufficient audit logging for medical data access

---

## Data Protection Strategy Options

### 1. Data Segregation Approach

**Concept**: Separate sensitive medical information from show-related operational data.

#### Proposed Architecture

**Medical Records Table** (Highly Restricted)
- Patient medical history
- Diagnoses and treatment details
- Medical provider notes
- Prescription information
- Therapy/rehabilitation plans
- Medical attachments (X-rays, MRI scans, doctor's notes)
- **Access**: PWD staff only

**Show Restrictions Table** (Operational - Already Exists)
- Artist reference
- Restriction type (hard/soft)
- Affected scope (positions, scenes, acts)
- Validity period (start/end dates)
- General note: "Medical restriction - Contact PWD"
- **Access**: Stage Management, PWD staff, Admins

**Junction/Link Table**
- Links medical records to show restrictions
- One medical record can generate multiple restrictions
- Maintains referential integrity while keeping data separate

#### Benefits
- Clear separation of concerns
- Stage Managers get operational data without PHI exposure
- Medical staff maintain complete medical context
- Easier to audit and comply with regulations

---

### 2. Access Control Layers

#### Row-Level Security (RLS)

**Implementation Options**:

1. **Organizational Hierarchy**
   - PWD Lead: Full access to all medical records
   - PWD Staff: Access only to assigned artists
   - Stage Management: No access to medical records
   - Artists: Self-access only (with consent)

2. **Department-Based**
   - Segment by artistic department or show
   - PWD staff assigned to specific departments
   - Cross-department access requires elevation

3. **Case-Based Assignment**
   - Artists explicitly assigned to PWD staff members
   - Temporary assignments for specific treatments
   - Automatic access revocation when case closes

#### Field-Level Masking

**Stage Management View**:
```json
{
  "artistName": "John Doe",
  "restrictionType": "hard",
  "affectedPositions": ["Pearl Girl Act 1", "Aerial Silk"],
  "validFrom": "2025-11-15",
  "validUntil": "2025-12-31",
  "reason": "Medical restriction - Contact PWD for details",
  "contactPWD": "Dr. Smith"
}
```

**PWD Staff View** (Full Access):
```json
{
  "artistName": "John Doe",
  "diagnosis": "Rotator cuff strain - Grade 2",
  "treatment": "Physical therapy 3x/week, anti-inflammatory",
  "restrictions": "No overhead lifting, no aerial work",
  "affectedPositions": ["Pearl Girl Act 1", "Aerial Silk"],
  "validFrom": "2025-11-15",
  "estimatedRecovery": "2025-12-31",
  "medicalNotes": "Athlete responded well to initial treatment...",
  "followUpSchedule": "Weekly assessment",
  "clearanceRequired": true
}
```

#### Hierarchical Permissions Matrix

| Role | View Medical Records | Create Medical Records | Edit Medical Records | Delete Medical Records | View Restrictions | Manage Restrictions |
|------|---------------------|----------------------|---------------------|----------------------|------------------|-------------------|
| **Admin** | All | All | All | All | All | All |
| **PWD Lead** | All | All | All | All | All | All |
| **PWD Staff** | Assigned Only | Assigned Only | Assigned Only | No | Assigned Only | Assigned Only |
| **Stage Management** | No | No | No | No | Yes | No |
| **Artist** | Self Only | No | No | No | Self Only | No |
| **Read-Only** | No | No | No | No | Yes | No |

---

### 3. Encryption Options

#### At-Rest Encryption

**Database-Level**
- PostgreSQL native transparent data encryption (TDE)
- Encrypts entire database files
- Managed at infrastructure level
- **Pros**: Comprehensive, no code changes
- **Cons**: All-or-nothing, key management complexity

**Application-Level Encryption**
- Encrypt specific sensitive fields before storing
- Use libraries like `crypto` (Node.js native) or `bcrypt` for field encryption
- Each sensitive field encrypted with application key
- **Pros**: Granular control, selective encryption
- **Cons**: Code complexity, key rotation challenges

**Recommended Approach**: Hybrid
```javascript
// Encrypt sensitive medical fields
const encryptedData = {
  diagnosis: encrypt(data.diagnosis),
  treatmentPlan: encrypt(data.treatmentPlan),
  medicalNotes: encrypt(data.medicalNotes),
  // Non-sensitive fields remain unencrypted for querying
  artistId: data.artistId,
  createdAt: data.createdAt,
  validFrom: data.validFrom
}
```

#### In-Transit Encryption

- **HTTPS/TLS**: Already standard with Replit deployment
- **WebSocket Encryption**: Ensure WSS (WebSocket Secure) for real-time updates
- **API Authentication**: Token-based with short expiration
- **Session Security**: HTTP-only cookies, CSRF protection

#### Key Management

**Options**:

1. **Environment Variables** (Current)
   - Simple implementation
   - Suitable for single-key scenarios
   - Risk: Key exposure in logs or errors

2. **Replit Secrets** (Recommended)
   - Integrated secrets management
   - Automatic injection into environment
   - Better security than plain env vars

3. **External Key Management Service** (Enterprise)
   - AWS KMS, Azure Key Vault, HashiCorp Vault
   - Centralized key rotation
   - Audit logging for key access
   - Compliance-ready

**Recommended for Borealis**: Replit Secrets with periodic manual rotation

---

### 4. Audit Trail & Compliance

#### Audit Logging Requirements

**Medical Data Access Logging**:
- Who accessed the record (user ID + name)
- When accessed (timestamp with timezone)
- What was accessed (record ID, fields viewed)
- Why accessed (optional: case reference, purpose)
- How accessed (read, edit, export, print)
- Access result (success, denied, partial)

**Enhanced Audit Trail Schema**:
```typescript
{
  id: string,
  entityType: 'medical_record' | 'restriction' | 'consent',
  entityId: string,
  userId: string,
  userRole: 'admin' | 'performance_wellness' | 'stage_management',
  action: 'viewed' | 'created' | 'updated' | 'deleted' | 'exported' | 'printed',
  fieldsAccessed: string[], // ['diagnosis', 'treatmentPlan']
  ipAddress: string,
  userAgent: string,
  accessGranted: boolean,
  denialReason?: string,
  metadata: object, // Additional context
  createdAt: timestamp
}
```

#### Compliance Considerations

**HIPAA Compliance** (If applicable to US operations)
- Minimum necessary standard
- Business Associate Agreements (BAAs)
- Breach notification procedures
- Right to access and amendment
- De-identification for analytics

**UAE Data Protection Laws**
- Federal Decree-Law No. 45 of 2021
- Personal data processing consent
- Cross-border transfer restrictions
- Data subject rights (access, rectification, deletion)
- Data Protection Officer designation

**GDPR** (If applicable to EU performers)
- Lawful basis for processing (consent, contract, legitimate interest)
- Data minimization
- Right to erasure ("right to be forgotten")
- Data portability
- Privacy by design

**Retention Policies**:
- Active medical records: Duration of employment + 7 years
- Restrictions: As long as operationally relevant
- Audit logs: 7 years minimum
- Consent records: Duration of employment + 7 years

---

### 5. Dual-View Architecture

#### PWD Staff Interface (Full Access)

**Features**:
- Complete medical history timeline
- Treatment plan management
- Medication tracking
- Provider contact information
- Medical document attachments (PDFs, images)
- Restriction recommendation engine
- Clearance workflow management
- Progress notes and assessments

**UI Components**:
- Secure medical record viewer
- Rich text editor for clinical notes
- File upload with encryption
- Print with watermark ("Confidential Medical Record")
- Export with audit logging

#### Stage Management Interface (Limited/Operational)

**Features**:
- Artist restriction overview
- Restriction type and severity
- Affected positions/scenes/acts
- Validity timeline
- PWD contact for questions
- No medical details exposed

**UI Components**:
- Restriction cards with visual indicators
- Calendar view of restriction periods
- Lineup conflict warnings
- "Contact PWD" action button
- Read-only access only

#### Artist Self-Service Interface

**Features**:
- View own medical records (with consent)
- See current restrictions
- Request medical appointments
- Update personal health information
- Consent management preferences

**Privacy Controls**:
- Opt-in to self-access
- Activity notifications (email when record accessed)
- Download personal data (GDPR compliance)

---

### 6. Consent Management System

#### Consent Types

1. **Data Collection Consent**
   - Initial consent to collect medical information
   - Purpose: Occupational health and safety
   - Required for employment

2. **Treatment Consent**
   - Consent for medical treatment/interventions
   - Separate from data collection
   - Revocable at any time

3. **Information Sharing Consent**
   - Sharing with Stage Management (restrictions only)
   - Sharing with emergency contacts
   - Sharing with external providers
   - Granular: Artist can limit what's shared

4. **Data Retention Consent**
   - How long data is kept
   - Post-employment data handling
   - Archival vs. deletion options

#### Consent Tracking Schema

```typescript
{
  id: string,
  artistId: string,
  consentType: 'data_collection' | 'treatment' | 'information_sharing' | 'retention',
  granted: boolean,
  grantedAt: timestamp,
  revokedAt?: timestamp,
  scope: {
    shareWithStageManagement: boolean,
    shareWithEmergencyContacts: boolean,
    shareWithExternalProviders: boolean,
    allowSelfAccess: boolean
  },
  signatureData: string, // Digital signature
  witnessedBy?: string, // User ID of witness
  expiresAt?: timestamp,
  notes: string
}
```

#### Consent Workflow

1. Artist signs consent form (digital signature)
2. System records consent with timestamp
3. Consent status checked before any data access
4. Artist can view/modify consent at any time
5. Revocation triggers data access restrictions
6. Audit trail logs all consent changes

---

## Recommended Implementation Path

### Phase 1: Foundation (Weeks 1-2)

**Database Schema**:
1. Create `artist_medical_records` table with encryption
2. Create `medical_record_restrictions` junction table
3. Enhance `pwd_restrictions` table (remove sensitive fields)
4. Create `medical_consents` table
5. Enhance `audit_trail` with medical-specific fields

**Backend Infrastructure**:
1. Implement field-level encryption utilities
2. Create medical record service layer
3. Build consent management service
4. Enhance audit logging for medical data
5. Add middleware for medical data access control

### Phase 2: Access Control (Weeks 3-4)

**Authorization**:
1. Implement row-level security logic
2. Create role-based permission helpers
3. Build field-masking utilities
4. Add API route protection
5. Implement consent checking middleware

**API Routes**:
- `POST /api/medical-records` - Create medical record (PWD only)
- `GET /api/medical-records/:id` - Get record (with access check)
- `PUT /api/medical-records/:id` - Update record (PWD only)
- `GET /api/restrictions` - Get restrictions (filtered by role)
- `POST /api/restrictions` - Create restriction (PWD only)
- `GET /api/medical-consents/:artistId` - Get consent status
- `POST /api/medical-consents` - Record consent
- `PUT /api/medical-consents/:id/revoke` - Revoke consent

### Phase 3: User Interfaces (Weeks 5-6)

**PWD Interface**:
1. Medical records dashboard
2. Artist medical profile page
3. Restriction creation from medical record
4. Consent management interface
5. Audit log viewer (PWD access only)

**Stage Management Interface**:
1. Enhanced lineup with restriction warnings
2. Artist restriction summary cards
3. Contact PWD functionality
4. Restriction timeline view

**Artist Interface**:
1. Self-service medical record viewer
2. Consent management preferences
3. Download personal data feature
4. Activity log viewer

### Phase 4: Compliance & Security (Weeks 7-8)

**Security Hardening**:
1. Penetration testing for medical data routes
2. Encryption key rotation procedures
3. Backup and disaster recovery for medical data
4. Secure export/print with watermarking
5. Rate limiting on medical data endpoints

**Compliance**:
1. Privacy policy updates
2. Data retention automation
3. Breach notification procedures
4. Data subject rights handling (access, rectification, deletion)
5. Training documentation for PWD staff

### Phase 5: Testing & Deployment (Week 9)

**Testing**:
1. Unit tests for encryption/decryption
2. Integration tests for access control
3. End-to-end tests for PWD workflows
4. Security audit
5. User acceptance testing with PWD staff

**Deployment**:
1. Database migration (with backup)
2. Feature flag for gradual rollout
3. PWD staff training sessions
4. Monitoring and alerting setup
5. Incident response plan

---

## Technical Specifications

### Database Schema (Detailed)

#### artist_medical_records
```sql
CREATE TABLE artist_medical_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id VARCHAR NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  record_type VARCHAR NOT NULL, -- 'diagnosis', 'treatment', 'assessment', 'clearance'
  record_date DATE NOT NULL,
  
  -- Encrypted fields
  diagnosis_encrypted TEXT,
  treatment_plan_encrypted TEXT,
  medical_notes_encrypted TEXT,
  provider_notes_encrypted TEXT,
  
  -- Non-encrypted operational fields
  severity VARCHAR, -- 'minor', 'moderate', 'severe'
  status VARCHAR NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'ongoing'
  follow_up_required BOOLEAN DEFAULT false,
  next_assessment_date DATE,
  
  -- Provider information
  provider_name TEXT,
  provider_contact TEXT,
  external_provider BOOLEAN DEFAULT false,
  
  -- Attachments
  attachment_urls TEXT[], -- Encrypted file URLs
  
  -- Access control
  assigned_pwd_staff_id VARCHAR REFERENCES users(id),
  clearance_required BOOLEAN DEFAULT false,
  cleared_by VARCHAR REFERENCES users(id),
  cleared_at TIMESTAMP,
  
  -- Audit
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete for compliance
  
  -- Indexes for performance
  INDEX idx_artist_medical_records_artist (artist_id),
  INDEX idx_artist_medical_records_status (status),
  INDEX idx_artist_medical_records_date (record_date)
);
```

#### medical_record_restrictions (Junction Table)
```sql
CREATE TABLE medical_record_restrictions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id VARCHAR NOT NULL REFERENCES artist_medical_records(id) ON DELETE CASCADE,
  restriction_id VARCHAR NOT NULL REFERENCES pwd_restrictions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(medical_record_id, restriction_id)
);
```

#### medical_consents
```sql
CREATE TABLE medical_consents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id VARCHAR NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  consent_type VARCHAR NOT NULL, -- 'data_collection', 'treatment', 'information_sharing', 'retention'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP,
  
  -- Scope (JSON for flexibility)
  scope_json TEXT, -- Stores JSON with sharing preferences
  
  -- Digital signature
  signature_data TEXT,
  ip_address VARCHAR,
  user_agent TEXT,
  
  -- Witness
  witnessed_by VARCHAR REFERENCES users(id),
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_medical_consents_artist (artist_id),
  INDEX idx_medical_consents_type (consent_type)
);
```

#### Enhanced pwd_restrictions (Modified)
```sql
-- Remove sensitive medical fields, keep only operational data
ALTER TABLE pwd_restrictions 
  DROP COLUMN IF EXISTS reason, -- Remove medical reason
  DROP COLUMN IF EXISTS notes, -- Remove medical notes
  ADD COLUMN contact_pwd VARCHAR REFERENCES users(id), -- PWD contact for inquiries
  ADD COLUMN general_note TEXT; -- Non-medical operational note
```

### Encryption Implementation

```typescript
// server/utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MEDICAL_DATA_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16; // AES block size

export function encryptField(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Store IV with encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptField(encryptedText: string): string {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Field-level encryption middleware
export function encryptMedicalFields(record: any) {
  return {
    ...record,
    diagnosis_encrypted: record.diagnosis ? encryptField(record.diagnosis) : null,
    treatment_plan_encrypted: record.treatmentPlan ? encryptField(record.treatmentPlan) : null,
    medical_notes_encrypted: record.medicalNotes ? encryptField(record.medicalNotes) : null,
    provider_notes_encrypted: record.providerNotes ? encryptField(record.providerNotes) : null,
  };
}

export function decryptMedicalFields(record: any) {
  return {
    ...record,
    diagnosis: record.diagnosis_encrypted ? decryptField(record.diagnosis_encrypted) : null,
    treatmentPlan: record.treatment_plan_encrypted ? decryptField(record.treatment_plan_encrypted) : null,
    medicalNotes: record.medical_notes_encrypted ? decryptField(record.medical_notes_encrypted) : null,
    providerNotes: record.provider_notes_encrypted ? decryptField(record.provider_notes_encrypted) : null,
  };
}
```

### Access Control Middleware

```typescript
// server/middleware/medicalAuth.ts
import { Request, Response, NextFunction } from 'express';

// Check if user can access medical records
export async function canAccessMedicalRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  const recordId = req.params.id;
  
  // Admin always has access
  if (user.role === 'admin') {
    return next();
  }
  
  // PWD staff check
  if (user.role === 'performance_wellness') {
    const record = await getMedicalRecord(recordId);
    
    // Check if assigned to this staff member or is PWD lead
    if (record.assigned_pwd_staff_id === user.id || await isPWDLead(user.id)) {
      return next();
    }
  }
  
  // Artist self-access
  if (user.role === 'artist') {
    const record = await getMedicalRecord(recordId);
    const consent = await getConsent(record.artist_id, 'information_sharing');
    
    if (record.artist_id === user.artistId && consent?.scope?.allowSelfAccess) {
      // Return masked data for artist
      req.maskedAccess = true;
      return next();
    }
  }
  
  return res.status(403).json({ error: 'Access denied to medical records' });
}

// Enhanced audit logging for medical data access
export function auditMedicalAccess(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const recordId = req.params.id;
    
    await createAuditLog({
      entityType: 'medical_record',
      entityId: recordId,
      userId: user.id,
      userRole: user.role,
      action,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      accessGranted: true,
      metadata: {
        method: req.method,
        path: req.path,
      }
    });
    
    next();
  };
}
```

---

## Security Checklist

### Pre-Implementation
- [ ] Data classification completed (PHI vs operational data)
- [ ] Compliance requirements identified (HIPAA, UAE laws, GDPR)
- [ ] Encryption key management strategy defined
- [ ] Backup and disaster recovery plan created
- [ ] Privacy policy updated
- [ ] PWD staff training materials prepared

### During Implementation
- [ ] Database encryption configured
- [ ] Application-level field encryption implemented
- [ ] Access control middleware tested
- [ ] Audit logging verified for all medical data access
- [ ] Consent management system functional
- [ ] Role-based permissions enforced
- [ ] Field-level masking working correctly
- [ ] API routes secured with authentication
- [ ] Rate limiting configured

### Post-Implementation
- [ ] Penetration testing completed
- [ ] Security audit passed
- [ ] Compliance review completed
- [ ] PWD staff trained
- [ ] Incident response plan documented
- [ ] Monitoring and alerting active
- [ ] Backup restoration tested
- [ ] Key rotation procedure documented
- [ ] Data retention automation verified
- [ ] User acceptance testing passed

---

## Risk Assessment & Mitigation

### Risk 1: Unauthorized Access to Medical Records
**Likelihood**: Medium | **Impact**: Critical
- **Mitigation**: Multi-layer access control, audit logging, encryption
- **Detection**: Real-time access monitoring, anomaly detection
- **Response**: Immediate access revocation, breach investigation

### Risk 2: Data Breach / Exposure
**Likelihood**: Low | **Impact**: Critical
- **Mitigation**: Encryption at rest and in transit, secure key management
- **Detection**: Intrusion detection, unusual access patterns
- **Response**: Breach notification protocol, forensic investigation

### Risk 3: Insider Threat
**Likelihood**: Low | **Impact**: High
- **Mitigation**: Need-to-know access, comprehensive audit trails
- **Detection**: Access pattern analysis, peer review of sensitive access
- **Response**: Investigation, access revocation, legal action

### Risk 4: Compliance Violation
**Likelihood**: Medium | **Impact**: High
- **Mitigation**: Regular compliance audits, automated retention policies
- **Detection**: Compliance monitoring, regular reviews
- **Response**: Remediation plan, regulatory reporting if required

### Risk 5: Key Management Failure
**Likelihood**: Low | **Impact**: Critical
- **Mitigation**: Secure key storage, backup keys in escrow, rotation procedures
- **Detection**: Key health checks, access monitoring
- **Response**: Key rotation, encrypted backup restoration

---

## Future Enhancements

### Advanced Features (Post-MVP)
1. **AI-Powered Restriction Suggestions**
   - ML model suggests restrictions based on diagnosis
   - Historical pattern analysis
   - Automated lineup conflict detection

2. **Telemedicine Integration**
   - Video consultation scheduling
   - Remote assessments
   - Digital prescription management

3. **Wearable Device Integration**
   - Real-time health monitoring
   - Injury risk prediction
   - Performance metrics correlation

4. **Analytics Dashboard**
   - Injury trends and patterns
   - Recovery time analysis
   - Department-specific health metrics
   - De-identified reporting for management

5. **External Provider Portal**
   - Secure portal for external doctors
   - Lab result uploads
   - Treatment plan collaboration
   - Clearance workflow

---

## Conclusion

This comprehensive data protection strategy provides a roadmap for securely implementing medical information management within Borealis while maintaining operational efficiency for Stage Management.

**Key Principles**:
- **Privacy First**: Sensitive medical data separated from operational restrictions
- **Need-to-Know Access**: Role-based access with granular permissions
- **Audit Everything**: Comprehensive logging of all medical data access
- **Compliance Ready**: HIPAA, GDPR, UAE law considerations built-in
- **User-Centric**: Clear consent management and artist self-access

**Next Steps**:
1. Review and approve this strategy document
2. Prioritize features based on immediate needs
3. Begin Phase 1 implementation (Foundation)
4. Iterative deployment with PWD staff feedback
5. Continuous security monitoring and improvement

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Author**: Borealis Development Team  
**Review Required**: PWD Lead, System Administrator, Legal/Compliance

---

## Appendix: Reference Links

### Compliance Resources
- HIPAA Privacy Rule: https://www.hhs.gov/hipaa/for-professionals/privacy/
- UAE Federal Decree-Law No. 45 of 2021: https://u.ae/en/about-the-uae/digital-uae/data-protection
- GDPR Official Text: https://gdpr-info.eu/

### Technical Resources
- Node.js Crypto Module: https://nodejs.org/api/crypto.html
- PostgreSQL Encryption: https://www.postgresql.org/docs/current/encryption-options.html
- OWASP Security Guidelines: https://owasp.org/

### Internal Documentation
- `replit.md` - System architecture overview
- `shared/schema.ts` - Database schema definitions
- `server/middleware/roleAuth.ts` - Current authorization middleware
