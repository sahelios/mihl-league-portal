# CRITICAL FIXES - DO NOT BREAK

## Position Field Functionality (Fixed May 25, 2026)

### Problem Fixed
Player position was not being saved or displayed despite being in the database schema. The issue was that `getPlayerRegistration` query was not explicitly selecting the `position` field.

### Solution Implemented
1. **Database Column**: `playerRegistrations.position` ENUM('forward', 'defense', 'goalie')
2. **Registration Submit**: Position is saved when player registers (line 239 in registration.ts)
3. **Player Portal Display**: Position displays in player card header
4. **Admin Edit**: Admin can change position in /admin/players and it saves to playerTeams table

### Critical Code Locations

#### 1. Registration Submit Mutation (server/routers/registration.ts:239)
```typescript
position: input.position || null,
```
**DO NOT REMOVE** - This saves position during registration

#### 2. Get Player Registration Query (server/routers/league.ts:270-290)
```typescript
const regResult = await db.select({
  // ... other fields ...
  position: playerRegistrations.position,
  // ... other fields ...
}).from(playerRegistrations)...
```
**MUST EXPLICITLY SELECT** - If you change this to `db.select().from(playerRegistrations)`, position will not be returned!

#### 3. Player Portal Display (client/src/pages/PlayerPortal.tsx:135)
```typescript
<p className="text-lg font-semibold text-foreground capitalize">{playerReg.position || "Not Set"}</p>
```
**DO NOT CHANGE** - This displays the position

#### 4. Admin Edit (client/src/pages/admin/Players.tsx:479-487)
```typescript
<Select value={editData.position || 'none'} onValueChange={v => setEditData({ ...editData, position: v })}>
```
**DO NOT REMOVE** - This allows admin to edit position

### Data Flow
1. Player registers with position → saved to `playerRegistrations.position`
2. Admin can override position in /admin/players → saved to `playerTeams.position`
3. PlayerPortal queries `getPlayerRegistration` → returns position from playerRegistrations
4. If admin set position in playerTeams, it overrides the registration position

### Tests to Ensure Nothing Breaks
- `server/routers/league.registration.test.ts` - Tests position retrieval
- `server/routers/registration.submit.test.ts` - Tests position storage

Run tests before any changes:
```bash
pnpm test server/routers/league.registration.test.ts
pnpm test server/routers/registration.submit.test.ts
```

### Future Changes - Checklist
Before modifying any of these components, verify:
- [ ] Position field is still in playerRegistrations schema
- [ ] Position is explicitly selected in getPlayerRegistration query
- [ ] Position is saved in registration submit mutation
- [ ] Tests still pass
- [ ] PlayerPortal displays position correctly
- [ ] Admin can edit position in /admin/players
- [ ] Position persists after save

### Common Mistakes to Avoid
1. ❌ Using `db.select().from(playerRegistrations)` without explicit field selection - position won't be returned
2. ❌ Removing position from registration submit mutation - position won't be saved on registration
3. ❌ Changing the position field name without updating all references
4. ❌ Not running tests after schema changes
5. ❌ Assuming position is automatically included in queries - always explicitly select it

### Emergency Rollback
If position functionality breaks, rollback to checkpoint: `7c32f34d`
