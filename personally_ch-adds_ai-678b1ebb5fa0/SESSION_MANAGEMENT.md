# Session Management System

This document explains the new multi-device session management system that allows users to be logged in on multiple devices simultaneously.

## Overview

The new system replaces the single `refresh_token` field with a `UserSession` model that tracks multiple active sessions per user. Each login creates a new session, and users can manage their active sessions.

## Database Changes

### New Table: `UserSession`
```prisma
model UserSession {
  id            String   @id @default(uuid())
  user_id       String
  refresh_token String   @unique
  device_info   String?  // Browser, device type, etc.
  ip_address    String?
  created_at    DateTime @default(now())
  expires_at    DateTime
  is_active     Boolean  @default(true)
  user          User     @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@index([refresh_token])
  @@index([expires_at])
}
```

### Updated User Model
- Removed: `refresh_token String?`
- Added: `sessions UserSession[]`

## API Endpoints

### 1. Login (`POST /api/auth/login`)
Creates a new session for the user.

**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "access_token_here",
  "refreshToken": "refresh_token_here",
  "user": { /* user data */ }
}
```

**Features:**
- Creates new session with device info and IP address
- Sets cookies for both tokens
- Each login creates a unique session

### 2. Refresh Token (`POST /api/auth/refresh`)
Refreshes access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new_access_token",
  "refreshToken": "new_refresh_token",
  "user": { /* user data */ }
}
```

**Features:**
- Validates session exists and is active
- Updates session with new refresh token
- Extends session expiration

### 3. Logout (`POST /api/auth/logout`)
Logs out from current device or all devices.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here",
  "logoutAll": false  // true to logout from all devices
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Features:**
- `logoutAll: false` - Logout from current device only
- `logoutAll: true` - Logout from all devices
- Clears cookies
- Deactivates sessions

### 4. List Sessions (`GET /api/auth/sessions`)
Get all active sessions for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session_id",
      "device_info": "Mozilla/5.0...",
      "ip_address": "192.168.1.1",
      "created_at": "2025-01-13T10:00:00Z",
      "expires_at": "2025-02-12T10:00:00Z"
    }
  ]
}
```

### 5. Logout Specific Session (`DELETE /api/auth/sessions`)
Logout from a specific session.

**Request Body:**
```json
{
  "sessionId": "session_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session logged out successfully"
}
```

### 6. Cleanup Sessions (`POST /api/auth/cleanup-sessions`)
Cleanup expired and old sessions (for cron jobs).

**Headers:**
```
Authorization: Bearer <cron_secret_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Session cleanup completed",
  "expiredSessionsDeactivated": 5,
  "oldSessionsDeleted": 2
}
```

## Usage Examples

### Frontend Implementation

#### Login
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store tokens and user data
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  }
};
```

#### Refresh Token
```typescript
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  }
  return false;
};
```

#### Logout
```typescript
const logout = async (logoutAll = false) => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return;

  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, logoutAll })
  });

  localStorage.removeItem('refreshToken');
  setUser(null);
};
```

#### List Sessions
```typescript
const getSessions = async () => {
  const response = await fetch('/api/auth/sessions');
  const data = await response.json();
  
  if (data.success) {
    return data.sessions;
  }
  return [];
};
```

## Security Features

### 1. Session Isolation
- Each device gets a unique session
- Sessions are independent of each other
- One device can't access another's session

### 2. Automatic Expiration
- Sessions expire after 30 days
- Expired sessions are automatically deactivated
- Old sessions (90+ days) are automatically deleted

### 3. Device Tracking
- Records device information (browser, OS)
- Tracks IP addresses
- Helps identify suspicious sessions

### 4. Selective Logout
- Users can logout from specific devices
- Option to logout from all devices
- Maintains security while providing flexibility

## Migration Steps

### 1. Update Database Schema
```bash
npx prisma migrate dev --name add_user_sessions
```

### 2. Update Frontend Code
- Replace single refresh token storage with session management
- Update login/logout flows
- Add session listing functionality

### 3. Test Multi-Device Login
- Login from multiple devices
- Verify sessions are independent
- Test logout functionality

## Benefits

### For Users
- ✅ Login from multiple devices simultaneously
- ✅ See all active sessions
- ✅ Logout from specific devices
- ✅ Better security awareness

### For Developers
- ✅ Better session tracking
- ✅ Improved security monitoring
- ✅ Easier debugging
- ✅ Scalable architecture

## Monitoring and Maintenance

### Regular Cleanup
Set up a cron job to call `/api/auth/cleanup-sessions` daily:

```bash
# Add to your cron job
0 2 * * * curl -X POST "https://yourdomain.com/api/auth/cleanup-sessions" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### Session Analytics
Track session patterns:
- Most active devices
- Login frequency
- Session duration
- Geographic distribution

## Troubleshooting

### Common Issues

1. **"Property 'userSession' does not exist"**
   - Run `npx prisma generate` to update Prisma client

2. **Sessions not persisting**
   - Check database connection
   - Verify session creation in logs

3. **Refresh token errors**
   - Ensure session is active
   - Check expiration dates
   - Verify token format

### Debug Mode
Add logging to track session operations:
```typescript
console.log('Session created:', session);
console.log('Session updated:', updatedSession);
console.log('Session deleted:', deletedSession);
```
