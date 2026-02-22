# Backend API Requirements - Frontend Implementation

**Generated:** February 17, 2026 (Updated)
**Version:** 3.0
**Frontend Components**: SuperAdmin (Invitations, Organizations, Dashboard), Admin (Agent Management), Agent PWA (Projects, Forms, Submissions)
**Priority**: High - Blocking interface completion

---

## 📋 Executive Summary

This document outlines missing API endpoints and enhancements required to support SuperAdmin, Admin, and Agent PWA interfaces.

### SuperAdmin Interface
- ✅ **Invitations Management** - Create, view, filter, resend, delete invitations
- ✅ **Organizations Management** - Full CRUD operations with search and filtering
- ✅ **Dashboard Analytics** - 5 interactive tabs with Chart.js visualizations
- ⚠️ **Mock Data Usage** - All dashboard charts currently use generated data

### Admin Interface - Agent Management
- ✅ **Agents List** - View all agents with filtering and pagination
- ✅ **Invite Single Agent** - Send invitation with optional project assignment
- ✅ **Bulk Upload** - Excel/CSV upload for multiple agents
- ✅ **Agent Profile** - Detailed agent view with statistics
- ✅ **Agent Submissions** - View submissions by agent with details/form view

### Agent PWA Interface (NEW - v3.0)
- 🔄 **Projects List** - View assigned projects with status filtering
- 🔄 **Project Forms** - View and fill forms for active projects
- 🔄 **Offline Submissions** - Store submissions locally, sync when online
- 🔄 **Sync Management** - Manual/automatic sync control with status
- 🔄 **Submissions View** - View all submissions for a project

**Current Blockers**: 21 missing endpoints (11 SuperAdmin + 5 Admin + 5 Agent PWA)

---

## ❌ CRITICAL MISSING ENDPOINTS

### 1️⃣ Organizations CRUD (High Priority)

The backend documentation only shows `POST /organizations` but the frontend requires full CRUD:

#### **GET /organizations**

Returns all organizations for SuperAdmin monitoring.

**Request:**

```http
GET /organizations?isActive=true&search=wildlife&sortBy=name&sortOrder=asc
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `isActive` (optional): Filter by active status (true/false)
- `search` (optional): Search by name, email, or city
- `sortBy` (optional): Field to sort by (name, createdAt, city)
- `sortOrder` (optional): asc or desc (default: asc)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "East Africa Wildlife Foundation",
    "description": "Wildlife conservation and research organization",
    "address": "123 Conservation Drive",
    "city": "Nairobi",
    "country": "Kenya",
    "phone": "+254-20-1234567",
    "email": "info@eawf.org",
    "website": "https://eawf.org",
    "logoUrl": "https://eawf.org/logo.png",
    "timeZone": "Africa/Nairobi",
    "isActive": true,
    "createdAt": "2026-02-14T12:00:00Z",
    "updatedAt": "2026-02-14T12:00:00Z",
    "totalUsers": 23,
    "totalProjects": 12,
    "totalSubmissions": 487
  }
]
```

**Frontend Usage:** `api.getOrganizations()`

---

#### **GET /organizations/{id}**

Returns single organization details.

**Request:**

```http
GET /organizations/1
Authorization: Bearer {superAdminToken}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "East Africa Wildlife Foundation",
  "description": "Wildlife conservation and research organization",
  "address": "123 Conservation Drive",
  "city": "Nairobi",
  "country": "Kenya",
  "phone": "+254-20-1234567",
  "email": "info@eawf.org",
  "website": "https://eawf.org",
  "logoUrl": "https://eawf.org/logo.png",
  "timeZone": "Africa/Nairobi",
  "isActive": true,
  "createdAt": "2026-02-14T12:00:00Z",
  "updatedAt": "2026-02-14T12:00:00Z",
  "totalUsers": 23,
  "totalProjects": 12,
  "totalSubmissions": 487
}
```

**Errors:**

- `404 Not Found` - Organization doesn't exist

**Frontend Usage:** `api.getOrganization(id)`

---

#### **PATCH /organizations/{id}**

Updates organization fields (all fields optional).

**Request:**

```http
PATCH /organizations/1
Authorization: Bearer {superAdminToken}
Content-Type: application/json

{
  "name": "Updated Organization Name",
  "description": "Updated description",
  "address": "456 New Street",
  "city": "Mombasa",
  "country": "Kenya",
  "phone": "+254-20-9876543",
  "email": "newemail@org.com",
  "website": "https://newsite.org",
  "logoUrl": "https://newsite.org/logo.png",
  "timeZone": "Africa/Nairobi",
  "isActive": false
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Updated Organization Name",
  "description": "Updated description",
  "address": "456 New Street",
  "city": "Mombasa",
  "country": "Kenya",
  "phone": "+254-20-9876543",
  "email": "newemail@org.com",
  "website": "https://newsite.org",
  "logoUrl": "https://newsite.org/logo.png",
  "timeZone": "Africa/Nairobi",
  "isActive": false,
  "createdAt": "2026-02-14T12:00:00Z",
  "updatedAt": "2026-02-16T10:30:00Z"
}
```

**Validation:**

- At least one field must be provided
- Email must be valid format (if provided)
- Phone format validation (if provided)

**Errors:**

- `404 Not Found` - Organization doesn't exist
- `400 Bad Request` - Validation errors

**Frontend Usage:** `api.updateOrganization(id, data)`

---

#### **DELETE /organizations/{id}**

Soft deletes organization (sets `isActive = false`).

**Request:**

```http
DELETE /organizations/1
Authorization: Bearer {superAdminToken}
```

**Response:** `200 OK`

```json
{
  "message": "Organization deleted successfully."
}
```

**Business Logic:**

- Should set `isActive = false` instead of hard delete
- Consider cascading effects on users, projects, forms
- Prevent deletion if organization has active projects

**Errors:**

- `404 Not Found` - Organization doesn't exist
- `400 Bad Request` - Organization has active projects

**Frontend Usage:** `api.deleteOrganization(id)`

---

### 2️⃣ Invitations Management (Medium Priority)

#### **POST /invitations/{id}/resend**

Resends invitation email with new expiry and token.

**Request:**

```http
POST /invitations/1/resend
Authorization: Bearer {superAdminToken}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "agent@example.com",
  "role": "Agent",
  "token": "xyz789-new-token-...",
  "status": "Pending",
  "expiresAt": "2026-02-23T12:00:00Z",
  "createdAt": "2026-02-14T12:00:00Z",
  "sentByUserId": 1
}
```

**Business Logic:**

- Generate new token with 7-day expiry
- Update `expiresAt` field
- Send new invitation email
- Only works if status is "Pending" or "Expired"

**Errors:**

- `404 Not Found` - Invitation doesn't exist
- `400 Bad Request` - Invitation already accepted

**Frontend Usage:** `api.resendInvitation(id)`

---

#### **DELETE /invitations/{id}**

Deletes/cancels an invitation.

**Request:**

```http
DELETE /invitations/1
Authorization: Bearer {superAdminToken}
```

**Response:** `200 OK`

```json
{
  "message": "Invitation deleted successfully."
}
```

**Business Logic:**

- Hard delete from database
- Only pending invitations can be deleted
- Prevent deletion of accepted invitations

**Errors:**

- `404 Not Found` - Invitation doesn't exist
- `400 Bad Request` - Cannot delete accepted invitation

**Frontend Usage:** `api.deleteInvitation(id)`

---

## 📊 MISSING TIME-SERIES ANALYTICS ENDPOINTS

**Context**: Dashboard has 20+ charts across 5 tabs (Overview, Organizations, Users, Projects, Submissions). ALL charts currently use mock/generated data because there are no time-series endpoints.

### 3️⃣ Submission Timeline Data

#### **GET /admin/analytics/submissions/timeline**

**Request:**

```http
GET /admin/analytics/submissions/timeline?startDate=2026-01-01&endDate=2026-02-16&groupBy=day
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `startDate` (optional): ISO date, defaults to 60 days ago
- `endDate` (optional): ISO date, defaults to today
- `groupBy`: "day" | "week" | "month" (default: day)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "date": "2026-02-01",
      "count": 45,
      "organizationBreakdown": {
        "org1": 20,
        "org2": 15,
        "org3": 10
      }
    },
    {
      "date": "2026-02-02",
      "count": 52,
      "organizationBreakdown": {
        "org1": 25,
        "org2": 18,
        "org3": 9
      }
    }
  ],
  "summary": {
    "total": 1247,
    "average": 20.78,
    "peak": {
      "date": "2026-02-10",
      "count": 67
    }
  }
}
```

**Used In:**

- Overview tab: "Submission Activity Trend" (Area Chart)
- Submissions tab: "Submission Activity Timeline" (Area Chart)

---

### 4️⃣ Organization Growth Data

#### **GET /admin/analytics/organizations/growth**

**Request:**

```http
GET /admin/analytics/organizations/growth?period=12months
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `period`: "6months" | "12months" | "24months" (default: 12months)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "month": "Jan 2026",
      "newOrganizations": 3,
      "totalOrganizations": 45,
      "growthRate": 7.1
    },
    {
      "month": "Feb 2026",
      "newOrganizations": 2,
      "totalOrganizations": 47,
      "growthRate": 4.4
    }
  ],
  "summary": {
    "totalGrowth": 12,
    "averageGrowthRate": 5.8,
    "peakMonth": "Jan 2026"
  }
}
```

**Used In:**

- Overview tab: "Platform Growth Trend" (Area Chart)
- Organizations tab: "Organization Growth Timeline" (Line Chart)

---

### 5️⃣ User Registration Data

#### **GET /admin/analytics/users/registrations**

**Request:**

```http
GET /admin/analytics/users/registrations?period=12months
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `period`: "6months" | "12months" (default: 12months)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "month": "Jan 2026",
      "admins": 5,
      "agents": 12,
      "total": 17,
      "cumulativeAdmins": 45,
      "cumulativeAgents": 203
    },
    {
      "month": "Feb 2026",
      "admins": 3,
      "agents": 15,
      "total": 18,
      "cumulativeAdmins": 48,
      "cumulativeAgents": 218
    }
  ],
  "summary": {
    "totalNewUsers": 156,
    "adminPercentage": 22.4,
    "agentPercentage": 77.6
  }
}
```

**Used In:**

- Users tab: "User Registration Trends" (Line Chart)

---

### 6️⃣ Project Creation Timeline

#### **GET /admin/analytics/projects/timeline**

**Request:**

```http
GET /admin/analytics/projects/timeline?period=12months
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `period`: "6months" | "12months" (default: 12months)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "month": "Jan 2026",
      "created": 8,
      "completed": 3,
      "total": 103,
      "activeProjects": 78
    },
    {
      "month": "Feb 2026",
      "created": 5,
      "completed": 2,
      "total": 108,
      "activeProjects": 81
    }
  ],
  "summary": {
    "totalCreated": 67,
    "totalCompleted": 23,
    "completionRate": 34.3
  }
}
```

**Used In:**

- Projects tab: "Project Creation Timeline" (Line Chart)

---

### 7️⃣ Activity Heatmap Data

#### **GET /admin/analytics/activity/heatmap**

**Request:**

```http
GET /admin/analytics/activity/heatmap?days=30
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**

- `days`: 7 | 30 | 60 | 90 (default: 30)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "week": "Week 1",
      "startDate": "2026-02-01",
      "endDate": "2026-02-07",
      "activeUsers": 45,
      "submissions": 203,
      "projectsCreated": 3
    },
    {
      "week": "Week 2",
      "startDate": "2026-02-08",
      "endDate": "2026-02-14",
      "activeUsers": 52,
      "submissions": 187,
      "projectsCreated": 2
    }
  ],
  "summary": {
    "averageActiveUsers": 48.5,
    "averageSubmissions": 195,
    "mostActiveWeek": "Week 2"
  }
}
```

**Used In:**

- Overview tab: "Weekly Activity Comparison" (Bar Chart)

---

## 📝 ENDPOINT ENHANCEMENTS

### Enhancement 1: Dashboard Stats - Additional Metrics

**Current Endpoint:** `GET /admin/dashboard/stats`

**Add These Fields:**

```json
{
  "organizations": {
    "total": 5,
    "active": 4,
    "createdThisMonth": 2,
    "dormant": 1,
    // ADD THESE:
    "growthRate": "+15%",
    "mostActiveOrg": {
      "id": 1,
      "name": "Wildlife Foundation",
      "submissionCount": 156
    }
  },
  "users": {
    "total": 23,
    "byRole": {
      "superAdmin": 1,
      "admin": 5,
      "agent": 17
    },
    "active": 21,
    "inactive": 2,
    "averagePerOrganization": 4.6,
    // ADD THESE:
    "createdThisMonth": 12,
    "growthRate": "+8%"
  },
  "projects": {
    "total": 12,
    "byStatus": {
      "draft": 2,
      "active": 8,
      "closed": 2
    },
    "averagePerOrganization": 2.4,
    // ADD THESE:
    "createdThisMonth": 5,
    "completedThisMonth": 2
  },
  "submissions": {
    "total": 487,
    "last7Days": 52,
    "last30Days": 203,
    "averagePerProject": 40.58,
    "topOrganizationsBySubmissions": [...],
    // ADD THESE:
    "todayCount": 15,
    "yesterdayCount": 12,
    "growthRate": "+25%",
    "peakSubmissionDay": {
      "date": "2026-02-10",
      "count": 67
    }
  }
}
```

**Why Needed**: Better insights for stat cards and trend indicators.

---

### Enhancement 2: Invitations - Include createdAt

**Current Endpoint:** `GET /invitations`

**Current Response:**

```json
{
  "id": 1,
  "email": "agent@example.com",
  "role": "Agent",
  "status": "Pending",
  "expiresAt": "2026-02-21T12:00:00Z",
  "sentByUserId": 2
  // Missing: createdAt
}
```

**Required Response:**

```json
{
  "id": 1,
  "email": "agent@example.com",
  "role": "Agent",
  "status": "Pending",
  "expiresAt": "2026-02-21T12:00:00Z",
  "createdAt": "2026-02-14T12:00:00Z",  // ADD THIS
  "sentByUserId": 2
}
```

**Why Needed**: Frontend has date range filtering (startDate/endDate) but can't filter without `createdAt` field.

---

### Enhancement 3: Organizations List - Include Counts

**Current Endpoint:** `GET /organizations`

**Add These Fields to Each Organization:**

```json
{
  "id": 1,
  "name": "Wildlife Foundation",
  // ... all existing fields
  // ADD THESE:
  "totalUsers": 23,
  "totalProjects": 12,
  "totalSubmissions": 487,
  "activeUsers": 21,
  "activeProjects": 8
}
```

**Why Needed**: To populate organization cards without making N+1 queries.

**Implementation Suggestion**:

```sql
SELECT o.*,
  COUNT(DISTINCT u.id) as totalUsers,
  COUNT(DISTINCT p.id) as totalProjects,
  COUNT(DISTINCT s.id) as totalSubmissions
FROM Organizations o
LEFT JOIN Users u ON u.OrganizationId = o.Id
LEFT JOIN Projects p ON p.OrganizationId = o.Id
LEFT JOIN Submissions s ON s.OrganizationId = o.Id
GROUP BY o.Id
```

---

### Enhancement 4: Pagination Support

**Add to ALL List Endpoints:**

```http
GET /organizations?page=1&limit=10
GET /invitations?page=1&limit=10&status=Pending
```

**Response Format:**

```json
{
  "data": [
    // ... array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

**Why Needed**: Frontend has pagination components but currently does client-side pagination which won't scale with large datasets.

---

## 🔷 ADMIN - AGENT MANAGEMENT ENDPOINTS (NEW)

**Context:** The Admin interface now includes a complete agent management system at `/agents/*`. Admins can invite agents, manage their status, view profiles, track submissions, and perform bulk uploads.

### 1️⃣ Update User Status (High Priority)

#### **PUT /users/{userId}/status**

Toggle agent active/inactive status.

**Auth:** Admin, SuperAdmin

**Request:**

```http
PUT /users/3/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "isActive": false
}
```

**Response:** `200 OK`

```json
{
  "id": 3,
  "email": "agent@example.com",
  "isActive": false,
  "updatedAt": "2026-02-17T14:30:00Z"
}
```

**Business Logic:**
- Deactivated users cannot log in
- Deactivated agents cannot submit data
- Only Admin/SuperAdmin can modify user status
- Cannot deactivate SuperAdmin accounts

**Errors:**
- `404 Not Found` - User doesn't exist
- `403 Forbidden` - Insufficient permissions
- `400 Bad Request` - Cannot deactivate SuperAdmin

**Frontend Usage:** `api.updateUserStatus(userId, isActive)`

---

### 2️⃣ Get Single User with Details (High Priority)

#### **GET /users/{userId}**

Returns detailed information about a specific user, including submission counts and project assignments.

**Auth:** Admin, SuperAdmin, Agent (own profile only)

**Request:**

```http
GET /users/3
Authorization: Bearer {adminToken}
```

**Response:** `200 OK`

```json
{
  "id": 3,
  "organizationId": 1,
  "email": "agent@example.com",
  "name": "John Kamau",
  "role": "Agent",
  "isActive": true,
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-02-17T14:00:00Z",
  "lastActiveAt": "2026-02-17T13:45:00Z",
  "submissionCount": 145,
  "projectsAssigned": [1, 2, 5],
  "stats": {
    "totalSubmissions": 145,
    "last7Days": 28,
    "last30Days": 92,
    "avgPerDay": 3.2
  }
}
```

**Notes:**
- `submissionCount` - Total submissions across all projects
- `projectsAssigned` - Array of project IDs the agent has access to
- `lastActiveAt` - Last login or submission timestamp
- Agents can only view their own profile
- Admin/SuperAdmin can view any user in their organization

**Errors:**
- `404 Not Found` - User doesn't exist or not in organization
- `403 Forbidden` - Agent trying to view another user

**Frontend Usage:** `api.getUser(userId)`

---

### 3️⃣ Get User Submissions (High Priority)

#### **GET /submissions/user/{userId}**

Returns all submissions created by a specific agent.

**Auth:** Admin, SuperAdmin, Agent (own submissions only)

**Request:**

```http
GET /submissions/user/3?projectId=1&startDate=2026-02-01&endDate=2026-02-17&limit=50
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `projectId` (optional): Filter by specific project
- `formId` (optional): Filter by specific form
- `startDate` (optional): Filter submissions from date (ISO format)
- `endDate` (optional): Filter submissions to date (ISO format)
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 245,
      "organizationId": 1,
      "projectId": 1,
      "formId": 3,
      "submittedByUserId": 3,
      "answers": {
        "location": "-1.2921, 36.8219",
        "observation": "Herd of 12 elephants",
        "behavior": "Feeding"
      },
      "localSyncId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-02-17T10:30:00Z",
      "syncedAt": "2026-02-17T10:31:05Z",
      "projectName": "Wildlife Census 2026",
      "formName": "Elephant Sighting Form"
    }
  ],
  "pagination": {
    "total": 145,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Enhanced Fields:**
- Include `projectName` and `formName` for display purposes
- Include pagination metadata

**Errors:**
- `404 Not Found` - User doesn't exist
- `403 Forbidden` - Agent viewing another agent's submissions

**Frontend Usage:** `api.getUserSubmissions(userId, filters)`

---

### 4️⃣ Bulk Invite Agents (Medium Priority)

#### **POST /invitations/bulk**

Invite multiple agents at once via CSV/Excel upload.

**Auth:** Admin, SuperAdmin

**Request:**

```http
POST /invitations/bulk
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "invitations": [
    {
      "email": "agent1@example.com",
      "projectIds": [1, 2]
    },
    {
      "email": "agent2@example.com",
      "projectIds": [1, 3, 5]
    },
    {
      "email": "agent3@example.com",
      "projectIds": []
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "email": "agent1@example.com",
      "success": true,
      "invitationId": 45,
      "token": "abc123-def456-...",
      "expiresAt": "2026-02-24T15:00:00Z"
    },
    {
      "email": "agent2@example.com",
      "success": true,
      "invitationId": 46,
      "token": "xyz789-uvw012-...",
      "expiresAt": "2026-02-24T15:00:00Z"
    },
    {
      "email": "agent3@example.com",
      "success": false,
      "error": "Email already registered"
    }
  ]
}
```

**Business Logic:**
- Process all invitations, continue on individual failures
- Skip duplicate emails (already invited or registered)
- All invitations sent to user's organization
- Role is automatically set to "Agent"
- Optional project assignment per agent

**Validation:**
- Validate each email format
- Check for existing invitations/users
- Verify project IDs exist and belong to organization

**Errors:**
- `400 Bad Request` - Invalid request format
- `403 Forbidden` - Insufficient permissions

**Frontend Usage:** `api.bulkInviteAgents(invitations)`

---

### 5️⃣ Get Agent Statistics (Low Priority)

#### **GET /users/{userId}/statistics**

Returns detailed statistics for an agent's activity.

**Auth:** Admin, SuperAdmin

**Request:**

```http
GET /users/3/statistics?period=30days
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `period`: "7days" | "30days" | "90days" | "all" (default: 30days)

**Response:** `200 OK`

```json
{
  "userId": 3,
  "period": "30days",
  "submissions": {
    "total": 92,
    "byProject": {
      "1": 45,
      "2": 30,
      "5": 17
    },
    "byForm": {
      "3": 52,
      "4": 28,
      "7": 12
    },
    "timeline": [
      { "date": "2026-02-01", "count": 3 },
      { "date": "2026-02-02", "count": 5 },
      { "date": "2026-02-03", "count": 2 }
    ]
  },
  "activity": {
    "avgSubmissionsPerDay": 3.1,
    "mostActiveDay": "2026-02-10",
    "mostActiveProject": {
      "id": 1,
      "name": "Wildlife Census 2026",
      "submissionCount": 45
    },
    "lastActiveAt": "2026-02-17T13:45:00Z",
    "totalActiveDays": 28
  }
}
```

**Use Case:** Powers agent profile page statistics and charts

**Frontend Usage:** `api.getAgentStatistics(userId, period)`

---

## 📝 ENDPOINT ENHANCEMENTS FOR AGENT MANAGEMENT

### Enhancement 1: Users Endpoint - Include Submission Count

**Current Endpoint:** `GET /users`

**Add These Fields to Each User:**

```json
{
  "id": 3,
  "email": "agent@example.com",
  "role": "Agent",
  "organizationId": 1,
  "isActive": true,
  // ADD THESE:
  "submissionCount": 145,
  "lastActiveAt": "2026-02-17T13:45:00Z",
  "projectsAssigned": [1, 2, 5]
}
```

**Why Needed:** Agent list page shows submission count without N+1 queries

**Implementation Suggestion:**
```sql
SELECT u.*,
  COUNT(DISTINCT s.Id) as submissionCount,
  MAX(s.CreatedAt) as lastActiveAt
FROM Users u
LEFT JOIN Submissions s ON s.SubmittedByUserId = u.Id
WHERE u.OrganizationId = @orgId AND u.Role = 'Agent'
GROUP BY u.Id
```

---

### Enhancement 2: Invitations Endpoint - Support Project Assignment

**Current Endpoint:** `POST /invitations`

**Already Documented in BACKEND_DOCUMENTATION.md:**
```json
{
  "email": "agent@example.com",
  "role": "Agent",
  "projectIds": [1, 2, 3]  // ✅ Already supported
}
```

**Status:** ✅ No changes needed - endpoint already supports this

---

## 🎯 IMPLEMENTATION PRIORITY - AGENT MANAGEMENT

### **Phase 1: Core Agent Management (HIGH PRIORITY)**

**Timeline:** Immediate

1. ✅ `PUT /users/{userId}/status` - Activate/deactivate agents
2. ✅ `GET /users/{userId}` - Single user details with stats
3. ✅ `GET /submissions/user/{userId}` - User's submissions with filters

**Impact:** Without these, basic agent management is non-functional

---

### **Phase 2: Bulk Operations (MEDIUM PRIORITY)**

**Timeline:** High Priority

4. ✅ `POST /invitations/bulk` - Bulk agent invitations
5. ✅ Enhance `GET /users` with submissionCount

**Impact:** Improves admin efficiency for onboarding multiple agents

---

### **Phase 3: Analytics & Insights (LOW PRIORITY)**

**Timeline:** Nice to have

6. ✅ `GET /users/{userId}/statistics` - Detailed agent statistics

**Impact:** Enhanced agent profile pages with insights

---

## 📋 TESTING CHECKLIST - AGENT MANAGEMENT

### User Status Management
```bash
# Deactivate agent
PUT /users/3/status
{
  "isActive": false
}

# Activate agent
PUT /users/3/status
{
  "isActive": true
}
```

### User Details & Submissions
```bash
# Get single user
GET /users/3

# Get user submissions
GET /submissions/user/3?projectId=1&limit=50

# Get user statistics
GET /users/3/statistics?period=30days
```

### Bulk Operations
```bash
# Bulk invite
POST /invitations/bulk
{
  "invitations": [
    { "email": "agent1@example.com", "projectIds": [1, 2] },
    { "email": "agent2@example.com", "projectIds": [3] }
  ]
}
```

---

## 📞 FRONTEND CONTACT POINTS - AGENT MANAGEMENT

The Admin agent management interface uses these API client methods:

```typescript
// Agent Management
api.getUsers()  // Filter by role="Agent" on frontend
api.getUser(userId)
api.updateUserStatus(userId, isActive)
api.getUserSubmissions(userId, filters)
api.getAgentStatistics(userId, period)

// Invitations
api.createInvitation(data)  // With projectIds support
api.bulkInviteAgents(invitations)
api.getInvitations()
api.resendInvitation(id)
api.deleteInvitation(id)

// Projects (for assignment)
api.getProjects()
```

**Frontend Locations:**
- `src/routes/(admin)/agents/+page.svelte` - Agent list
- `src/routes/(admin)/agents/add/+page.svelte` - Invite single agent
- `src/routes/(admin)/agents/bulk-upload/+page.svelte` - Bulk upload (IN PROGRESS)
- `src/routes/(admin)/agents/[agentId]/+page.svelte` - Agent profile (IN PROGRESS)
- `src/routes/(admin)/agents/[agentId]/submissions/+page.svelte` - Agent submissions (IN PROGRESS)

---

## ✅ ACCEPTANCE CRITERIA - AGENT MANAGEMENT

### Agents List Module
- ✅ Can list all agents in organization
- ✅ Can search agents by email/name
- ✅ Can filter by status (Active/Inactive)
- ✅ Can activate/deactivate agents
- ✅ Agent list shows submission counts
- ✅ Can navigate to agent profile
- ✅ Can navigate to agent submissions

### Invite Agent Module
- ✅ Can invite single agent via email
- ✅ Can assign agent to multiple projects
- ✅ Invitation includes token for registration
- ✅ Can bulk upload agents via CSV/Excel
- ✅ Bulk upload shows success/failure for each email

### Agent Profile Module
- 🔄 Can view agent details and statistics
- 🔄 Shows submission timeline chart
- 🔄 Shows project breakdown
- 🔄 Shows activity metrics

### Agent Submissions Module
- 🔄 Can view all submissions by agent
- 🔄 Can filter by project/form/date
- 🔄 Pagination for large datasets
- 🔄 Can click through to submission details

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Critical (Blocking Basic Functionality)**

**Timeline:** ASAP

1. ✅ `GET /organizations` - List all organizations
2. ✅ `GET /organizations/{id}` - Single organization
3. ✅ `PATCH /organizations/{id}` - Update organization
4. ✅ `DELETE /organizations/{id}` - Delete organization
5. ✅ `POST /invitations/{id}/resend` - Resend invitation
6. ✅ `DELETE /invitations/{id}` - Delete invitation

**Impact:** Without these, the SuperAdmin interface is non-functional.

---

### **Phase 2: Dashboard Charts (Replace Mock Data)**

**Timeline:** High Priority

7. ✅ `GET /admin/analytics/submissions/timeline`
8. ✅ `GET /admin/analytics/organizations/growth`
9. ✅ `GET /admin/analytics/users/registrations`
10. ✅ `GET /admin/analytics/projects/timeline`
11. ✅ `GET /admin/analytics/activity/heatmap`

**Impact:** Dashboard currently shows realistic-looking but fake data.

---

### **Phase 3: Enhancements (UX & Performance)**

**Timeline:** Medium Priority

- ✅ Add `createdAt` to invitation responses
- ✅ Enhance dashboard stats with growth rates
- ✅ Add counts to organization responses
- ✅ Implement pagination

**Impact:** Better performance and user experience.

---

## 📋 TESTING CHECKLIST

### Organizations CRUD

```bash
# List organizations
GET /organizations?isActive=true&search=wild

# Get single org
GET /organizations/1

# Update org
PATCH /organizations/1
{
  "name": "Updated Name",
  "isActive": false
}

# Delete org
DELETE /organizations/1
```

### Invitations

```bash
# Resend invitation
POST /invitations/1/resend

# Delete invitation
DELETE /invitations/1
```

### Analytics (all SuperAdmin only)

```bash
# Submission timeline
GET /admin/analytics/submissions/timeline?days=60&groupBy=day

# Org growth
GET /admin/analytics/organizations/growth?period=12months

# User registrations
GET /admin/analytics/users/registrations?period=12months

# Project timeline
GET /admin/analytics/projects/timeline?period=12months

# Activity heatmap
GET /admin/analytics/activity/heatmap?days=30
```

---

## 🔐 AUTHORIZATION REQUIREMENTS

**All endpoints** require:

- Valid JWT Bearer token
- Role: `SuperAdmin`

**Error Response (403 Forbidden):**

```json
{
  "error": "User does not have the required role to access this resource"
}
```

---

## 💡 IMPLEMENTATION NOTES

### SQL Optimization Tips

1. **Time-series queries** - Use database date functions for grouping:

```sql
-- PostgreSQL example
SELECT
  DATE_TRUNC('day', "CreatedAt") as date,
  COUNT(*) as count
FROM "Submissions"
WHERE "CreatedAt" >= NOW() - INTERVAL '60 days'
GROUP BY DATE_TRUNC('day', "CreatedAt")
ORDER BY date ASC
```

1. **Counts in organization list** - Use LEFT JOINs with GROUP BY

2. **Pagination** - Use OFFSET/LIMIT with total count query:

```sql
-- Get total count
SELECT COUNT(*) FROM Organizations WHERE ...

-- Get page data
SELECT * FROM Organizations
WHERE ...
ORDER BY CreatedAt DESC
LIMIT 10 OFFSET 20
```

### Caching Recommendations

Consider caching for:

- Dashboard stats (5-10 minute cache)
- Time-series analytics (1 hour cache)
- Organization counts (10 minute cache)

---

## 📞 FRONTEND CONTACT POINTS

The frontend uses these API client methods:

```typescript
// Organizations
api.getOrganizations()
api.getOrganization(id)
api.createOrganization(data)
api.updateOrganization(id, data)
api.deleteOrganization(id)
api.createAdminForOrganization(orgId, email)

// Invitations
api.getInvitations(?status=Pending)
api.createInvitation(data)
api.resendInvitation(id)
api.deleteInvitation(id)

// Analytics
api.getDashboardStats()
api.getSubmissionsTimeline(params)
api.getOrganizationsGrowth(params)
api.getUsersRegistrations(params)
api.getProjectsTimeline(params)
api.getActivityHeatmap(params)
```

**API Client Location:** `src/lib/api/client.ts`

---

## ✅ ACCEPTANCE CRITERIA

### Organizations Module

- ✅ Can list all organizations with filters
- ✅ Can search organizations by name/email
- ✅ Can view single organization details
- ✅ Can update organization fields
- ✅ Can delete (soft delete) organization
- ✅ Organization list shows user/project counts

### Invitations Module

- ✅ Can resend invitation with new token
- ✅ Can delete pending invitations
- ✅ Invitations include createdAt timestamp
- ✅ Cannot delete accepted invitations

### Dashboard Module

- ✅ All 20+ charts show real data (not mock)
- ✅ Time-series data properly formatted
- ✅ Analytics endpoints return data in Chart.js compatible format
- ✅ Dashboard stats include growth metrics

---

## 🔷 AGENT PWA - FIELD DATA COLLECTION ENDPOINTS (NEW - v3.0)

**Context:** The Agent PWA is a mobile-first, offline-capable Progressive Web App for field workers. Agents view assigned projects, fill forms, and submit data with automatic syncing when online.

### 1️⃣ Get Agent Projects (High Priority)

#### **GET /projects**

Returns only projects assigned to the authenticated agent, filtered by their projectsAssigned array.

**Auth:** Agent

**Request:**

```http
GET /projects
Authorization: Bearer {agentToken}
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Wildlife Census 2026",
    "description": "Annual elephant population survey",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-12-31T23:59:59Z",
    "status": "Active",
    "formCount": 3,
    "submissionCount": 45
  },
  {
    "id": 2,
    "name": "Habitat Assessment",
    "description": "Evaluate wildlife habitats",
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-06-30T23:59:59Z",
    "status": "Draft",
    "formCount": 2,
    "submissionCount": 0
  }
]
```

**Enhanced Fields:**
- Include `formCount` - Number of active forms for this project
- Include `submissionCount` - Number of submissions by this agent for this project

**Business Logic:**
- Only return projects where `projectId` is in user's `projectsAssigned` array
- Agent can only see their own organization's projects
- Include all project statuses (Draft, Active, Completed, Archived)

**Errors:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not an Agent

**Frontend Usage:** `api.getAgentProjects()`

**Frontend Location:** `src/routes/(agent)/projects/+page.svelte`

---

### 2️⃣ Get Project Forms (High Priority)

#### **GET /forms/project/{projectId}**

Returns all active forms for the specified project.

**Auth:** Agent, Admin

**Request:**

```http
GET /forms/project/1
Authorization: Bearer {agentToken}
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "projectId": 1,
    "name": "Wildlife Sighting Form",
    "schema": "{\"fields\":[...]}",
    "metadata": "{\"icon\":\"🦁\",\"primaryColor\":\"#4A90E2\"}",
    "version": 1,
    "isActive": true,
    "createdAt": "2026-02-14T12:06:00Z"
  },
  {
    "id": 2,
    "projectId": 1,
    "name": "Habitat Assessment",
    "schema": "{\"fields\":[...]}",
    "metadata": "{\"icon\":\"🌳\",\"primaryColor\":\"#10B981\"}",
    "version": 1,
    "isActive": true,
    "createdAt": "2026-02-14T13:15:00Z"
  }
]
```

**Schema Field Types:**
- `text` - Free text input
- `number` - Numeric input
- `boolean` - Yes/No checkbox
- `select` - Dropdown with options array
- `datetime` - Date/time picker

**Example Schema Structure:**
```json
{
  "fields": [
    {
      "id": "observer_name",
      "type": "text",
      "label": "Observer Name",
      "required": true
    },
    {
      "id": "animal_type",
      "type": "select",
      "label": "Animal Type",
      "required": true,
      "options": ["Elephant", "Lion", "Giraffe", "Zebra"]
    },
    {
      "id": "count",
      "type": "number",
      "label": "Number of Animals",
      "required": true
    }
  ]
}
```

**Business Logic:**
- Agent must be assigned to this project
- Only return `isActive = true` forms
- Forms returned in creation order

**Errors:**
- `404 Not Found` - Project doesn't exist
- `403 Forbidden` - Agent not assigned to this project

**Frontend Usage:** `api.getProjectForms(projectId)`

**Frontend Location:** `src/routes/(agent)/projects/[projectId]/forms/+page.svelte`

---

### 3️⃣ Submit Single Submission (High Priority)

#### **POST /submissions**

Create a new submission for a form. Supports offline-first with `localSyncId`.

**Auth:** Agent, Admin

**Request:**

```http
POST /submissions
Authorization: Bearer {agentToken}
Content-Type: application/json

{
  "projectId": 1,
  "formId": 1,
  "answers": {
    "observer_name": "John Kamau",
    "location": "-1.2921, 36.8219",
    "animal_type": "Elephant",
    "count": 12,
    "behavior": "Feeding"
  },
  "localSyncId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `201 Created`

```json
{
  "id": 245,
  "organizationId": 1,
  "projectId": 1,
  "formId": 1,
  "submittedByUserId": 3,
  "answers": {
    "observer_name": "John Kamau",
    "location": "-1.2921, 36.8219",
    "animal_type": "Elephant",
    "count": 12,
    "behavior": "Feeding"
  },
  "localSyncId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-02-17T10:30:00Z",
  "syncedAt": "2026-02-17T10:30:05Z"
}
```

**Business Logic:**
- `organizationId` and `submittedByUserId` automatically set from JWT token
- `localSyncId` (UUID) used for duplicate prevention - reject if already exists
- Validate `answers` against form schema (required fields, field types)
- `createdAt` is when submission was created on client (from request if provided, otherwise server time)
- `syncedAt` is when submission reached server

**Validation:**
- Agent must be assigned to the project
- Form must exist and belong to specified project
- Form must be active (`isActive = true`)
- All required fields must be present in answers
- Field types must match schema

**Errors:**
- `400 Bad Request` - Validation errors or duplicate localSyncId
- `404 Not Found` - Form or project doesn't exist
- `403 Forbidden` - Agent not assigned to project

**Frontend Usage:** `api.submitData(submissionData)`

**Frontend Location:** `src/routes/(agent)/projects/[projectId]/forms/[formId]/+page.svelte`

---

### 4️⃣ Bulk Submit Submissions (Critical for Offline Sync)

#### **POST /submissions/bulk**

Submit multiple submissions at once. Used for syncing offline submissions.

**Auth:** Agent

**Request:**

```http
POST /submissions/bulk
Authorization: Bearer {agentToken}
Content-Type: application/json

{
  "submissions": [
    {
      "projectId": 1,
      "formId": 1,
      "answers": {...},
      "localSyncId": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-02-17T09:15:00Z"
    },
    {
      "projectId": 1,
      "formId": 2,
      "answers": {...},
      "localSyncId": "550e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2026-02-17T09:30:00Z"
    },
    {
      "projectId": 1,
      "formId": 1,
      "answers": {...},
      "localSyncId": "550e8400-e29b-41d4-a716-446655440003",
      "createdAt": "2026-02-17T10:00:00Z"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "localSyncId": "550e8400-e29b-41d4-a716-446655440001",
      "success": true,
      "submissionId": 245
    },
    {
      "localSyncId": "550e8400-e29b-41d4-a716-446655440002",
      "success": true,
      "submissionId": 246
    },
    {
      "localSyncId": "550e8400-e29b-41d4-a716-446655440003",
      "success": false,
      "error": "Duplicate submission - localSyncId already exists"
    }
  ]
}
```

**Business Logic:**
- Process all submissions, continue on individual errors
- Skip submissions with duplicate `localSyncId` (already synced)
- Preserve client `createdAt` timestamp for accurate reporting
- Set `syncedAt` to current server time
- Return individual success/failure for each submission

**Validation:**
- Same validation as single submission endpoint
- Maximum 100 submissions per request

**Errors:**
- `400 Bad Request` - Invalid request format or too many submissions
- `403 Forbidden` - User is not an Agent

**Frontend Usage:** `api.bulkSubmitData(submissions)`

**Frontend Location:** `src/routes/(agent)/sync/+page.svelte`

---

### 5️⃣ Get Project Submissions (Medium Priority)

#### **GET /submissions/project/{projectId}**

Returns all submissions for a specific project. Agents only see their own submissions.

**Auth:** Agent, Admin

**Request:**

```http
GET /submissions/project/1
Authorization: Bearer {agentToken}
```

**Response:** `200 OK`

```json
[
  {
    "id": 245,
    "projectId": 1,
    "formId": 1,
    "formName": "Wildlife Sighting Form",
    "answers": {
      "observer_name": "John Kamau",
      "location": "-1.2921, 36.8219",
      "animal_type": "Elephant",
      "count": 12
    },
    "localSyncId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-02-17T10:30:00Z",
    "syncedAt": "2026-02-17T10:30:05Z"
  },
  {
    "id": 246,
    "projectId": 1,
    "formId": 2,
    "formName": "Habitat Assessment",
    "answers": {...},
    "localSyncId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-02-17T11:15:00Z",
    "syncedAt": "2026-02-17T11:15:03Z"
  }
]
```

**Enhanced Fields:**
- Include `formName` for display purposes

**Business Logic:**
- Agents only see submissions they created (`submittedByUserId = agentId`)
- Admins see all submissions for the project in their organization
- Ordered by `createdAt` descending (newest first)

**Errors:**
- `404 Not Found` - Project doesn't exist
- `403 Forbidden` - Agent not assigned to project

**Frontend Usage:** `api.getProjectSubmissions(projectId)`

**Frontend Location:** `src/routes/(agent)/projects/[projectId]/submissions/+page.svelte`

---

## 📝 ENDPOINT ENHANCEMENTS FOR AGENT PWA

### Enhancement 1: Projects Endpoint - Include Form and Submission Counts

**Current Endpoint:** `GET /projects`

**Add These Fields to Each Project:**

```json
{
  "id": 1,
  "name": "Wildlife Census 2026",
  // ... all existing fields
  // ADD THESE:
  "formCount": 3,           // Number of active forms
  "submissionCount": 45     // Agent's submission count for this project
}
```

**Why Needed:** Projects list needs to show form availability and submission progress without N+1 queries

**Implementation Suggestion:**
```sql
-- For agents, only return assigned projects with counts
SELECT p.*,
  (SELECT COUNT(*) FROM Forms f WHERE f.ProjectId = p.Id AND f.IsActive = true) as formCount,
  (SELECT COUNT(*) FROM Submissions s WHERE s.ProjectId = p.Id AND s.SubmittedByUserId = @userId) as submissionCount
FROM Projects p
INNER JOIN JSON_CONTAINS(u.ProjectsAssigned, CAST(p.Id AS JSON)) -- PostgreSQL equivalent
WHERE u.Id = @userId
```

---

### Enhancement 2: Submissions - Include Form Name

**Current Endpoint:** `GET /submissions/project/{projectId}`

**Add Form Name to Response:**

```json
{
  "id": 245,
  "formId": 1,
  "formName": "Wildlife Sighting Form",  // ADD THIS
  // ... rest of fields
}
```

**Why Needed:** Submissions list shows form names without additional queries

---

## 🎯 IMPLEMENTATION PRIORITY - AGENT PWA

### **Phase 1: Core Field Data Collection (HIGH PRIORITY)**

**Timeline:** Immediate - Blocking PWA functionality

1. ✅ `GET /projects` - Get agent's assigned projects with counts
2. ✅ `GET /forms/project/{projectId}` - Get forms for project
3. ✅ `POST /submissions` - Submit single submission with localSyncId
4. ✅ `POST /submissions/bulk` - Bulk sync offline submissions
5. ✅ `GET /submissions/project/{projectId}` - View project submissions

**Impact:** Without these, agents cannot collect or sync field data

---

### **Phase 2: Enhancements (MEDIUM PRIORITY)**

**Timeline:** Nice to have

6. ✅ Add formCount and submissionCount to `/projects` response
7. ✅ Add formName to submissions responses

**Impact:** Improves UX by reducing additional API calls

---

## 📋 TESTING CHECKLIST - AGENT PWA

### Agent Projects
```bash
# Get assigned projects
GET /projects
Headers: Authorization: Bearer {agentToken}

# Verify only assigned projects returned
# Verify formCount and submissionCount included
```

### Forms and Submissions
```bash
# Get project forms
GET /forms/project/1

# Submit single submission
POST /submissions
{
  "projectId": 1,
  "formId": 1,
  "answers": {...},
  "localSyncId": "uuid-here"
}

# Bulk sync submissions
POST /submissions/bulk
{
  "submissions": [
    {...},
    {...}
  ]
}

# Get project submissions
GET /submissions/project/1
```

### Offline Sync Testing
1. Agent creates 5 submissions offline (stored in IndexedDB)
2. Agent goes online
3. Bulk sync POST /submissions/bulk with all 5 submissions
4. Verify response shows successful: 5, failed: 0
5. Try re-syncing same submissions
6. Verify duplicate localSyncId rejection

---

## 📞 FRONTEND CONTACT POINTS - AGENT PWA

The Agent PWA uses these API client methods:

```typescript
// Agent Projects
api.getAgentProjects()              // View assigned projects

// Agent Forms
api.getProjectForms(projectId)      // Get forms for project

// Agent Submissions
api.submitData(submissionData)      // Submit single submission
api.bulkSubmitData(submissions)     // Bulk sync offline submissions
api.getProjectSubmissions(projectId) // View project submissions
```

**Frontend Locations:**
- `src/routes/(agent)/projects/+page.svelte` - Projects list
- `src/routes/(agent)/projects/[projectId]/forms/+page.svelte` - Forms list
- `src/routes/(agent)/projects/[projectId]/forms/[formId]/+page.svelte` - Form filling
- `src/routes/(agent)/projects/[projectId]/submissions/+page.svelte` - Submissions list
- `src/routes/(agent)/sync/+page.svelte` - Sync management

---

## ✅ ACCEPTANCE CRITERIA - AGENT PWA

### Projects List Module
- ✅ Agent sees only assigned projects
- ✅ Projects grouped by status (Active, Upcoming, Ended)
- ✅ Shows form count and submission count per project
- ✅ Can't open projects outside their date range
- ✅ Can view submissions for ended projects

### Forms Module
- ✅ Can view all active forms for assigned project
- ✅ Forms show schema with field types
- ✅ Can fill out form fields based on type
- ✅ Required field validation

### Submissions Module
- ✅ Can submit data for assigned projects
- ✅ Submissions stored offline in IndexedDB
- ✅ Auto-sync when online
- ✅ Manual sync option available
- ✅ Duplicate submissions prevented via localSyncId
- ✅ Can view all own submissions for a project

### Sync Module
- 🔄 Shows sync status (pending count, last sync time)
- 🔄 Manual sync button
- 🔄 Displays sync errors
- 🔄 Shows sync history/log

---

## 🚀 NEXT STEPS

1. **Review this document** - Validate requirements with backend team
2. **Implement Phase 1** - Organizations CRUD + Invitations
3. **Test Phase 1** - Verify frontend integration works
4. **Implement Phase 2** - Analytics endpoints
5. **Replace mock data** - Frontend connects real endpoints
6. **Implement Phase 3** - Enhancements and optimizations

---

## 📚 REFERENCES

- **Backend Documentation:** `BACKEND_DOCUMENTATION.md`
- **Frontend Code:**
  - `src/routes/(superadmin)/organizations/+page.svelte`
  - `src/routes/(superadmin)/invitations/+page.svelte`
  - `src/routes/(superadmin)/dashboard/+page.svelte`
- **API Client:** `src/lib/api/client.ts`

---

**Document Version:** 2.0
**Last Updated:** February 17, 2026
**Status:** Ready for Backend Implementation
**New in v2.0:** Added Admin Agent Management endpoints (5 new endpoints + 1 enhancement)
