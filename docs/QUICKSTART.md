# FieldScope Frontend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Backend server running on `http://localhost:5083`

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

## 🔐 Testing Authentication

### 1. Login as SuperAdmin

Navigate to: `http://localhost:5173/login`

**Demo Credentials:**
```
Email: superadmin@fieldscope.com
Password: SuperAdmin123!
```

After login, you'll be redirected to `/dashboard`

### 2. Test Complete Profile Flow

**Option A: Via SuperAdmin (Recommended)**
1. Login as SuperAdmin
2. Go to Organizations (`/organizations`)
3. Click "Create Organization"
4. Fill in organization details (only name is required)
5. Click "Create Organization"
6. Find your new organization in the list
7. Click "Add Admin" button
8. Enter an email address (e.g., `admin@test.com`)
9. Copy the token from the success message
10. Logout
11. Go to `/complete-profile?token={paste-token-here}`
12. Set a password (min 6 characters)
13. Complete profile
14. Login with new credentials

**Option B: Manual Token**
1. Get an invitation token from backend testing
2. Navigate to `/complete-profile?token={your-token}`
3. Enter the token (pre-filled from URL)
4. Set your password
5. Login

### 3. Test Password Reset

1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check backend console for reset token (in development)
5. Navigate to `/reset-password?token={reset-token}`
6. Enter new password
7. Login with new password

## 📱 SuperAdmin Features to Test

### Dashboard (`/dashboard`)
- View organization statistics
- User breakdown by role
- Project metrics
- Submission activity
- Top organizations
- Invitation metrics

### Organizations (`/organizations`)
- **Create**: Click "Create Organization" button
- **View**: See all organizations in grid layout
- **Add Admin**: Click "Add Admin" on any organization card
- **Copy Token**: Use copy button to get invitation token

### Invitations (`/invitations`)
- **Filter**: Use filter buttons (All, Pending, Accepted, Expired)
- **View Stats**: See invitation metrics at the top
- **Track Status**: Monitor invitation acceptance

### System Monitoring (`/system/monitoring`)
- **Auto-refresh**: Updates every 30 seconds
- **Activity Metrics**: View submission trends
- **Organization Health**: Active vs dormant
- **Top Performers**: Organizations by activity

### System Health (`/system/health`)
- **Database Status**: Connection and migrations
- **Background Jobs**: Hangfire monitoring
- **Performance**: Response time, uptime, memory
- **Manual Refresh**: Click refresh button

## 🎨 UI Components

All components are in `src/lib/components/ui/`:
- Button (5 variants)
- Card suite
- Badge (5 variants)
- Input & Label
- Dialog (modals)
- StatCard (dashboard stats)

### Usage Example

```svelte
<script>
  import { Button, Card, Badge } from '$lib/components/ui';
</script>

<Card>
  <div class="p-6">
    <h3 class="text-xl font-bold">My Card</h3>
    <Badge variant="success">Active</Badge>
    <Button variant="secondary">Click Me</Button>
  </div>
</Card>
```

## 🔧 Configuration

### API Base URL
Located in `src/lib/api/client.ts`:
```typescript
const API_BASE_URL = 'http://localhost:5083';
```

Change this to your backend URL if different.

### Authentication Storage
Tokens and user info are stored in `localStorage`:
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `user` - User object (id, email, role, organizationId)

## 🐛 Troubleshooting

### "Network error" on login
- Ensure backend is running on `http://localhost:5083`
- Check browser console for CORS errors
- Verify API_BASE_URL in client.ts

### Redirects not working
- Clear localStorage and try again
- Check browser console for errors
- Ensure you're using latest code

### "403 Forbidden" errors
- Token may have expired (15 min lifetime)
- Logout and login again
- Check your role matches the required permission

### Auto-refresh not working
- Refresh token may have expired (6 days)
- Logout and login again
- Check browser console

## 📝 Development Notes

### File Structure
```
src/
├── lib/
│   ├── api/client.ts          # API client
│   ├── auth.ts                # Auth utilities
│   ├── utils.ts               # Utility functions
│   └── components/ui/         # UI components
└── routes/
    ├── (auth)/                # Auth pages (login, etc)
    │   ├── login/
    │   ├── complete-profile/
    │   ├── forgot-password/
    │   └── reset-password/
    └── (superadmin)/          # SuperAdmin pages
        ├── dashboard/
        ├── organizations/
        ├── invitations/
        └── system/
```

### Adding New Protected Routes
1. Create route in appropriate group: `(superadmin)`, `(admin)`, or `(agent)`
2. Add `+layout.ts` if needed for role checking
3. Use auth utilities from `$lib/auth`

### Creating New UI Components
1. Add to `src/lib/components/ui/`
2. Follow existing patterns (Svelte 5 runes)
3. Export from `index.ts`
4. Use Tailwind CSS for styling

## ✅ Testing Checklist

- [ ] Login with SuperAdmin
- [ ] Navigate all SuperAdmin pages
- [ ] Create an organization
- [ ] Invite an admin
- [ ] Complete profile with invitation
- [ ] Test password reset flow
- [ ] Filter invitations
- [ ] View system monitoring
- [ ] Check system health
- [ ] Test logout
- [ ] Verify auto-redirect on root URL
- [ ] Verify protected route access

## 🎯 Next Steps

1. **Test thoroughly** - Go through all features
2. **Admin Section** - Build admin dashboard and features
3. **Agent Section** - Build agent interface
4. **Charts** - Add chart visualizations
5. **Offline Sync** - Implement for agents

## 📚 Documentation

- `README_SUPERADMIN.md` - SuperAdmin features
- `README_AUTH.md` - Authentication system
- Backend docs: `../server/DOCUMENTATION.md`

---

**Happy coding! 🚀**
