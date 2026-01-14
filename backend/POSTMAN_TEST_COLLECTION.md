# Postman Collection - LOR File Upload System

## Quick Test Collection

### Collection Variables

Set these in Postman Environment:

- `BASE_URL`: http://localhost:3000
- `STUDENT_EMAIL`: rahul.sharma@mitmanipal.edu
- `FACULTY_EMAIL`: prof.anita.gupta@mitmanipal.edu
- `PASSWORD`: password123

---

## 1. Student Login

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "{{STUDENT_EMAIL}}",
  "password": "{{PASSWORD}}"
}
```

**Save to variable:**

- Response: `accessToken` → Variable: `STUDENT_TOKEN`

---

## 2. Faculty Login

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "{{FACULTY_EMAIL}}",
  "password": "{{PASSWORD}}"
}
```

**Save to variable:**

- Response: `accessToken` → Variable: `FACULTY_TOKEN`

---

## 3. Get Faculty ID (for creating submission)

```http
GET {{BASE_URL}}/api/submissions
Authorization: Bearer {{FACULTY_TOKEN}}
```

**Save to variable:**

- Copy any `facultyId` from response → Variable: `FACULTY_ID`

Or get from MongoDB:

```javascript
db.facultyprofiles.findOne({}, { _id: 1 });
```

---

## 4. Create Submission (Student)

```http
POST {{BASE_URL}}/api/submissions
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: application/json

{
  "facultyId": "{{FACULTY_ID}}",
  "deadline": "2026-03-15T23:59:59.000Z",
  "universityName": "Stanford University",
  "purpose": "MS in Computer Science"
}
```

**Save to variable:**

- Response: `data._id` → Variable: `SUBMISSION_ID`

---

## 5. Upload Draft v1 (Student)

```http
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select your PDF file>
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "...",
    "version": 1,
    "originalName": "draft_v1.pdf",
    "size": 123456,
    "uploadedAt": "2026-01-14T..."
  }
}
```

**Save to variable:**

- Response: `data.fileId` → Variable: `DRAFT_FILE_ID`

---

## 6. Upload Draft v2 (Student - Testing Versioning)

```http
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select another PDF file>
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "...",
    "version": 2,
    "originalName": "draft_v2.pdf",
    "size": 234567,
    "uploadedAt": "2026-01-14T..."
  }
}
```

---

## 7. List Submission Files (Student)

```http
GET {{BASE_URL}}/api/files/submission/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "...",
      "type": "draft",
      "version": 1,
      "originalName": "draft_v1.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "createdAt": "2026-01-14T..."
    },
    {
      "_id": "...",
      "type": "draft",
      "version": 2,
      "originalName": "draft_v2.pdf",
      "mimeType": "application/pdf",
      "size": 234567,
      "createdAt": "2026-01-14T..."
    }
  ]
}
```

---

## 8. Faculty Approves Submission

```http
POST {{BASE_URL}}/api/submissions/{{SUBMISSION_ID}}/status
Authorization: Bearer {{FACULTY_TOKEN}}
Content-Type: application/json

{
  "newStatus": "approved",
  "remark": "Draft looks excellent. Proceeding with final LoR."
}
```

---

## 9. Upload Final LoR (Faculty)

```http
POST {{BASE_URL}}/api/files/upload-final/{{SUBMISSION_ID}}
Authorization: Bearer {{FACULTY_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select final PDF file>
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "...",
    "originalName": "final_lor.pdf",
    "size": 187234,
    "uploadedAt": "2026-01-14T..."
  }
}
```

**Note:** This automatically changes submission status to `completed`

**Save to variable:**

- Response: `data.fileId` → Variable: `FINAL_FILE_ID`

---

## 10. Download Draft File (Student)

```http
GET {{BASE_URL}}/api/files/{{DRAFT_FILE_ID}}/download
Authorization: Bearer {{STUDENT_TOKEN}}
```

**Expected:** File downloads with proper filename

---

## 11. Download Final LoR (Student)

```http
GET {{BASE_URL}}/api/files/{{FINAL_FILE_ID}}/download
Authorization: Bearer {{STUDENT_TOKEN}}
```

**Expected:** Final LoR downloads

---

## 12. Faculty Downloads Final LoR (Faculty can also download)

```http
GET {{BASE_URL}}/api/files/{{FINAL_FILE_ID}}/download
Authorization: Bearer {{FACULTY_TOKEN}}
```

**Expected:** Final LoR downloads

---

## Error Test Cases

### Test 1: Student tries to upload final (should fail)

```http
POST {{BASE_URL}}/api/files/upload-final/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select PDF>
```

**Expected Error:**

```json
{
  "status": "error",
  "code": "FORBIDDEN",
  "message": "Access denied. Required role: faculty"
}
```

---

### Test 2: Upload draft after approved (should fail)

```http
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select PDF>
```

**Expected Error:**

```json
{
  "status": "error",
  "code": "BAD_REQUEST",
  "message": "Cannot upload draft in status: completed. Only allowed in 'submitted' or 'resubmission' status."
}
```

---

### Test 3: Upload without file (should fail)

```http
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
```

**Expected Error:**

```json
{
  "status": "error",
  "code": "BAD_REQUEST",
  "message": "No file uploaded"
}
```

---

### Test 4: Upload wrong file type (should fail)

```http
POST {{BASE_URL}}/api/files/upload-draft/{{SUBMISSION_ID}}
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data

[Form Data]
file: <Select .exe or .jpg file>
```

**Expected Error:**

```json
{
  "status": "error",
  "message": "Invalid file type. Only PDF, DOC, and DOCX allowed."
}
```

---

### Test 5: Download someone else's file (should fail)

Create another student, login, try to download `{{FINAL_FILE_ID}}`

**Expected Error:**

```json
{
  "status": "error",
  "code": "FORBIDDEN",
  "message": "Access denied to this file"
}
```

---

## Summary

✅ **Working Features:**

1. Draft upload with auto-versioning (v1, v2, v3...)
2. Final LoR upload (faculty only)
3. File download with streaming
4. Ownership validation
5. Status guards (can't upload draft after approved)
6. Role-based access control
7. File type validation (PDF, DOC, DOCX only)
8. File size limits (5 MB)
9. Rate limiting
10. Automatic submission status update to `completed` after final upload

🔒 **Security Features:**

- No path traversal possible
- Storage paths are randomized UUIDs
- Ownership checks on all operations
- Role-based endpoint protection
- File type validation
- Size limits enforced

📁 **File Organization:**

```
uploads/
├── drafts/
│   └── {submissionId}/
│       ├── {uuid-1}.pdf
│       ├── {uuid-2}.pdf
│       └── {uuid-3}.pdf
└── finals/
    └── {submissionId}/
        └── {uuid}.pdf
```
