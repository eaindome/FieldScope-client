# Test Mode vs Dev Mode

## ✅ Current Mode: TEST MODE

The application is currently in **TEST MODE** and uses mock data.

## How to Switch Modes

Edit `src/lib/config.ts`:

### For Test Mode (Mock Data)

```typescript
export const APP_MODE: 'test' | 'dev' = 'test';
```

### For Dev Mode (Real API)

```typescript
export const APP_MODE: 'test' | 'dev' = 'dev';
```

## What Changes Between Modes?

### TEST MODE (Current)

- ✅ No backend required
- ✅ Fast load times (simulated delays of 200-300ms)
- ✅ Realistic sample data for all pages
- ✅ Perfect for UI/UX testing
- ✅ Safe to experiment without affecting real data
- ❌ Can't test real API integration
- ❌ Can't create/edit data (changes not persisted)

### DEV MODE

- ✅ Real API integration
- ✅ Actual data from database
- ✅ Full CRUD operations work
- ✅ Test authentication flow
- ✅ Test real-time data updates
- ❌ Requires backend server running
- ❌ Slower if backend is remote

## Mock Data Included

### Dashboard Stats

- 12 organizations (9 active, 3 dormant)
- 156 users (2 SuperAdmins, 18 Admins, 136 Agents)
- 45 projects (8 draft, 28 active, 9 closed)
- 8,547 submissions
- 87 invitations (85% acceptance rate)

### Organizations

- 5 sample organizations
- Mix of complete and minimal data
- Various countries (Kenya, Tanzania, Uganda)
- Active and inactive statuses

### Invitations

- 8 sample invitations
- All statuses (Pending, Accepted, Expired)
- Different roles (Admin, Agent)

### System Health

- Healthy status
- PostgreSQL database
- 15 days uptime
- Low memory usage (347 MB)
- Fast response time (12ms)

## When to Use Each Mode?

### Use TEST MODE when

- 🎨 Designing and reviewing UI/UX
- 📱 Testing responsive design
- 🖱️ Testing interactions and animations
- 👀 Showing demos to stakeholders
- 🚀 Developing new features (frontend only)
- 📊 Testing with consistent, predictable data

### Use DEV MODE when

- 🔌 Testing API integration
- 🔐 Testing authentication flows
- 💾 Testing data persistence
- 🐛 Debugging backend issues
- ✅ End-to-end testing
- 🚀 Preparing for production

## Quick Switch

Just change ONE line in `src/lib/config.ts`:

```typescript
export const APP_MODE: 'test' | 'dev' = 'test'; // or 'dev'
```

No need to restart the dev server - hot reload will pick it up!

---

**Current Status: TEST MODE** ✅
All SuperAdmin pages are using mock data.
