# FieldScope SuperAdmin Frontend

## Overview

The SuperAdmin section provides complete platform oversight and management capabilities for FieldScope administrators.

## Design System

### Color Palette
- **Primary:** Navy Blue (`#0f172a` - Slate 900)
- **Secondary:** Ocean Blue (`#1e40af` - Blue 800)
- **Accent:** Cyan (`#06b6d4` - Cyan 500)
- **Background:** Light Gray (`#f8fafc` - Slate 50)
- **Surface:** White (`#ffffff`)
- **Text:** Charcoal (`#1e293b` - Slate 800)

### Typography
- Font: System UI / Inter
- Clean, modern, professional aesthetic

## Features Implemented

### 1. Dashboard (`/dashboard`)
Comprehensive platform-wide metrics:
- **Organization Stats**: Total, Active, Created This Month, Dormant
- **User Stats**: Total users, breakdown by role (SuperAdmin, Admin, Agent)
- **Project Stats**: Total, Draft, Active, Closed
- **Submission Stats**: Total, Last 7/30 days, Average per project
- **Top Organizations**: Ranked by submission count
- **Invitation Metrics**: Total, Pending, Accepted, Expired with acceptance rate

### 2. Organizations (`/organizations`)
Organization management capabilities:
- **List View**: Grid display of all organizations
- **Create Organization**: Full form with all optional fields (address, city, country, phone, email, website, timezone)
- **Add Admin**: Invite administrators for each organization
- **Token Display**: Copy invitation tokens for admin invitations
- **Status Indicators**: Active/Inactive badges
- **Details**: Contact information, location, creation date

### 3. Invitations (`/invitations`)
Invitation tracking and management:
- **Stats Overview**: Total, Pending, Accepted, Expired counts
- **Filter Options**: View All, Pending, Accepted, or Expired invitations
- **Table View**: Email, Role, Status, Sent Date, Expiration
- **Status Icons**: Visual indicators for invitation status
- **Real-time Updates**: Filter-based data loading

### 4. System Monitoring (`/system/monitoring`)
Real-time platform monitoring:
- **Quick Stats**: Organizations, Users, Projects, Submissions
- **Activity Metrics**: Submission activity (7/30 days, average)
- **Organization Health**: Active vs Dormant status
- **Project Distribution**: Draft, Active, Closed breakdown
- **Top Organizations**: Most active by submission count
- **Auto-refresh**: Updates every 30 seconds

### 5. System Health (`/system/health`)
Infrastructure health monitoring:
- **Overall Status**: System-wide health indicator
- **Database Health**:
  - Connection status
  - Provider information
  - Migration status (applied/pending)
  - Last migration name
- **Background Jobs**:
  - Hangfire status
  - Active jobs count
  - Scheduled jobs count
- **Performance Metrics**:
  - Database response time (with quality indicators)
  - Server uptime
  - Memory usage (with threshold alerts)
- **Manual Refresh**: On-demand health check updates

## Component Library

### Core UI Components
- **Button**: Multiple variants (default, secondary, outline, ghost, destructive)
- **Card**: Container component with header, title, description, content
- **Badge**: Status indicators with color variants
- **Input**: Form input with validation states
- **Label**: Form labels
- **Dialog**: Modal dialogs with backdrop
- **StatCard**: Specialized card for dashboard statistics

### Layout Components
- **SuperAdmin Layout**: Sidebar navigation with user section
- **Navigation**: Auto-highlighting based on current route

## API Integration

### Client Service (`$lib/api/client.ts`)
- **Auto Token Refresh**: Handles 401 errors and refreshes tokens automatically
- **Request Interceptors**: Adds authentication headers
- **Error Handling**: Standardized error responses
- **Type Safety**: TypeScript interfaces for all endpoints

### Implemented Endpoints
- `GET /admin/dashboard/stats` - Platform statistics
- `GET /admin/health` - System health metrics
- `GET /organizations` - List organizations
- `POST /organizations` - Create organization
- `POST /organizations/{id}/admins` - Invite admin
- `GET /invitations` - List invitations (with filter)
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Current user info

## File Structure

```
src/
├── lib/
│   ├── api/
│   │   └── client.ts              # API client with auth
│   ├── components/
│   │   └── ui/
│   │       ├── button.svelte
│   │       ├── card.svelte
│   │       ├── badge.svelte
│   │       ├── input.svelte
│   │       ├── label.svelte
│   │       ├── dialog.svelte
│   │       ├── stat-card.svelte
│   │       └── index.ts           # Component exports
│   └── utils.ts                   # Utility functions
└── routes/
    └── (superadmin)/
        ├── +layout.svelte         # SuperAdmin layout
        ├── dashboard/
        │   └── +page.svelte       # Dashboard page
        ├── organizations/
        │   └── +page.svelte       # Organizations page
        ├── invitations/
        │   └── +page.svelte       # Invitations page
        └── system/
            ├── monitoring/
            │   └── +page.svelte   # Monitoring page
            └── health/
                └── +page.svelte   # Health page
```

## Running the Application

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Development Server**:
   ```bash
   pnpm dev
   ```

3. **Access SuperAdmin Panel**:
   - Navigate to `/dashboard` after logging in as SuperAdmin
   - Default credentials from backend:
     - Email: `superadmin@fieldscope.com`
     - Password: `SuperAdmin123!`

4. **API Configuration**:
   - Backend URL is configured in `src/lib/api/client.ts`
   - Default: `http://localhost:5083`
   - Update the `API_BASE_URL` constant if needed

## Key Features

### Authentication Flow
1. Login with SuperAdmin credentials
2. Access token stored in localStorage
3. Auto-refresh on 401 errors
4. Logout clears tokens and redirects to login

### Navigation
- Sidebar with icon-based navigation
- Active route highlighting
- Collapsible submenu for System section
- User info display at bottom

### Data Loading
- Loading states for all async operations
- Error handling with user-friendly messages
- Success notifications for actions
- Auto-refresh capabilities where applicable

### Form Handling
- Client-side validation
- Disabled states during submission
- Success/error feedback
- Form reset after successful submission

## Next Steps

To continue development:

1. **Admin Section**: Projects, Forms, Views, Dashboards
2. **Agent Section**: Form submissions, Offline sync
3. **Authentication**: Login, Registration, Password Reset pages
4. **Charts & Visualizations**: Integration with Chart.js or Recharts
5. **Real-time Updates**: WebSocket integration for live data
6. **Responsive Design**: Mobile optimization
7. **Testing**: Unit and E2E tests

## UI/UX Highlights

- **Clean & Professional**: Modern design with clear hierarchy
- **Consistent**: Reusable component library
- **Accessible**: Semantic HTML and ARIA labels
- **Responsive**: Grid layouts that adapt to screen size
- **Performant**: Optimized re-renders with Svelte 5
- **Intuitive**: Clear labels, helpful descriptions, visual feedback

## Technology Stack

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Icons**: Emoji-based (can be replaced with icon library)
- **State Management**: Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- **HTTP Client**: Fetch API with custom wrapper

---

**Built with attention to detail and user experience in mind.**
