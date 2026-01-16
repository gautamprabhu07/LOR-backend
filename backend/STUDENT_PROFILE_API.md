# Student Profile Management - Backend Implementation Guide

## Overview

This implementation provides complete backend support for student profile management including:

- Employment status tracking (employed/studying/unemployed)
- Target universities (max 5) with program details and deadlines
- Certificates (max 5) with type categorization
- File uploads for certificates
- Draft LOR uploads with faculty comments

## API Endpoints

### Base URL

All endpoints are prefixed with `/api/student/profile`

### Authentication

All endpoints require:

- `auth` middleware (valid session cookie)
- `requireRole("student", "alumni")` middleware

---

## 1. Profile Endpoints

### GET /api/student/profile

Get complete student profile including employment, targets, and certificates.

**Response:**

```json
{
  "status": "success",
  "data": {
    "userId": "64abc...",
    "registrationNumber": "CS2021001",
    "isAlumni": false,
    "department": "Computer Science",
    "verificationStatus": "verified",
    "employment": {
      "status": "studying",
      "university": "Example University",
      "course": "Computer Science"
    },
    "targetUniversities": [
      {
        "_id": "64def...",
        "university": "MIT",
        "program": "MS Computer Science",
        "deadline": "2026-12-31T23:59:59.999Z",
        "purpose": "Graduate studies in AI"
      }
    ],
    "certificates": [
      {
        "_id": "64ghi...",
        "type": "GRE",
        "fileId": {
          "_id": "64jkl...",
          "originalName": "gre_score.pdf",
          "mimeType": "application/pdf",
          "size": 123456,
          "uploadedAt": "2026-01-10T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

## 2. Employment Endpoints

### GET /api/student/profile/employment

Get current employment status.

**Response:**

```json
{
  "status": "success",
  "data": {
    "status": "employed",
    "company": "Tech Corp",
    "role": "Software Engineer"
  }
}
```

### PATCH /api/student/profile/employment

Update employment status.

**Request Body:**

```json
// For employed status:
{
  "status": "employed",
  "company": "Tech Corp",
  "role": "Software Engineer"
}

// For studying status:
{
  "status": "studying",
  "university": "Example University",
  "course": "Computer Science"
}

// For unemployed status:
{
  "status": "unemployed",
  "remarks": "Looking for opportunities in AI/ML"
}
```

**Validation:**

- `status`: Required, must be "employed" | "studying" | "unemployed"
- When `employed`: `company` and `role` are required
- When `studying`: `university` and `course` are required
- When `unemployed`: `remarks` is optional
- Max lengths: company/role/university/course: 200 chars, remarks: 500 chars

**Response:**

```json
{
  "status": "success",
  "data": {
    "status": "employed",
    "company": "Tech Corp",
    "role": "Software Engineer"
  }
}
```

---

## 3. Target Universities Endpoints

### GET /api/student/profile/targets

Get all target universities (max 5).

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64abc...",
      "university": "MIT",
      "program": "MS Computer Science",
      "deadline": "2026-12-31T23:59:59.999Z",
      "purpose": "Graduate studies in AI"
    }
  ]
}
```

### POST /api/student/profile/targets

Add a new target university.

**Request Body:**

```json
{
  "university": "Stanford University",
  "program": "MS Computer Science",
  "deadline": "2026-12-15T23:59:59.999Z",
  "purpose": "Research in machine learning"
}
```

**Validation:**

- All fields are required
- `university`: 1-200 chars
- `program`: 1-200 chars
- `deadline`: ISO 8601 datetime string or Date object
- `purpose`: 1-500 chars
- Maximum 5 universities allowed (returns 400 if limit exceeded)

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "_id": "64def...",
    "university": "Stanford University",
    "program": "MS Computer Science",
    "deadline": "2026-12-15T23:59:59.999Z",
    "purpose": "Research in machine learning"
  }
}
```

**Error (400):**

```json
{
  "status": "error",
  "message": "Maximum 5 target universities allowed"
}
```

### DELETE /api/student/profile/targets/:targetId

Delete a specific target university.

**Response:**

```json
{
  "status": "success",
  "message": "Target university deleted successfully"
}
```

**Error (404):**

```json
{
  "status": "error",
  "message": "Target university not found"
}
```

---

## 4. Certificates Endpoints

### GET /api/student/profile/certificates

Get all certificates (max 5) with file details.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64abc...",
      "type": "GRE",
      "fileId": {
        "_id": "64def...",
        "originalName": "gre_score.pdf",
        "mimeType": "application/pdf",
        "size": 123456,
        "uploadedAt": "2026-01-10T10:00:00.000Z"
      }
    },
    {
      "_id": "64ghi...",
      "type": "OTHER",
      "comment": "English proficiency certificate",
      "fileId": {
        "_id": "64jkl...",
        "originalName": "english_cert.pdf",
        "mimeType": "application/pdf",
        "size": 78910,
        "uploadedAt": "2026-01-12T14:30:00.000Z"
      }
    }
  ]
}
```

### POST /api/student/profile/certificates

Add a new certificate.

**Prerequisites:**

1. Upload file using `POST /api/files/upload` first
2. Get the `fileId` from upload response
3. Use that `fileId` in this request

**Request Body:**

```json
// For standard types (GRE, GMAT, CAT, MAT):
{
  "type": "GRE",
  "fileId": "64abc123..."
}

// For OTHER type (comment required):
{
  "type": "OTHER",
  "fileId": "64def456...",
  "comment": "English proficiency certificate"
}
```

**Validation:**

- `type`: Required, must be "GRE" | "GMAT" | "CAT" | "MAT" | "OTHER"
- `fileId`: Required, must be valid file ID that belongs to current user
- `comment`: Optional for standard types, **required** for "OTHER" type (max 500 chars)
- Maximum 5 certificates allowed
- File must exist and belong to current student

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "_id": "64mno...",
    "type": "GRE",
    "fileId": "64abc123..."
  }
}
```

**Errors:**

```json
// Max limit exceeded (400):
{
  "status": "error",
  "message": "Maximum 5 certificates allowed"
}

// Comment required for OTHER (400):
{
  "status": "error",
  "message": "Comment is required for certificate type OTHER"
}

// File not found or not owned (403):
{
  "status": "error",
  "message": "File not found or you don't have permission to access it"
}
```

### DELETE /api/student/profile/certificates/:certificateId

Delete a specific certificate.

**Response:**

```json
{
  "status": "success",
  "message": "Certificate deleted successfully"
}
```

**Error (404):**

```json
{
  "status": "error",
  "message": "Certificate not found"
}
```

---

## 5. File Upload Endpoints

### POST /api/files/upload

Upload a general file (for certificates).

**Authentication:** `auth` + `requireRole("student", "alumni")`

**Content-Type:** `multipart/form-data`

**Form Data:**

- `file`: PDF, DOC, or DOCX file (max 5 MB)

**Rate Limit:** 10 uploads per IP per 15 minutes

**Allowed MIME Types:**

- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "fileId": "64abc123...",
    "originalName": "gre_score.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "uploadedAt": "2026-01-10T10:00:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:4000/api/files/upload \
  -H "Cookie: sessionId=abc123..." \
  -F "file=@/path/to/certificate.pdf"
```

**Errors:**

```json
// No file uploaded (400):
{
  "status": "error",
  "message": "No file uploaded"
}

// Invalid file type:
{
  "status": "error",
  "message": "Invalid file type. Only PDF, DOC, and DOCX allowed."
}

// File too large:
{
  "status": "error",
  "message": "File too large. Maximum size is 5 MB."
}
```

### POST /api/files/upload-draft/:submissionId

Upload draft LOR for a submission (already implemented).

**Authentication:** `auth` + `requireRole("student", "alumni")`

**Prerequisites:**

- Submission must exist and belong to current student
- Submission status must be "submitted" or "resubmission"

**Content-Type:** `multipart/form-data`

**Form Data:**

- `file`: PDF, DOC, or DOCX file (max 5 MB)

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "fileId": "64xyz...",
    "version": 2,
    "originalName": "draft_v2.pdf",
    "size": 234567,
    "uploadedAt": "2026-01-15T08:30:00.000Z"
  }
}
```

---

## 6. Submission Endpoints (Context)

### POST /api/submissions

Create a new LOR submission request.

**Request Body:**

```json
{
  "facultyId": "64abc...",
  "deadline": "2026-02-28T23:59:59.999Z",
  "universityName": "MIT",
  "purpose": "I am applying for MS in Computer Science. Could you please write a letter highlighting my research work in AI?"
}
```

**Note:** The `purpose` field serves as the comment that appears to faculty. It's already visible in faculty dashboard endpoints.

---

## Frontend Integration Flow

### 1. Employment Status Update

```typescript
// GET current status
const response = await fetch("/api/student/profile/employment", {
  credentials: "include",
});

// PATCH to update
await fetch("/api/student/profile/employment", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    status: "employed",
    company: "Tech Corp",
    role: "Software Engineer",
  }),
});
```

### 2. Add Target University

```typescript
await fetch("/api/student/profile/targets", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    university: "Stanford",
    program: "MS CS",
    deadline: new Date("2026-12-31").toISOString(),
    purpose: "Graduate studies",
  }),
});
```

### 3. Upload and Add Certificate

```typescript
// Step 1: Upload file
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const uploadRes = await fetch("/api/files/upload", {
  method: "POST",
  credentials: "include",
  body: formData,
});

const {
  data: { fileId },
} = await uploadRes.json();

// Step 2: Link to profile
await fetch("/api/student/profile/certificates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    type: "GRE",
    fileId: fileId,
  }),
});
```

### 4. Create LOR Request with Draft

```typescript
// Step 1: Create submission
const subRes = await fetch("/api/submissions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    facultyId: "64abc...",
    deadline: "2026-02-28T23:59:59Z",
    purpose: "This comment will be visible to faculty",
  }),
});

const {
  data: { id: submissionId },
} = await subRes.json();

// Step 2: Upload draft (optional)
const draftData = new FormData();
draftData.append("file", draftFile);

await fetch(`/api/files/upload-draft/${submissionId}`, {
  method: "POST",
  credentials: "include",
  body: draftData,
});
```

---

## Database Schema Changes

### StudentProfile Model

```typescript
interface IStudentProfileDocument {
  // ... existing fields ...

  // NEW: Employment tracking
  employment: {
    status: "employed" | "studying" | "unemployed";
    company?: string; // Required when employed
    role?: string; // Required when employed
    university?: string; // Required when studying
    course?: string; // Required when studying
    remarks?: string; // Optional when unemployed
  };

  // UPDATED: Target universities (max 5, enhanced fields)
  targetUniversities: {
    _id: ObjectId; // NEW: Stable ID for deletion
    university: string; // RENAMED from 'name'
    program: string; // NEW: Degree program
    deadline: Date; // NEW: LOR deadline
    purpose: string; // NEW: Application purpose
  }[];

  // NEW: Certificates (max 5)
  certificates: {
    _id: ObjectId;
    type: "GRE" | "GMAT" | "CAT" | "MAT" | "OTHER";
    fileId: ObjectId; // References File model
    comment?: string; // Required for type "OTHER"
  }[];
}
```

### File Model (Updated)

```typescript
interface IFileDocument {
  submissionId?: ObjectId; // Optional (for certificates)
  studentId?: ObjectId; // Used for certificate ownership
  type: "draft" | "final" | "certificate";
  // ... other fields ...
}
```

---

## Security & Validation

### Ownership Checks

- All endpoints validate `userId` from session matches profile owner
- File uploads check `studentId` matches current user's profile
- Certificate linking verifies file ownership before linking

### Limits

- Target universities: Max 5 (enforced in schema + service)
- Certificates: Max 5 (enforced in schema + service)
- File size: 5 MB
- Text fields: Various limits (200-500 chars)

### Rate Limiting

- File uploads: 10 per IP per 15 minutes
- File downloads: 50 per IP per 5 minutes

---

## Testing Checklist

### Employment

- [ ] GET empty employment returns default "studying"
- [ ] PATCH with employed status requires company + role
- [ ] PATCH with studying status requires university + course
- [ ] PATCH with unemployed allows optional remarks
- [ ] Invalid status returns 400 error

### Target Universities

- [ ] GET returns empty array initially
- [ ] POST adds university successfully (up to 5)
- [ ] POST with 6th university returns 400 error
- [ ] DELETE removes university by ID
- [ ] DELETE non-existent returns 404
- [ ] Deadline accepts ISO datetime strings

### Certificates

- [ ] GET returns empty array initially
- [ ] POST with non-existent fileId returns 403
- [ ] POST with file owned by other user returns 403
- [ ] POST with type OTHER requires comment
- [ ] POST adds certificate successfully (up to 5)
- [ ] POST with 6th certificate returns 400 error
- [ ] DELETE removes certificate by ID

### File Uploads

- [ ] POST /api/files/upload accepts PDF/DOC/DOCX
- [ ] POST rejects invalid file types
- [ ] POST rejects files > 5 MB
- [ ] Uploaded file can be linked to certificate
- [ ] Rate limiting blocks after 10 uploads

---

## Common Error Responses

```json
// 400 Bad Request
{
  "status": "error",
  "message": "Maximum 5 target universities allowed"
}

// 403 Forbidden
{
  "status": "error",
  "message": "File not found or you don't have permission to access it"
}

// 404 Not Found
{
  "status": "error",
  "message": "Student profile not found"
}

// 422 Validation Error (Zod)
{
  "status": "error",
  "message": "Validation error",
  "errors": [
    {
      "field": "university",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

---

## Files Created/Modified

### New Files

1. `src/modules/studentProfiles/studentProfile.service.ts` - Business logic
2. `src/modules/studentProfiles/studentProfile.controller.ts` - Request handlers with Zod validation
3. `src/modules/studentProfiles/studentProfile.routes.ts` - Route definitions

### Modified Files

1. `src/modules/studentProfiles/studentProfile.model.ts` - Extended with employment, updated targets, added certificates
2. `src/modules/files/file.controller.ts` - Added general file upload endpoint
3. `src/modules/files/file.routes.ts` - Added /upload route
4. `src/app.ts` - Wired student profile routes

---

## Next Steps for Frontend

1. **Employment Section**

   - Radio buttons for status selection
   - Conditional form fields based on status
   - Submit button to PATCH endpoint

2. **Target Universities Section**

   - List view with delete buttons
   - Add form with all 4 fields
   - Max 5 validation in UI
   - Date picker for deadline

3. **Certificates Section**

   - Dropdown for certificate type
   - File upload button
   - Conditional comment field for "OTHER"
   - List view with delete buttons
   - Max 5 validation in UI

4. **Create LOR Page**
   - Faculty dropdown (from existing faculty list endpoint)
   - Optional draft upload
   - Purpose/comment textarea (visible to faculty)
   - Deadline picker

All backend endpoints are production-ready and type-safe with comprehensive validation!
