# File Upload/Download System - Testing Guide

## Overview

Complete file management system for LoR submissions with draft versioning and final LoR upload.

## API Endpoints

### 1. Upload Draft (Student/Alumni)

**POST** `/api/files/upload-draft/:submissionId`

**Headers:**

- `Authorization: Bearer <student_token>`
- `Content-Type: multipart/form-data`

**Body (form-data):**

- `file`: (file) - Select a PDF, DOC, or DOCX file (max 5 MB)

**Requirements:**

- Must be submission owner
- Submission status must be `submitted` or `resubmission`
- Auto-increments version number (1, 2, 3...)
- Updates `submission.currentVersion`

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "507f1f77bcf86cd799439011",
    "version": 2,
    "originalName": "draft_lor_v2.pdf",
    "size": 245678,
    "uploadedAt": "2026-01-14T10:30:00.000Z"
  }
}
```

---

### 2. Upload Final LoR (Faculty)

**POST** `/api/files/upload-final/:submissionId`

**Headers:**

- `Authorization: Bearer <faculty_token>`
- `Content-Type: multipart/form-data`

**Body (form-data):**

- `file`: (file) - Select a PDF, DOC, or DOCX file (max 5 MB)

**Requirements:**

- Must be assigned faculty for submission
- Submission status must be `approved`
- Only ONE final file allowed per submission
- Auto-transitions submission to `completed` status

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "507f1f77bcf86cd799439012",
    "originalName": "final_lor_john_doe.pdf",
    "size": 187234,
    "uploadedAt": "2026-01-14T11:00:00.000Z"
  }
}
```

---

### 3. Download File

**GET** `/api/files/:fileId/download`

**Headers:**

- `Authorization: Bearer <token>`

**Requirements:**

- Must be submission owner (student) OR assigned faculty OR admin
- Returns file stream with proper download headers

**Example:**

```
GET /api/files/507f1f77bcf86cd799439011/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

- Status: 200
- Headers: `Content-Type`, `Content-Disposition: attachment`, `Content-Length`
- Body: File stream

---

### 4. List Submission Files

**GET** `/api/files/submission/:submissionId`

**Headers:**

- `Authorization: Bearer <token>`

**Requirements:**

- Must be submission owner OR assigned faculty OR admin

**Example Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "draft",
      "version": 1,
      "originalName": "draft_v1.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "createdAt": "2026-01-14T09:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "draft",
      "version": 2,
      "originalName": "draft_v2.pdf",
      "mimeType": "application/pdf",
      "size": 245678,
      "createdAt": "2026-01-14T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "type": "final",
      "version": 1,
      "originalName": "final_lor.pdf",
      "mimeType": "application/pdf",
      "size": 187234,
      "createdAt": "2026-01-14T11:00:00.000Z"
    }
  ]
}
```

---

## Testing Workflow in Postman

### Setup Collection Variables

Create a Postman environment with:

- `BASE_URL`: `http://localhost:3000`
- `STUDENT_TOKEN`: (get from login)
- `FACULTY_TOKEN`: (get from login)
- `SUBMISSION_ID`: (get from create submission)

### Step 1: Login as Student

```
POST {{BASE_URL}}/auth/login
Body (JSON):
{
  "email": "rahul.sharma@mitmanipal.edu",
  "password": "password123"
}

→ Save accessToken to STUDENT_TOKEN
```

### Step 2: Create Submission (Student)

```
POST {{BASE_URL}}/api/submissions
Authorization: Bearer {{STUDENT_TOKEN}}
Body (JSON):
{
  "facultyId": "GET_FROM_DATABASE",
  "deadline": "2026-03-15T23:59:59.000Z",
  "universityName": "MIT",
  "purpose": "MS in Computer Science"
}

→ Save submission._id to SUBMISSION_ID
```

### Step 3: Upload Draft v1 (Student)

```
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Body (form-data):
- file: [Select your PDF file]
```

### Step 4: Upload Draft v2 (Student)

```
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Body (form-data):
- file: [Select another PDF file]
```

### Step 5: Faculty Approves Submission

```
POST {{BASE_URL}}/api/submissions/{{SUBMISSION_ID}}/status
Authorization: Bearer {{FACULTY_TOKEN}}
Body (JSON):
{
  "newStatus": "approved",
  "remark": "Draft looks good, proceeding with final LoR"
}
```

### Step 6: Faculty Uploads Final LoR

```
POST {{BASE_URL}}/api/files/upload-final/{{SUBMISSION_ID}}
Authorization: Bearer {{FACULTY_TOKEN}}
Body (form-data):
- file: [Select final PDF file]

→ This auto-changes submission status to "completed"
```

### Step 7: List All Files

```
GET {{BASE_URL}}/api/files/submission/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}

→ Shows all drafts + final file
```

### Step 8: Download a File

```
GET {{BASE_URL}}/api/files/FILE_ID/download
Authorization: Bearer {{STUDENT_TOKEN}}

→ File downloads with proper name
```

---

## Security Features

### ✅ Implemented

1. **Role-based access control** - Students can only upload drafts, faculty only finals
2. **Ownership validation** - Users can only access their own submission files
3. **Status guards** - Drafts only in submitted/resubmission, finals only in approved
4. **File type validation** - Only PDF, DOC, DOCX allowed
5. **File size limits** - 5 MB maximum
6. **Path traversal prevention** - Storage paths are sanitized
7. **No direct path exposure** - Storage keys never reveal disk paths
8. **Rate limiting** - 10 uploads per 15 min, 50 downloads per 5 min
9. **Version control** - All drafts are preserved with incremental versions
10. **Audit logging** - All uploads are logged with user ID and timestamp

---

## File Storage Structure

```
backend/
└── uploads/
    ├── drafts/
    │   └── {submissionId}/
    │       ├── {uuid-1}.pdf
    │       ├── {uuid-2}.pdf
    │       └── {uuid-3}.pdf
    └── finals/
        └── {submissionId}/
            └── {uuid}.pdf
```

---

## Common Errors & Solutions

### 1. "Student profile not found"

**Cause:** User account exists but StudentProfile document is missing

**Solution:** Run seed script or manually create profile:

```bash
npx tsx seed-test-data.ts
```

### 2. "Cannot upload draft in status: approved"

**Cause:** Trying to upload draft after faculty approved

**Solution:** Only upload drafts when status is `submitted` or `resubmission`

### 3. "Final LoR already uploaded"

**Cause:** Trying to upload multiple final files

**Solution:** Only ONE final file per submission. Delete existing first if needed.

### 4. "Invalid file type"

**Cause:** Trying to upload non-PDF/DOC/DOCX file

**Solution:** Only PDF, DOC, DOCX allowed (max 5 MB)

### 5. "You can only upload files to your own submissions"

**Cause:** Student trying to upload to another student's submission

**Solution:** Only upload to submissions you created

---

## Database Schema

### File Model

```typescript
{
  submissionId: ObjectId,     // Reference to submission
  type: "draft" | "final",    // File type
  version: Number,            // Auto-increment for drafts
  uploadedBy: ObjectId,       // User who uploaded
  storageKey: String,         // Path: "drafts/{id}/uuid.pdf"
  originalName: String,       // User's filename
  mimeType: String,           // application/pdf, etc.
  size: Number,               // Bytes
  createdAt: Date            // Upload timestamp
}
```

---

## Future Enhancements

1. **Cloud Storage** - Swap local storage for AWS S3 / Azure Blob
2. **File Preview** - Add inline PDF preview endpoint
3. **Bulk Download** - Download all files as ZIP
4. **File Expiry** - Auto-delete files after X days
5. **Virus Scanning** - ClamAV integration
6. **Thumbnail Generation** - For PDF preview
7. **Download Analytics** - Track who downloaded what and when

---

## Notes

- Files are **never deleted** - maintains audit trail
- Draft versions are **cumulative** (v1, v2, v3...)
- Final file **triggers submission completion** automatically
- Download is **streamed** - no memory spikes for large files
- All operations are **logged** to console (integrate with proper logger later)
