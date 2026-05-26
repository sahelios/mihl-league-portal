import { db } from '../db';
import { loginTokens, adminRegisteredPlayers, playerRegistrations } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a magic login token for admin-registered players
 * Token expires at the start of the season
 */
export async function generateLoginToken(registrationId: number, seasonStartDate: Date) {
  const token = crypto.randomBytes(32).toString('hex');
  
  const result = await db.insert(loginTokens).values({
    registrationId,
    token,
    expiresAt: seasonStartDate,
  });

  return token;
}

/**
 * Validate a magic login token
 * Returns registration ID if valid, null if expired or invalid
 */
export async function validateLoginToken(token: string) {
  const [tokenRecord] = await db
    .select()
    .from(loginTokens)
    .where(
      and(
        eq(loginTokens.token, token),
        eq(loginTokens.usedAt, null) // Not yet used
      )
    );

  if (!tokenRecord) {
    return null;
  }

  // Check if token has expired
  if (new Date() > tokenRecord.expiresAt) {
    return null;
  }

  return tokenRecord.registrationId;
}

/**
 * Mark a login token as used
 */
export async function markTokenAsUsed(token: string) {
  await db
    .update(loginTokens)
    .set({ usedAt: new Date() })
    .where(eq(loginTokens.token, token));
}

/**
 * Create admin-registered player record
 */
export async function createAdminRegisteredPlayer(registrationId: number) {
  await db.insert(adminRegisteredPlayers).values({
    registrationId,
    passwordSet: false,
    profileCompleted: false,
  });
}

/**
 * Mark password as set for admin-registered player
 */
export async function markPasswordAsSet(registrationId: number) {
  await db
    .update(adminRegisteredPlayers)
    .set({ passwordSet: true })
    .where(eq(adminRegisteredPlayers.registrationId, registrationId));
}

/**
 * Mark profile as completed for admin-registered player
 */
export async function markProfileAsCompleted(registrationId: number) {
  await db
    .update(adminRegisteredPlayers)
    .set({ profileCompleted: true })
    .where(eq(adminRegisteredPlayers.registrationId, registrationId));
}

/**
 * Get admin-registered player status
 */
export async function getAdminRegisteredPlayerStatus(registrationId: number) {
  const [record] = await db
    .select()
    .from(adminRegisteredPlayers)
    .where(eq(adminRegisteredPlayers.registrationId, registrationId));

  return record || null;
}

/**
 * Check if a player was admin-registered
 */
export async function isAdminRegisteredPlayer(registrationId: number) {
  const [record] = await db
    .select()
    .from(adminRegisteredPlayers)
    .where(eq(adminRegisteredPlayers.registrationId, registrationId));

  return !!record;
}
