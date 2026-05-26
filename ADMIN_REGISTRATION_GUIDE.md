# Admin Register Player Feature - Testing & Implementation Guide

## Overview

The Admin Register Player feature allows league administrators to manually register players without requiring them to complete the standard registration form. Players receive a magic login link via email that expires at the season start date.

## Architecture

### Database Tables

1. **loginTokens** - Stores magic login tokens with expiration dates
   - `token`: Unique hex token (32 bytes)
   - `registrationId`: Links to playerRegistrations
   - `expiresAt`: Season start date
   - `usedAt`: Timestamp when token was used (one-time use)

2. **adminRegisteredPlayers** - Tracks admin-registered players
   - `registrationId`: Links to playerRegistrations
   - `passwordSet`: Boolean flag for password setup
   - `profileCompleted`: Boolean flag for profile completion

### Backend Services

#### adminRegistrationService.ts
- `generateLoginToken(registrationId, seasonStartDate)` - Creates magic link token
- `validateLoginToken(token)` - Validates token (checks expiration and one-time use)
- `markTokenAsUsed(token)` - Marks token as used after login
- `createAdminRegisteredPlayer(registrationId)` - Tracks admin registration
- `markPasswordAsSet(registrationId)` - Updates password status
- `markProfileAsCompleted(registrationId)` - Updates profile status

#### emailService.ts
- `sendAdminRegistrationEmail(email, name, magicLoginUrl, language)` - Sends bilingual email with magic link

### API Endpoints

#### Admin Router (server/routers/admin.ts)
```typescript
registerPlayer: adminProcedure
  .input({
    firstName, lastName, email, phone,
    position, teamId, seasonId,
    evaluationGameDate?, evaluationTeam?,
    playerRating?
  })
  .mutation() → { success, registrationId, message }
```

#### Auth Router (server/routers.ts)
```typescript
validateMagicLink: publicProcedure
  .input({ token })
  .query() → { valid, registrationId }

loginWithMagicLink: publicProcedure
  .input({ token, password, name? })
  .mutation() → { success, registrationId }
```

### Frontend Components

1. **MagicLinkLogin.tsx** (`/magic-login`)
   - Validates magic link token
   - Password setup form
   - Auto-redirects to player portal on success

2. **Players.tsx** (`/admin/players`)
   - "Admin Register Player" button
   - Registration dialog with form
   - Fields: First/Last Name, Email, Phone, Position, Team, Season, Rating
   - Optional: Evaluation game assignment

## End-to-End Testing Checklist

### Step 1: Admin Registration Form
- [ ] Navigate to `/admin/players`
- [ ] Click "Admin Register Player" button
- [ ] Form opens with all required fields
- [ ] Can select season and team
- [ ] Can optionally assign evaluation game
- [ ] Can set player position and rating

### Step 2: Player Registration
- [ ] Fill in player details:
  - First Name: "Test"
  - Last Name: "Player"
  - Email: "test@example.com"
  - Phone: "555-1234"
  - Position: "Forward"
  - Team: Select any team
  - Season: Select active season
  - Rating: 7
- [ ] Click "Register Player"
- [ ] Success message appears
- [ ] Player appears in players list with "pending" status

### Step 3: Email Verification
- [ ] Check email server logs (console output)
- [ ] Email sent to test@example.com
- [ ] Email contains magic link URL
- [ ] Link format: `https://mihl.ca/magic-login?token=<hex-token>`
- [ ] Email is bilingual-ready (supports EN/FR)

### Step 4: Magic Link Validation
- [ ] Copy magic link from email
- [ ] Open link in browser
- [ ] Page loads: "Complete Your Profile"
- [ ] Form shows password fields
- [ ] Optional: Display name field

### Step 5: Password Setup
- [ ] Enter password (min 6 characters)
- [ ] Confirm password
- [ ] Click "Complete Setup"
- [ ] Success: Redirected to player portal
- [ ] User is logged in automatically

### Step 6: Token Expiration
- [ ] Try using same magic link again
- [ ] Error: "Invalid or expired magic link"
- [ ] Token cannot be reused

### Step 7: Season Start Expiration
- [ ] Generate magic link for player
- [ ] Set season start date to past date
- [ ] Try to use magic link
- [ ] Error: "Invalid or expired magic link"
- [ ] Token expires at season start

### Step 8: Evaluation Game Assignment
- [ ] Register player with evaluation game assignment
- [ ] Select evaluation date and team (White/Black)
- [ ] Player appears in evaluation games roster
- [ ] Can be toggled between White/Black teams

### Step 9: Existing Registration Compatibility
- [ ] Standard player registration still works
- [ ] Self-registered players unaffected
- [ ] Both registration methods coexist

## Implementation Details

### Token Generation
```typescript
// 32-byte hex token (64 hex characters)
const token = crypto.randomBytes(32).toString('hex');
```

### Email Flow
1. Admin registers player → `registerPlayer` mutation
2. Mutation creates player registration
3. Mutation creates admin-registered player record
4. Mutation generates magic link token
5. Mutation sends email with link (non-blocking)
6. Response returns immediately

### Login Flow
1. Player clicks magic link
2. Browser navigates to `/magic-login?token=<token>`
3. MagicLinkLogin component validates token
4. Player enters password
5. `loginWithMagicLink` mutation called
6. Mutation validates token
7. Mutation creates user account (or updates existing)
8. Mutation marks token as used
9. Session cookie set
10. Redirect to player portal

### One-Time Use
- Token marked as used after successful login
- Subsequent attempts return null from `validateLoginToken`
- Token cannot be reused even if not expired

## Database Queries

### Create Admin-Registered Player
```sql
INSERT INTO loginTokens (registrationId, token, expiresAt)
VALUES (?, ?, ?)

INSERT INTO adminRegisteredPlayers (registrationId, passwordSet, profileCompleted)
VALUES (?, false, false)
```

### Validate Token
```sql
SELECT registrationId FROM loginTokens
WHERE token = ? AND usedAt IS NULL AND expiresAt > NOW()
LIMIT 1
```

### Mark Token Used
```sql
UPDATE loginTokens SET usedAt = NOW() WHERE token = ?
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|-----------|
| Invalid or expired magic link | Token doesn't exist, expired, or already used | Request new registration from admin |
| Player registration not found | Registration deleted or invalid ID | Contact admin |
| Email already registered | User account exists with same email | Use standard login |
| Password too short | Password < 6 characters | Enter longer password |
| Passwords don't match | Confirmation doesn't match | Re-enter matching passwords |

## Security Considerations

1. **Token Strength**: 32-byte (256-bit) random tokens using `crypto.randomBytes()`
2. **One-Time Use**: Tokens marked as used after first login
3. **Expiration**: Tokens expire at season start (admin-configurable)
4. **Email Verification**: Email required for registration
5. **Password Hashing**: Passwords hashed with bcryptjs (10 rounds)
6. **Session Management**: Standard session cookie with 1-year expiration
7. **Admin-Only**: `registerPlayer` mutation requires admin role

## Future Enhancements

1. **Resend Magic Link**: Allow players to request new link if expired
2. **Email Verification**: Verify email before player can log in
3. **Profile Completion**: Require additional info (phone, position, rating) after login
4. **Bulk Registration**: CSV import for multiple players
5. **Registration Tracking**: Dashboard showing admin-registered vs self-registered
6. **Audit Log**: Track who registered which players and when

## Testing Commands

### Run Admin Registration Tests
```bash
pnpm test -- server/admin.register-player.test.ts
```

### Run All Tests
```bash
pnpm test
```

### Check TypeScript
```bash
pnpm tsc --noEmit
```

## Troubleshooting

### Magic link not sending
- Check email configuration in environment variables
- Verify SMTP credentials (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)
- Check server logs for email errors
- Verify player email address is valid

### Token validation fails
- Ensure token is copied exactly (no extra spaces)
- Check token hasn't expired (compare with season start date)
- Verify token hasn't been used already
- Check database for loginTokens record

### Login redirect fails
- Verify VITE_OAUTH_PORTAL_URL is set correctly
- Check browser console for JavaScript errors
- Verify session cookie is being set
- Check database for users record

### Player not appearing in list
- Refresh page (F5)
- Check browser console for errors
- Verify registration was created in database
- Check admin has correct role

## Files Modified

- `drizzle/schema.ts` - Added loginTokens and adminRegisteredPlayers tables
- `server/_core/adminRegistrationService.ts` - Core registration logic
- `server/_core/emailService.ts` - Added sendAdminRegistrationEmail
- `server/routers.ts` - Added validateMagicLink and loginWithMagicLink
- `server/routers/admin.ts` - Added registerPlayer mutation
- `server/db.ts` - Added getPlayerRegistration and updateUserPassword
- `client/src/pages/MagicLinkLogin.tsx` - New page for magic link login
- `client/src/pages/admin/Players.tsx` - Added admin registration dialog
- `client/src/App.tsx` - Added /magic-login route
- `server/admin.register-player.test.ts` - Comprehensive test suite

## Contact

For issues or questions about the Admin Register Player feature, contact the development team.
