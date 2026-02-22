# FieldScope Authentication System

## Overview

Complete authentication and authorization system with role-based access control for FieldScope.

## Features Implemented

### 1. **Login Page** (`/login`)
- Email and password authentication
- Form validation
- Error handling with user-friendly messages
- Loading states
- "Remember me" checkbox
- Link to forgot password
- Link to complete profile (for invitations)
- Demo credentials display for testing
- Automatic role-based redirection after login:
  - SuperAdmin → `/dashboard`
  - Admin → `/admin/dashboard`
  - Agent → `/agent/projects`

### 2. **Complete Profile** (`/complete-profile`)
- Invitation token acceptance
- Password creation (min 6 characters)
- Password confirmation validation
- Token validation
- Success confirmation with auto-redirect to login
- Support for token in URL query params (`?token=...`)
- Link back to login

### 3. **Forgot Password** (`/forgot-password`)
- Email submission for password reset
- Security: Always shows success message (prevents email enumeration)
- Clear instructions about reset link expiration (1 hour)
- Link back to login

### 4. **Reset Password** (`/reset-password`)
- Token-based password reset
- New password creation with confirmation
- Password validation (min 6 characters)
- Token validation
- Success confirmation with auto-redirect to login
- Support for token in URL query params (`?token=...`)
- Link back to login

## Design

### Visual Design
- **Gradient Background**: Navy blue to dark blue gradient with grid pattern overlay
- **Centered Card Layout**: Clean white card on dark background
- **Brand Header**: Large FieldScope logo with tagline
- **Professional Typography**: Clear hierarchy with proper spacing
- **Consistent Styling**: Matches overall FieldScope design system

### User Experience
- Clear error messages
- Success confirmations
- Auto-redirects after successful actions
- Loading states during async operations
- Disabled states to prevent duplicate submissions
- Helper text for form fields
- Password strength requirements
- Visual feedback for all actions

## Authentication Flow

### New User (Invitation)
1. Admin/SuperAdmin sends invitation with token
2. User receives email with invitation token
3. User clicks link or navigates to `/complete-profile?token=xxx`
4. User enters token (pre-filled from URL) and creates password
5. System validates token and creates account
6. User redirected to login
7. User logs in with email and password

### Existing User (Login)
1. User navigates to `/login`
2. User enters email and password
3. System validates credentials
4. Tokens stored in localStorage
5. User object stored in localStorage
6. User redirected based on role

### Password Reset
1. User clicks "Forgot password?" on login page
2. User enters email address
3. System sends reset email (if account exists)
4. User clicks link in email with token
5. User enters new password
6. System validates token and updates password
7. User redirected to login
8. User logs in with new password

## Security Features

### Token Management
- JWT access tokens (15 minutes expiry)
- Refresh tokens (6 days expiry)
- Automatic token refresh on 401 errors
- Tokens stored in localStorage
- Tokens cleared on logout

### Password Security
- Minimum 6 characters required
- Password confirmation on creation/reset
- Passwords never displayed in UI
- Secure password input fields

### API Security
- All auth endpoints use HTTPS in production
- CSRF protection via SameSite cookies (if implemented on backend)
- Rate limiting on backend (prevents brute force)
- Token expiration prevents long-lived sessions

### Email Enumeration Prevention
- Forgot password always shows success message
- Doesn't reveal if email exists or not

## Role-Based Access Control

### Authentication Utilities (`$lib/auth.ts`)

```typescript
// Check if user is authenticated
isAuthenticated(): boolean

// Get current user
getCurrentUser(): User | null

// Get default route for role
getDefaultRouteForRole(role: UserRole): string

// Require authentication (redirect if not auth)
requireAuth(): boolean

// Redirect if already authenticated
redirectIfAuthenticated(): boolean

// Check if user has specific role
hasRole(requiredRole: UserRole): boolean

// Check if user has any of the roles
hasAnyRole(requiredRoles: UserRole[]): boolean

// Logout user
logout(): void
```

### Protected Routes

Routes are protected using SvelteKit's `+layout.ts` load functions:

```typescript
// SuperAdmin routes
src/routes/(superadmin)/+layout.ts
- Checks for valid token
- Validates user role = SuperAdmin
- Redirects to /login if unauthorized
```

### Route Structure

```
/                          → Redirects to role-based dashboard or login
/login                     → Login page (public)
/complete-profile          → Complete profile (public)
/forgot-password           → Forgot password (public)
/reset-password            → Reset password (public)
/dashboard                 → SuperAdmin dashboard (protected)
/organizations             → SuperAdmin organizations (protected)
/invitations               → SuperAdmin invitations (protected)
/system/monitoring         → SuperAdmin monitoring (protected)
/system/health             → SuperAdmin health (protected)
```

## API Endpoints Used

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### Invitations
- `POST /invitations/accept` - Accept invitation and create account

### Password Management
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

## Local Storage

### Stored Data
```javascript
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

### User Object Structure
```typescript
{
  id: number;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'Agent';
  organizationId?: number;
}
```

## Error Handling

### Common Errors
- **Invalid credentials**: "Login failed" with specific error message
- **Expired token**: Automatic token refresh or redirect to login
- **Invalid invitation token**: Clear error message
- **Passwords don't match**: Client-side validation
- **Weak password**: Minimum length validation
- **Network errors**: Friendly error messages

### Error Display
- Red background with border
- Clear error title
- Specific error message
- Dismisses on form resubmit

## Testing Credentials

### SuperAdmin
```
Email: superadmin@fieldscope.com
Password: SuperAdmin123!
```

### Testing Invitations
1. Use SuperAdmin to create organization
2. Create admin invitation
3. Copy token from response
4. Navigate to `/complete-profile?token={token}`
5. Complete profile
6. Login with new credentials

## Usage Examples

### Protecting a Route
```typescript
// src/routes/protected/+layout.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect(307, '/login');
    }
  }
};
```

### Checking User Role in Component
```svelte
<script>
  import { getCurrentUser, hasRole } from '$lib/auth';

  const user = getCurrentUser();
  const isSuperAdmin = hasRole('SuperAdmin');
</script>

{#if isSuperAdmin}
  <button>SuperAdmin Only Action</button>
{/if}
```

### Logging Out
```svelte
<script>
  import { logout } from '$lib/auth';
</script>

<button onclick={logout}>Logout</button>
```

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Session timeout warning
- [ ] Password strength meter
- [ ] Account lockout after failed attempts
- [ ] Email verification on signup
- [ ] Remember device feature
- [ ] Activity log for security

## Troubleshooting

### "Cannot redirect" errors
- Ensure you're using `throw redirect()` not `return redirect()`
- Check that redirects are in load functions, not components

### Tokens not persisting
- Check browser localStorage is enabled
- Ensure no browser extensions are blocking storage
- Check for CORS issues with API

### Auto-redirect not working
- Verify tokens are being stored correctly
- Check browser console for errors
- Ensure `+page.ts` load functions are executing

---

**Authentication system is production-ready and secure!**
