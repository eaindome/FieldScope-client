# FieldScope API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:5083`  
**Framework:** ASP.NET Core 10.0  
**Database:** PostgreSQL (Neon.tech)  
**Authentication:** JWT Bearer Tokens

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Organizations](#organization-endpoints)
   - [Users](#user-endpoints)
   - [Projects](#project-endpoints)
   - [Forms](#form-endpoints)
   - [Submissions](#submission-endpoints)
   - [Views](#view-endpoints)
   - [Invitations](#invitation-endpoints)
   - [Admin (SuperAdmin Only)](#admin-endpoints)
6. [Error Handling](#error-handling)
7. [Multi-Tenant Isolation](#multi-tenant-isolation)
8. [UI Metadata](#ui-metadata)
9. [Frontend Development Notes](#frontend-development-notes)

---

## Project Overview

**FieldScope** is a multi-tenant field data collection and analytics platform designed for organizations conducting fieldwork, research, and data gathering operations. It enables:

- **Multi-organization support** with complete data isolation
- **Role-based access control** (SuperAdmin, Admin, Agent)
- **Dynamic form creation** with flexible schemas
- **Offline-first data collection** with sync capabilities
- **Real-time analytics** and visualization
- **Invitation-based user onboarding**

### Use Cases

- Wildlife conservation field surveys
- Healthcare data collection
- Agricultural monitoring
- Environmental research
- Social research and surveys

---

## Architecture & Design

### Clean Architecture Layers

```bash
FieldScope.Api/          → Presentation Layer (Controllers, DTOs, Middleware)
FieldScope.Application/  → Business Logic Layer (Services, Validators, Analytics)
FieldScope.Infrastructure/ → Data Access Layer (DbContext, Migrations, JWT)
FieldScope.Domain/       → Core Domain (Entities, Interfaces)
```

### Key Design Patterns

1. **Multi-Tenancy**
   - Organization-based data segregation
   - Automatic `OrganizationId` assignment via interceptors
   - Query filters prevent cross-tenant data leaks

2. **Offline-First Design**
   - `LocalSyncId` (GUID) for client-side record identification
   - Duplicate prevention based on `LocalSyncId`
   - Bulk submission endpoints for efficient syncing

3. **Dynamic Schema Management**
   - JSON-based form schemas stored as JSONB in PostgreSQL
   - Flexible field types: text, number, boolean, select, datetime
   - Runtime validation against form schemas

4. **Analytics Engine**
   - SQL-based aggregation queries
   - Configurable chart definitions (number, pie, donut, line, bar, stackedBar)
   - Field-level data analysis

---

## Authentication & Authorization

### JWT Token Structure

**Access Token** (15 minutes expiry):

```json
{
  "sub": "userId",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin",
  "email": "user@example.com",
  "organizationId": "1",
  "exp": 1771160447,
  "iss": "FieldScope",
  "aud": "FieldScope"
}
```

**Refresh Token** (6 days expiry):

```json
{
  "sub": "userId",
  "jti": "unique-token-id",
  "token_type": "refresh",
  "exp": 1771678685,
  "iss": "FieldScope",
  "aud": "FieldScope"
}
```

### Authorization Header

```bash
Authorization: Bearer {accessToken}
```

### User Roles

| Role | Permissions | Use Case |
| -------- | ------------- | ---------- |
| **SuperAdmin** | Create organizations, manage all data | Platform administrator |
| **Admin** | Manage organization, create projects/forms, invite users | Organization manager |
| **Agent** | Submit data, view assigned projects | Field worker |

---

## Data Models

### Organization

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
  "updatedAt": "2026-02-14T12:00:00Z"
}
```

**Note:** Only `name` and `isActive` are required. All other fields are optional.

### Project

```json
{
  "id": 1,
  "organizationId": 1,
  "name": "Elephant Population Survey 2026",
  "description": "Annual census...",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "status": "Draft",  // "Draft" | "Active" | "Completed" | "Archived"
  "createdByUserId": 2,
  "createdAt": "2026-02-14T12:05:20Z",
  "updatedAt": "2026-02-14T12:05:20Z"
}
```

### Form Schema

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "name": "Daily Elephant Sighting",
  "schema": "{\"fields\":[...]}",  // JSON string
  "metadata": "{\"icon\":\"🐘\",\"primaryColor\":\"#4A90E2\"}",  // JSON string (optional)
  "version": 1,
  "isActive": true,
  "createdAt": "2026-02-14T12:06:00Z",
  "updatedAt": "2026-02-14T12:06:00Z"
}
```

**Schema Structure (parsed from JSON string):**

```json
{
  "fields": [
    {
      "id": "location",           // Field identifier (used in answers)
      "type": "text",              // "text" | "number" | "boolean" | "select" | "datetime"
      "label": "GPS Location",     // Display label
      "required": true,            // Optional validation
      "options": ["A", "B", "C"]   // For select fields only
    }
  ]
}
```

### Submission

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "formId": 1,
  "submittedByUserId": 3,
  "answers": {
    "location": "-2.6522, 37.2606 (Amboseli North)",
    "herd_size": 12,
    "adults": 8,
    "behavior": "Feeding"
  },
  "localSyncId": "00000000-0000-0000-0001-000000000001",
  "createdAt": "2026-02-14T12:30:00Z",
  "syncedAt": "2026-02-14T12:30:05Z",
  "updatedAt": "2026-02-14T12:30:00Z"
}
```

### View (Chart Definition)

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "name": "Total Elephant Count",
  "definition": "{\"description\":\"...\",\"chartType\":\"number\",\"config\":{...}}",
  "metadata": "{\"width\":300,\"height\":200,\"displayFormat\":\"large-number\"}",  // JSON string (optional)
  "createdByUserId": 2,
  "createdAt": "2026-02-14T13:00:00Z",
  "updatedAt": "2026-02-14T13:00:00Z"
}
```

**Definition Structure (parsed from JSON string):**

```json
{
  "description": "Sum of all elephants sighted",
  "chartType": "number",  // "number" | "pie" | "donut" | "line" | "bar" | "stackedBar"
  "config": {
    "formId": 1,
    "aggregation": "sum",  // "sum" | "count" | "average"
    "field": "herd_size",
    "groupBy": "behavior",
    "xAxis": "createdAt",
    "yAxis": "herd_size"
  }
}
```

### User

```json
{
  "id": 3,
  "organizationId": 1,
  "email": "james.kamau@eawf.org",
  "role": "Agent",
  "isActive": true,
  "createdAt": "2026-02-14T12:10:00Z",
  "updatedAt": "2026-02-14T12:10:00Z"
}
```

### Invitation

```json
{
  "id": 1,
  "organizationId": 1,
  "email": "newuser@example.com",
  "role": "Agent",
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "Pending",  // "Pending" | "Accepted" | "Expired"
  "expiresAt": "2026-02-21T12:00:00Z",
  "sentByUserId": 2,
  "createdAt": "2026-02-14T12:00:00Z"
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Login

**POST** `/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "role": "Admin",
    "organizationId": 1
  }
}
```

**Errors:**

- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account inactive

---

#### 2. Refresh Token

**POST** `/auth/refresh`

**Request:**

```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

**Errors:**

- `401 Unauthorized` - Invalid or expired refresh token

---

#### 3. Get Current User Profile

**GET** `/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "id": 3,
  "email": "james.kamau@eawf.org",
  "role": "Agent",
  "organizationId": 1,
  "isActive": true
}
```

---

#### 4. Forgot Password

**POST** `/auth/forgot-password`

**Auth:** None (public endpoint)

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Notes:**

- Always returns success message to prevent email enumeration
- Sends email with reset token valid for 1 hour
- Token is a secure random 64-character string
- In development, token may be logged to console

---

#### 5. Reset Password

**POST** `/auth/reset-password`

**Auth:** None (public endpoint)

**Request:**

```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password has been reset successfully."
}
```

**Errors:**

- `400 Bad Request` - Invalid or expired token
- `400 Bad Request` - Password must be at least 6 characters

**Validation:**

- Token must be valid and not expired (1 hour lifetime)
- Password must be at least 6 characters
- Token is cleared after successful reset

---

### Organization Endpoints

#### 1. Create Organization

**POST** `/organizations`

**Auth:** SuperAdmin only

**Request:**

```json
{
  "name": "Organization Name",
  "description": "Optional description",
  "address": "123 Main Street",
  "city": "Nairobi",
  "country": "Kenya",
  "phone": "+254-20-1234567",
  "email": "contact@org.com",
  "website": "https://org.com",
  "logoUrl": "https://org.com/logo.png",
  "timeZone": "Africa/Nairobi"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Organization Name",
  "description": "Optional description",
  "address": "123 Main Street",
  "city": "Nairobi",
  "country": "Kenya",
  "phone": "+254-20-1234567",
  "email": "contact@org.com",
  "website": "https://org.com",
  "logoUrl": "https://org.com/logo.png",
  "timeZone": "Africa/Nairobi",
  "isActive": true,
  "createdAt": "2026-02-14T12:00:00Z",
  "updatedAt": "2026-02-14T12:00:00Z"
}
```

**Note:** Only `name` is required. All other fields are optional.

---

#### 2. Create Admin for Organization

**POST** `/organizations/{organizationId}/admins`

**Auth:** SuperAdmin only

**Request:**

```json
{
  "email": "admin@example.com"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "email": "admin@example.com",
  "token": "abc123...",  // Use this token in invitation acceptance
  "status": "Pending",
  "expiresAt": "2026-02-21T12:00:00Z"
}
```

---

### User Endpoints

#### 1. Get Users in Organization

**GET** `/users`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK`

```json
[
  {
    "id": 2,
    "email": "admin@org.com",
    "role": "Admin",
    "organizationId": 1,
    "isActive": true
  },
  {
    "id": 3,
    "email": "agent@org.com",
    "role": "Agent",
    "organizationId": 1,
    "isActive": true
  }
]
```

---

#### 2. Update User Role

**PUT** `/users/{userId}/role`

**Auth:** Admin, SuperAdmin

**Request:**

```json
{
  "role": "Admin"  // "Admin" | "Agent"
}
```

**Response:** `200 OK`

```json
{
  "id": 3,
  "role": "Admin",
  "updatedAt": "2026-02-14T15:00:00Z"
}
```

---

### Project Endpoints

#### 1. Create Project

**POST** `/projects`

**Auth:** Admin, SuperAdmin

**Request:**

```json
{
  "name": "Project Name",
  "description": "Project description",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "organizationId": 1,
  "name": "Project Name",
  "description": "Project description",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "status": "Draft",
  "createdByUserId": 2,
  "createdAt": "2026-02-14T12:00:00Z",
  "updatedAt": "2026-02-14T12:00:00Z"
}
```

**Validation:**

- End date must be after start date
- User must belong to an organization

---

#### 2. Get All Projects

**GET** `/projects?status=Active`

**Auth:** Admin, SuperAdmin

**Query Parameters:**

- `status` (optional): Filter by status (Draft, Active, Completed, Archived)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "organizationId": 1,
    "name": "Project Name",
    "description": "...",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-12-31T23:59:59Z",
    "status": "Active",
    "createdByUserId": 2,
    "createdAt": "2026-02-14T12:00:00Z",
    "updatedAt": "2026-02-14T12:00:00Z"
  }
]
```

**Note:** Only returns projects belonging to user's organization

---

#### 3. Get Single Project

**GET** `/projects/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` or `404 Not Found`

---

#### 4. Update Project

**PATCH** `/projects/{id}`

**Auth:** Admin, SuperAdmin

**Request:** (all fields optional)

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "status": "Active"
}
```

**Response:** `200 OK`

---

#### 5. Delete Project

**DELETE** `/projects/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK`

```json
{
  "message": "Project deleted successfully."
}
```

---

### Form Endpoints

#### 1. Create Form

**POST** `/forms`

**Auth:** Admin, SuperAdmin

**Request:**

```json
{
  "projectId": 1,
  "name": "Daily Elephant Sighting",
  "description": "Record elephant encounters",
  "schema": {
    "fields": [
      {
        "id": "location",
        "type": "text",
        "label": "GPS Location",
        "required": true
      },
      {
        "id": "herd_size",
        "type": "number",
        "label": "Herd Size",
        "required": true
      },
      {
        "id": "behavior",
        "type": "select",
        "label": "Behavior",
        "options": ["Feeding", "Traveling", "Resting"]
      },
      {
        "id": "timestamp",
        "type": "datetime",
        "label": "Observation Time"
      },
      {
        "id": "healthy",
        "type": "boolean",
        "label": "All animals healthy?"
      }
    ]
  },
  "metadata": {
    "icon": "🐘",
    "primaryColor": "#4A90E2",
    "sections": ["demographics", "behavior", "documentation"],
    "estimatedDuration": 5
  }
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "name": "Daily Elephant Sighting",
  "schema": "{\"fields\":[...]}",
  "metadata": "{\"icon\":\"🐘\",\"primaryColor\":\"#4A90E2\",...}",
  "version": 1,
  "isActive": true,
  "createdAt": "2026-02-14T12:00:00Z",
  "updatedAt": "2026-02-14T12:00:00Z"
}
```

**Field Types:**

- `text` - String input
- `number` - Numeric input
- `boolean` - True/false checkbox
- `select` - Dropdown with predefined options
- `datetime` - Date and time picker

---

#### 2. Get Forms for Project (Query Param)

**GET** `/forms?projectId={id}&activeOnly=true`

**Auth:** Admin, SuperAdmin

**Query Parameters:**

- `projectId` (required): Project ID
- `activeOnly` (optional): Filter active forms only

**Response:** `200 OK` - Array of forms

---

#### 3. Get Forms for Project (Route Param)

**GET** `/forms/project/{projectId}?activeOnly=true`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` - Array of forms

---

#### 4. Get Single Form

**GET** `/forms/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` or `404 Not Found`

---

#### 5. Update Form

**PATCH** `/forms/{id}`

**Auth:** Admin, SuperAdmin

**Request:** (all fields optional)

```json
{
  "name": "Updated Form Name",
  "schema": {
    "fields": [...]
  },
  "metadata": {
    "icon": "🦁",
    "primaryColor": "#FFB300"
  },
  "isActive": false
}
```

**Response:** `200 OK`

**Notes:**

- Updating schema increments version number automatically
- Metadata is optional and can be updated independently
- Pass `null` to clear metadata

---

#### 6. Delete Form

**DELETE** `/forms/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK`

---

### Submission Endpoints

#### 1. Create Single Submission

**POST** `/submissions`

**Auth:** All authenticated users

**Request:**

```json
{
  "formId": 1,
  "projectId": 1,
  "answers": {
    "location": "-2.6522, 37.2606",
    "herd_size": 12,
    "behavior": "Feeding",
    "timestamp": "2026-02-14T10:30:00Z",
    "healthy": true
  },
  "localSyncId": "00000000-0000-0000-0001-000000000001"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "formId": 1,
  "submittedByUserId": 3,
  "answers": {...},
  "localSyncId": "00000000-0000-0000-0001-000000000001",
  "createdAt": "2026-02-14T12:30:00Z",
  "syncedAt": "2026-02-14T12:30:05Z",
  "updatedAt": "2026-02-14T12:30:00Z"
}
```

**Validation:**

- Form must exist and belong to user's organization
- Project must exist and belong to user's organization
- **Project must not have status "Closed"** - submissions rejected for closed projects
- Project must be within submission window (between startDate and endDate)
- Answers validated against form schema
- Required fields enforced
- Type checking (text, number, boolean, select, datetime)
- Select options validation
- Duplicate `localSyncId` returns existing submission (idempotent)

---

#### 2. Bulk Submit

**POST** `/submissions/bulk`

**Auth:** All authenticated users

**Request:**

```json
{
  "submissions": [
    {
      "formId": 1,
      "projectId": 1,
      "answers": {...},
      "localSyncId": "00000000-0000-0000-0001-000000000002"
    },
    {
      "formId": 1,
      "projectId": 1,
      "answers": {...},
      "localSyncId": "00000000-0000-0000-0001-000000000003"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "localSyncId": "00000000-0000-0000-0001-000000000002",
      "success": true,
      "submission": {...}
    },
    {
      "localSyncId": "00000000-0000-0000-0001-000000000003",
      "success": true,
      "submission": {...}
    }
  ]
}
```

**Use Case:** Offline sync - upload multiple submissions at once

---

#### 3. Get Submissions by Project

**GET** `/submissions/project/{projectId}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "organizationId": 1,
    "projectId": 1,
    "formId": 1,
    "submittedByUserId": 3,
    "answers": {...},
    "localSyncId": "...",
    "createdAt": "2026-02-14T12:30:00Z",
    "syncedAt": "2026-02-14T12:30:05Z",
    "updatedAt": "2026-02-14T12:30:00Z"
  }
]
```

**Note:** Only returns submissions from user's organization

---

#### 4. Get Submissions by Form

**GET** `/submissions/form/{formId}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` - Array of submissions filtered by form

---

#### 5. Get Single Submission

**GET** `/submissions/{id}`

**Auth:** All authenticated users

**Response:** `200 OK` or `404 Not Found`

---

### View Endpoints

#### 1. Create View

**POST** `/views`

**Auth:** Admin, SuperAdmin

**Request:**

```json
{
  "projectId": 1,
  "name": "Total Elephant Count",
  "description": "Sum of all elephants sighted",
  "chartType": "number",
  "config": {
    "formId": 1,
    "aggregation": "sum",
    "field": "herd_size"
  },
  "metadata": {
    "width": 300,
    "height": 200,
    "displayFormat": "large-number",
    "icon": "🔢",
    "refreshInterval": 300
  }
}
```

**Chart Types & Config Examples:**

**Number (Aggregated Value):**

```json
{
  "chartType": "number",
  "config": {
    "formId": 1,
    "aggregation": "sum",     // "sum" | "count" | "average"
    "field": "herd_size"
  }
}
```

**Pie/Donut (Category Distribution):**

```json
{
  "chartType": "pie",  // or "donut"
  "config": {
    "formId": 1,
    "groupBy": "behavior",
    "aggregation": "count"
  }
}
```

**Line/Bar (Time Series or Grouped):**

```json
{
  "chartType": "line",  // or "bar"
  "config": {
    "formId": 1,
    "xAxis": "createdAt",
    "yAxis": "herd_size",
    "groupBy": "day",
    "aggregation": "sum"
  }
}
```

**Stacked Bar:**

```json
{
  "chartType": "stackedBar",
  "config": {
    "formId": 1,
    "xAxis": "createdAt",
    "groupBy": "week",
    "stackBy": "submittedByUserId"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "organizationId": 1,
  "projectId": 1,
  "name": "Total Elephant Count",
  "definition": "{...}",
  "createdByUserId": 2,
  "createdAt": "2026-02-14T13:00:00Z",
  "updatedAt": "2026-02-14T13:00:00Z"
}
```

---

#### 2. Get Views for Project

**GET** `/views/project/{projectId}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` - Array of views

---

#### 3. Get Single View

**GET** `/views/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK` or `404 Not Found`

---

#### 4. Update View

**PUT** `/views/{id}`

**Auth:** Admin, SuperAdmin

**Request:** (all fields optional)

```json
{
  "name": "Updated View Name",
  "description": "Updated description",
  "chartType": "bar",
  "config": {...},
  "metadata": {
    "width": 800,
    "height": 600
  }
}
```

**Response:** `200 OK`

---

#### 5. Delete View

**DELETE** `/views/{id}`

**Auth:** Admin, SuperAdmin

**Response:** `200 OK`

---

### Invitation Endpoints

#### 1. Create Invitation

**POST** `/invitations`

**Auth:** Admin, SuperAdmin

**Request:**

```json
{
  "email": "agent@example.com",
  "role": "Agent",
  "projectIds": [1, 2, 3]  // Optional: Assign agent to specific projects
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "email": "agent@example.com",
  "role": "Agent",
  "token": "abc123-def456-...",  // Share this token with the invitee
  "status": "Pending",
  "expiresAt": "2026-02-21T12:00:00Z",
  "projectIds": [1, 2, 3]
}
```

**Note:** Token expires in 7 days

---

#### 2. Accept Invitation

**POST** `/invitations/accept`

**Auth:** None (public endpoint)

**Request:**

```json
{
  "token": "abc123-def456-...",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "message": "Invitation accepted successfully. You can now log in.",
  "email": "agent@example.com",
  "role": "Agent"
}
```

**Errors:**

- `404 Not Found` - Invalid token
- `400 Bad Request` - Expired or already accepted token

---

#### 3. Get All Invitations

**GET** `/invitations?status=Pending`

**Auth:** Admin, SuperAdmin

**Query Parameters:**

- `status` (optional): Filter by status (Pending, Accepted, Expired)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "email": "agent@example.com",
    "role": "Agent",
    "status": "Pending",
    "expiresAt": "2026-02-21T12:00:00Z",
    "sentByUserId": 2,
    "createdAt": "2026-02-14T12:00:00Z"
  }
]
```

---

## Admin Endpoints

**Access:** SuperAdmin only  
**Base Route:** `/admin`

These endpoints provide platform-wide monitoring, statistics, and system health information. Only users with the SuperAdmin role can access these endpoints. Admin and Agent users will receive a 403 Forbidden response.

### Get Dashboard Statistics

**GET** `/admin/dashboard/stats`

Retrieves comprehensive platform-wide KPIs and statistics for SuperAdmin monitoring dashboard.

**Authorization:** Bearer Token (SuperAdmin only)

**Response (200 OK):**

```json
{
  "organizations": {
    "total": 5,
    "active": 4,
    "createdThisMonth": 2,
    "dormant": 1
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
    "averagePerOrganization": 4.6
  },
  "projects": {
    "total": 12,
    "byStatus": {
      "draft": 2,
      "active": 8,
      "closed": 2
    },
    "averagePerOrganization": 2.4
  },
  "submissions": {
    "total": 487,
    "last7Days": 52,
    "last30Days": 203,
    "averagePerProject": 40.58,
    "topOrganizationsBySubmissions": [
      {
        "organizationId": 3,
        "organizationName": "Wildlife Conservation Org",
        "submissionCount": 156
      },
      {
        "organizationId": 1,
        "organizationName": "East Africa Wildlife Foundation",
        "submissionCount": 142
      }
    ]
  },
  "invitations": {
    "total": 30,
    "pending": 5,
    "accepted": 23,
    "expired": 2,
    "acceptanceRate": 82.14
  },
  "generatedAt": "2026-02-15T14:32:00Z"
}
```

**Statistics Explained:**

- **Organizations:**
  - `total`: Total number of organizations
  - `active`: Organizations with submissions in the last 30 days
  - `createdThisMonth`: Organizations created in the current month
  - `dormant`: Organizations with no submissions in the last 30 days (total - active)

- **Users:**
  - `total`: Total number of users across all organizations
  - `byRole`: User count broken down by role (SuperAdmin, Admin, Agent)
  - `active`: Users with isActive = true
  - `inactive`: Users with isActive = false
  - `averagePerOrganization`: Average number of users per organization

- **Projects:**
  - `total`: Total number of projects across all organizations
  - `byStatus`: Projects broken down by status (Draft, Active, Closed)
  - `averagePerOrganization`: Average number of projects per organization

- **Submissions:**
  - `total`: Total number of submissions across all organizations
  - `last7Days`: Submissions created in the last 7 days
  - `last30Days`: Submissions created in the last 30 days
  - `averagePerProject`: Average number of submissions per project
  - `topOrganizationsBySubmissions`: Top 10 organizations ranked by submission count

- **Invitations:**
  - `total`: Total number of invitations sent
  - `pending`: Invitations with Pending status
  - `accepted`: Invitations with Accepted status
  - `expired`: Invitations with Expired status
  - `acceptanceRate`: Percentage of non-expired invitations that were accepted

### Get System Health

**GET** `/admin/health`

Retrieves detailed system health information including database status, background jobs, and performance metrics.

**Authorization:** Bearer Token (SuperAdmin only)

**Response (200 OK):**

```json
{
  "status": "Healthy",
  "timestamp": "2026-02-15T14:35:22Z",
  "database": {
    "canConnect": true,
    "provider": "Npgsql.EntityFrameworkCore.PostgreSQL",
    "pendingMigrations": 0,
    "appliedMigrations": 2,
    "lastMigration": "20260214142244_AddMetadataToFormViewDashboard"
  },
  "backgroundJobs": {
    "status": "Healthy",
    "hangfireEnabled": true,
    "activeJobs": 3,
    "scheduledJobs": 7
  },
  "performance": {
    "databaseResponseTimeMs": 12.45,
    "serverUptimeFormatted": "2.15:34:22",
    "memoryUsageMB": 245.67
  }
}
```

**Health Metrics Explained:**

- **Database:**
  - `canConnect`: Whether the database connection is successful
  - `provider`: Database provider name (e.g., PostgreSQL, SQL Server)
  - `pendingMigrations`: Number of migrations not yet applied
  - `appliedMigrations`: Number of migrations that have been applied
  - `lastMigration`: Name of the most recently applied migration

- **Background Jobs:**
  - `status`: Overall status of background job system
  - `hangfireEnabled`: Whether Hangfire background processing is active
  - `activeJobs`: Number of currently executing jobs
  - `scheduledJobs`: Number of jobs scheduled for future execution

- **Performance:**
  - `databaseResponseTimeMs`: Database query response time in milliseconds
  - `serverUptimeFormatted`: Time since server started (days.hours:minutes:seconds)
  - `memoryUsageMB`: Current memory usage in megabytes

**Error Response (403 Forbidden):**

When a non-SuperAdmin user attempts to access admin endpoints:

```json
{
  "error": "User does not have the required role to access this resource"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description"
}
```

### Validation Error Response

```json
{
  "errors": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
| ------ | --------- | ----------- |
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Validation errors, malformed request |
| `401` | Unauthorized | Missing/invalid token, authentication failed |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist or access denied |
| `500` | Internal Server Error | Server-side error |

---

## Multi-Tenant Isolation

### Automatic OrganizationId Assignment

All entities automatically inherit `organizationId` from the authenticated user during creation.

### Query Filtering

All database queries automatically filter by `organizationId` to prevent cross-tenant data access.

### Security Guarantees

- Users can only see data from their own organization
- Admin2 from Org 2 **cannot** access Org 1's projects, forms, or submissions
- SuperAdmin can access all organizations

### Testing Multi-Tenancy

```http
# Admin from Org 1
GET /projects
Authorization: Bearer {org1AdminToken}
# Returns: Projects from Org 1 only

# Admin from Org 2
GET /projects
Authorization: Bearer {org2AdminToken}
# Returns: Projects from Org 2 only (or empty array if none exist)
```

---

## UI Metadata

### Overview

Forms, Views, and Dashboards support an optional `metadata` field for storing UI-specific information. This allows frontend applications to store presentation data without requiring backend schema changes.

### Purpose

The metadata field enables:

- **Flexible UI Configuration** - Store any UI-related data (colors, icons, dimensions, positions)
- **Separation of Concerns** - Backend doesn't need to know about UI specifics
- **Zero Backend Changes** - Add new UI features without database migrations
- **Per-Entity Customization** - Each form/view/dashboard has its own UI preferences

### Data Format

- **Type:** JSON string (nullable)
- **Storage:** PostgreSQL `text` column
- **Request:** Send as JSON object, automatically serialized
- **Response:** Returned as JSON string, parse on frontend

### Form Metadata Examples

**Dashboard Builder - Drag & Drop:**

```json
{
  "metadata": {
    "icon": "🐘",
    "primaryColor": "#4A90E2",
    "secondaryColor": "#7CB342",
    "sections": ["demographics", "behavior", "documentation"],
    "estimatedDuration": 5,
    "offlineCapable": true,
    "requiresPhoto": true,
    "customCss": "wildlife-form"
  }
}
```

**Form Presentation:**

```json
{
  "metadata": {
    "displayMode": "wizard",
    "stepsPerPage": 3,
    "showProgressBar": true,
    "allowDrafts": true,
    "theme": "dark"
  }
}
```

### View Metadata Examples

**Chart Dimensions & Position:**

```json
{
  "metadata": {
    "width": 600,
    "height": 400,
    "minWidth": 300,
    "position": { "x": 0, "y": 0 },
    "gridPosition": {
      "x": 0,
      "y": 0,
      "w": 6,
      "h": 4
    }
  }
}
```

**Chart Styling:**

```json
{
  "metadata": {
    "displayFormat": "percentage",
    "chartColors": ["#FF6384", "#36A2EB", "#FFCE56"],
    "showLegend": true,
    "legendPosition": "bottom",
    "animationDuration": 1000,
    "refreshInterval": 60,
    "exportable": true
  }
}
```

**Dashboard Layout:**

```json
{
  "metadata": {
    "zIndex": 1,
    "resizable": true,
    "draggable": true,
    "minimized": false,
    "collapsible": true
  }
}
```

### Dashboard Metadata Examples

**Dashboard Theme & Layout:**

```json
{
  "metadata": {
    "theme": "dark",
    "layout": "grid",
    "gridColumns": 12,
    "gridRows": 8,
    "gridGap": 16,
    "autoRefresh": true,
    "refreshInterval": 60,
    "backgroundColor": "#1e1e1e",
    "headerColor": "#2d2d2d",
    "customCss": "executive-dashboard"
  }
}
```

**Responsive Configuration:**

```json
{
  "metadata": {
    "breakpoints": {
      "mobile": 1,
      "tablet": 2,
      "desktop": 3
    },
    "showFilters": true,
    "filterPosition": "sidebar",
    "showExportButton": true
  }
}
```

### Usage in API Requests

**Creating with Metadata:**

```http
POST /forms
Content-Type: application/json

{
  "projectId": 1,
  "name": "Wildlife Sighting",
  "schema": {...},
  "metadata": {
    "icon": "🦁",
    "color": "#FFB300"
  }
}
```

**Updating Metadata:**

```http
PATCH /views/5
Content-Type: application/json

{
  "metadata": {
    "width": 800,
    "height": 600
  }
}
```

### Frontend Implementation

**Parsing Metadata:**

```javascript
// Response from API
const form = await api.get('/forms/1');

// Parse metadata if exists
const metadata = form.metadata ? JSON.parse(form.metadata) : {};

// Use in UI
const formIcon = metadata.icon || '📝';
const formColor = metadata.primaryColor || '#000000';
```

**React Component Example:**

```jsx
function FormCard({ form }) {
  const meta = form.metadata ? JSON.parse(form.metadata) : {};
  
  return (
    <div 
      className="form-card" 
      style={{ 
        borderColor: meta.primaryColor,
        backgroundColor: meta.backgroundColor 
      }}
    >
      <span className="icon">{meta.icon}</span>
      <h3>{form.name}</h3>
      {meta.estimatedDuration && (
        <span>~{meta.estimatedDuration} minutes</span>
      )}
    </div>
  );
}
```

**Dashboard Drag-Drop Integration:**

```javascript
// When user drags a view onto dashboard
function onViewDrop(viewId, position, dimensions) {
  const metadata = {
    gridPosition: {
      x: position.x,
      y: position.y,
      w: dimensions.width,
      h: dimensions.height
    },
    zIndex: getNextZIndex(),
    resizable: true,
    draggable: true
  };
  
  await api.patch(`/views/${viewId}`, { metadata });
}
```

### Best Practices

1. **Keep it Lightweight** - Only store UI-specific data, not business logic
2. **Validate on Frontend** - Backend doesn't validate metadata structure
3. **Provide Defaults** - Handle missing/null metadata gracefully
4. **Document Schema** - Create TypeScript interfaces for metadata structure
5. **Version Control** - If metadata schema evolves, handle backward compatibility

### TypeScript Interface Example

```typescript
interface FormMetadata {
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sections?: string[];
  estimatedDuration?: number;
  offlineCapable?: boolean;
  requiresPhoto?: boolean;
  customCss?: string;
}

interface ViewMetadata {
  width?: number;
  height?: number;
  minWidth?: number;
  position?: { x: number; y: number };
  gridPosition?: { x: number; y: number; w: number; h: number };
  displayFormat?: string;
  chartColors?: string[];
  showLegend?: boolean;
  refreshInterval?: number;
  zIndex?: number;
  resizable?: boolean;
  draggable?: boolean;
}

interface DashboardMetadata {
  theme?: 'light' | 'dark';
  layout?: 'grid' | 'freeform';
  gridColumns?: number;
  gridRows?: number;
  gridGap?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  backgroundColor?: string;
  breakpoints?: Record<string, number>;
}
```

---

## Frontend Development Notes

### 1. Token Management

**Storage:**

```javascript
// Store tokens securely
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

**Refresh Logic:**

```javascript
// Intercept 401 responses
if (response.status === 401) {
  const refreshToken = localStorage.getItem('refreshToken');
  const newTokens = await fetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
  
  // Retry original request with new token
  localStorage.setItem('accessToken', newTokens.accessToken);
  return retryRequest(originalRequest);
}
```

---

### 2. Offline-First Implementation

**Generate LocalSyncId:**

```javascript
// Use UUIDs for offline submissions
import { v4 as uuidv4 } from 'uuid';

const submission = {
  formId: 1,
  projectId: 1,
  answers: {...},
  localSyncId: uuidv4()  // "550e8400-e29b-41d4-a716-446655440000"
};

// Store in IndexedDB
await db.submissions.add(submission);
```

**Sync When Online:**

```javascript
// Bulk upload all pending submissions
const pendingSubmissions = await db.submissions
  .where('synced').equals(false)
  .toArray();

const response = await fetch('/submissions/bulk', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ submissions: pendingSubmissions })
});

// Mark as synced based on response
response.results.forEach(result => {
  if (result.success) {
    db.submissions.update(result.localSyncId, { synced: true });
  }
});
```

---

### 3. Form Schema Rendering

**Dynamic Form Generator:**

```jsx
function DynamicForm({ schema }) {
  const fields = JSON.parse(schema).fields;
  
  return (
    <form>
      {fields.map(field => {
        switch(field.type) {
          case 'text':
            return <input type="text" required={field.required} />;
          case 'number':
            return <input type="number" required={field.required} />;
          case 'boolean':
            return <input type="checkbox" />;
          case 'select':
            return (
              <select required={field.required}>
                {field.options.map(opt => <option value={opt}>{opt}</option>)}
              </select>
            );
          case 'datetime':
            return <input type="datetime-local" required={field.required} />;
        }
      })}
    </form>
  );
}
```

---

### 4. View/Chart Rendering

**Parse View Definition:**

```javascript
const view = await fetch(`/views/${id}`).then(r => r.json());
const definition = JSON.parse(view.definition);

// definition = {
//   chartType: "pie",
//   description: "...",
//   config: { formId: 1, groupBy: "behavior", aggregation: "count" }
// }

// Use with charting library (Chart.js, Recharts, etc.)
renderChart(definition.chartType, definition.config);
```

---

### 5. Role-Based UI

**Conditional Rendering:**

```jsx
function Dashboard({ user }) {
  return (
    <div>
      {user.role === 'Admin' && (
        <button onClick={createProject}>Create Project</button>
      )}
      
      {user.role === 'Agent' && (
        <button onClick={submitData}>Submit Data</button>
      )}
      
      {user.role === 'SuperAdmin' && (
        <button onClick={createOrganization}>Create Organization</button>
      )}
    </div>
  );
}
```

---

### 6. Data Structure Tips

**Schema Field Identifiers:**

- Use `field.id` (not `field.name`) as the key in submission answers
- Example: If schema has `{ "id": "herd_size", "type": "number" }`, then answers should be `{ "herd_size": 12 }`

**Date Handling:**

- Always send dates in ISO 8601 UTC format: `"2026-02-14T12:00:00Z"`
- Backend stores dates in UTC, convert to local timezone in frontend

**GUID Format:**

- LocalSyncId must be valid GUID: `"00000000-0000-0000-0001-000000000001"`
- Use UUID v4 library: `uuidv4()`

---

### 7. API Request Examples

**Axios Setup:**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5083',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### 8. State Management Suggestions

**Recommended Libraries:**

- **Redux Toolkit** - Complex state management
- **React Query** - Server state caching & sync
- **Zustand** - Lightweight state management
- **IndexedDB** - Offline data storage

**Offline Queue Pattern:**

```javascript
// Store pending actions
const offlineQueue = {
  submissions: [],
  formUpdates: [],
  viewCreations: []
};

// When online, process queue
window.addEventListener('online', async () => {
  for (const submission of offlineQueue.submissions) {
    await api.post('/submissions', submission);
  }
  offlineQueue.submissions = [];
});
```

---

### 9. Recommended UI Components

**Forms:**

- React Hook Form + Yup validation
- Dynamic field generation based on schema

**Charts:**

- Chart.js / Recharts / Victory
- Map chart types from backend to component

**Tables:**

- TanStack Table (React Table v8)
- Server-side pagination for submissions

**Date Pickers:**

- react-datepicker
- Ensure UTC conversion

---

### 10. Testing Checklist

- [ ] Login/logout flows
- [ ] Token refresh before expiry
- [ ] Offline submission queue
- [ ] Duplicate submission prevention
- [ ] Form validation against schema
- [ ] Multi-tenant data isolation
- [ ] Role-based component visibility
- [ ] Chart rendering from view definitions
- [ ] Bulk sync feedback (success/failure counts)
- [ ] Error handling (network failures, validation errors)

---

## Common Workflows

### New Organization Onboarding

1. SuperAdmin creates organization → `POST /organizations`
2. SuperAdmin invites first admin → `POST /organizations/{id}/admins`
3. Admin accepts invitation → `POST /invitations/accept`
4. Admin logs in → `POST /auth/login`
5. Admin creates project → `POST /projects`
6. Admin creates forms → `POST /forms`
7. Admin invites field agents → `POST /invitations`

---

### Field Agent Data Collection

1. Agent logs in → `POST /auth/login`
2. Agent fetches assigned projects → `GET /projects`
3. Agent fetches forms for project → `GET /forms/project/{id}`
4. Agent completes form offline → Store in IndexedDB
5. When online, bulk sync → `POST /submissions/bulk`
6. Verify sync status from response

---

### Admin Analytics

1. Admin creates visualization → `POST /views`
2. Admin fetches all views → `GET /views/project/{id}`
3. Parse view definition JSON
4. Fetch submission data → `GET /submissions/project/{id}`
5. Render chart using frontend library

---

## API Testing

Use the comprehensive test file: `Tests/EAWF-ManualTesting.http`

This file contains 72 complete test scenarios covering:

- ✅ Authentication (login, token refresh, user profile, password reset)
- ✅ Organization management (with extended fields)
- ✅ User invitations and role management
- ✅ Project CRUD operations
- ✅ Dynamic form creation with multiple field types
- ✅ Single and bulk submissions
- ✅ Duplicate prevention
- ✅ View creation (8 chart types)
- ✅ Dashboard creation with widgets
- ✅ Analytics query execution
- ✅ Multi-tenant isolation testing
- ✅ Role-based access control
- ✅ UI Metadata examples (forms, views, dashboards)
- ✅ SuperAdmin monitoring (dashboard stats, system health, access control)

---

## Support & Contact

For questions or issues:

- Check error messages (detailed validation feedback)
- Review this documentation
- Test endpoints with EAWF-ManualTesting.http
- All endpoints follow RESTful conventions

---

**Last Updated:** February 15, 2026  
**API Version:** 1.0  
**Backend Stack:** ASP.NET Core 10.0, PostgreSQL, JWT Authentication
