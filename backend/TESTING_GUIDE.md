# 🚀 Submission System - Testing Guide

## ✅ Setup Checklist

### 1. Seed Test Data

```bash
npx tsx seed-test-data.ts
```

**Expected Output:**

- 3 Students (2 active, 1 alumni)
- 3 Faculty members
- 1 Admin
- All with password: `password123`

### 2. Start Server

```bash
npm run dev
```

---

## 📋 Postman Testing Workflow

### **STEP 1: Login as Student**

**POST** `http://localhost:3000/auth/login`

**Body:**

```json
{
  "email": "rahul.sharma@mitmanipal.edu",
  "password": "password123"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "userId": "...",
    "role": "student"
  }
}
```

✅ Cookie `accessToken` will be set automatically

---

### **STEP 2: Get Faculty ID**

From seed script output, copy a faculty ID. Example:

```
FAC001: 67a1b2c3d4e5f6g7h8i9j0k1
```

---

### **STEP 3: Create Submission (Student)**

**POST** `http://localhost:3000/api/submissions`

**Body:**

```json
{
  "facultyId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "deadline": "2026-02-15T00:00:00.000Z",
  "universityName": "MIT Boston",
  "purpose": "MS in Computer Science"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "...",
      "status": "submitted",
      "currentVersion": 1
    }
  }
}
```

✅ **Status:** `submitted`  
✅ **Version:** 1

---

### **STEP 4: List My Submissions (Student)**

**GET** `http://localhost:3000/api/submissions`

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": "...",
        "status": "submitted",
        "deadline": "2026-02-15T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### **STEP 5: Logout Student**

**POST** `http://localhost:3000/auth/logout`

---

### **STEP 6: Login as Faculty**

**POST** `http://localhost:3000/auth/login`

**Body:**

```json
{
  "email": "prof.anita.gupta@mitmanipal.edu",
  "password": "password123"
}
```

---

### **STEP 7: List Faculty Dashboard (Pending Submissions)**

**GET** `http://localhost:3000/api/submissions/faculty/pending`

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": "...",
        "status": "submitted",
        "studentId": "...",
        "deadline": "2026-02-15T00:00:00.000Z"
      }
    ]
  }
}
```

---

### **STEP 8: Request Resubmission (Faculty)**

**POST** `http://localhost:3000/api/submissions/{submissionId}/status`

**Body:**

```json
{
  "newStatus": "resubmission",
  "remark": "Please add more details about your research interests"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "...",
      "status": "resubmission",
      "currentVersion": 1
    }
  }
}
```

✅ **Status changed:** `submitted` → `resubmission`  
✅ **Email sent to student** (check console logs)

---

### **STEP 9: Logout Faculty, Login Student Again**

**POST** `http://localhost:3000/auth/logout`  
**POST** `http://localhost:3000/auth/login` (student credentials)

---

### **STEP 10: Resubmit (Student)**

**POST** `http://localhost:3000/api/submissions/{submissionId}/status`

**Body:**

```json
{
  "newStatus": "submitted",
  "remark": "Updated draft with research interests"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "...",
      "status": "submitted",
      "currentVersion": 2
    }
  }
}
```

✅ **Status changed:** `resubmission` → `submitted`  
✅ **Version incremented:** 1 → 2

---

### **STEP 11: Login as Faculty, Approve (Faculty)**

**POST** `http://localhost:3000/api/submissions/{submissionId}/status`

**Body:**

```json
{
  "newStatus": "approved",
  "remark": "Draft looks good"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "...",
      "status": "approved"
    }
  }
}
```

✅ **Status changed:** `submitted` → `approved`  
✅ **Email sent to student**

---

### **STEP 12: Mark as Completed (Faculty)**

**POST** `http://localhost:3000/api/submissions/{submissionId}/status`

**Body:**

```json
{
  "newStatus": "completed",
  "remark": "LoR submitted to university"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "...",
      "status": "completed"
    }
  }
}
```

✅ **Status changed:** `approved` → `completed`  
✅ **Submission is now IMMUTABLE**

---

### **STEP 13: Try Invalid Transition (Should Fail)**

**POST** `http://localhost:3000/api/submissions/{submissionId}/status`

**Body:**

```json
{
  "newStatus": "submitted"
}
```

**Expected Response:**

```json
{
  "status": "error",
  "message": "Completed/rejected submissions are immutable"
}
```

✅ **Security enforced!**

---

## 🔒 Security Tests

### **Test 1: Student Cannot Approve**

Login as student, try:

```json
{
  "newStatus": "approved"
}
```

**Expected:** `400 Bad Request` - "Students can only resubmit revised drafts"

---

### **Test 2: Faculty Cannot Act on Other's Submissions**

Login as `dr.rajesh.kumar@mitmanipal.edu`  
Try to update a submission assigned to `prof.anita.gupta@mitmanipal.edu`

**Expected:** `400 Bad Request` - "Faculty can only manage assigned submissions"

---

### **Test 3: Duplicate Submission**

Create a submission with same faculty again.

**Expected:** `400 Bad Request` - "Active submission already exists with this faculty"

---

### **Test 4: Soft Delete**

**DELETE** `http://localhost:3000/api/submissions/{submissionId}`

Only works if status is `submitted`, `resubmission`, or `rejected`.

**Expected:** `200 OK` - Submission marked `isActive: false`

---

## 🧪 Advanced Tests

### Filter by Status

**GET** `http://localhost:3000/api/submissions?status=submitted`

### Include Inactive Submissions

**GET** `http://localhost:3000/api/submissions?isActive=false`

### Get Full Details

**GET** `http://localhost:3000/api/submissions/{submissionId}`

---

## 📊 Expected Audit Log

```json
{
  "auditLog": [
    {
      "at": "2026-01-14T10:00:00.000Z",
      "actorId": "studentUserId",
      "fromStatus": null,
      "toStatus": "submitted"
    },
    {
      "at": "2026-01-14T10:05:00.000Z",
      "actorId": "facultyUserId",
      "fromStatus": "submitted",
      "toStatus": "resubmission",
      "remark": "Please add more details"
    },
    {
      "at": "2026-01-14T10:10:00.000Z",
      "actorId": "studentUserId",
      "fromStatus": "resubmission",
      "toStatus": "submitted",
      "remark": "Updated draft"
    },
    {
      "at": "2026-01-14T10:15:00.000Z",
      "actorId": "facultyUserId",
      "fromStatus": "submitted",
      "toStatus": "approved"
    },
    {
      "at": "2026-01-14T10:20:00.000Z",
      "actorId": "facultyUserId",
      "fromStatus": "approved",
      "toStatus": "completed"
    }
  ]
}
```

---

## 🎯 Success Criteria

✅ Students can create submissions  
✅ Faculty can request resubmission  
✅ Students can resubmit (version increments)  
✅ Faculty can approve  
✅ Faculty can mark completed  
✅ Completed submissions are immutable  
✅ Ownership is enforced  
✅ Status transitions are locked  
✅ Audit log is complete  
✅ Emails are sent (check console)  
✅ Rate limiting works

---

## 🐛 Troubleshooting

**Error:** `Invalid faculty ID format`  
**Fix:** Use a valid MongoDB ObjectId (24 hex chars)

**Error:** `Unauthorized`  
**Fix:** Login first, check cookie is set

**Error:** `Faculty can only manage assigned submissions`  
**Fix:** Login as the correct faculty member

**Error:** `Too many submissions`  
**Fix:** Rate limit triggered, wait 15 minutes

---

## 🔐 Production Checklist

- [ ] All endpoints require authentication
- [ ] Ownership is validated
- [ ] Status machine is enforced
- [ ] Audit logs are immutable
- [ ] Emails are fire-and-forget
- [ ] Rate limiting is active
- [ ] Input validation with Zod
- [ ] Unique constraints on DB
- [ ] Indexes are created
- [ ] Soft deletes only

**System is production-ready! 🚀**
