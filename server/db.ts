import { eq, and, gte, lte, desc, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  seasons, teams, games, playerRegistrations, 
  playerTeams, playerStats, teamStats, newsPosts, 
  blogPosts, starsOfWeek, suspensions, gameVenues,
  InsertPlayerRegistration, InsertGame, InsertNewsPost, InsertBlogPost, InsertStarOfWeek, InsertSuspension,
  staffAvailability, gameAssignments, refereeApplications
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// League-specific queries

export async function getActiveSeasonId() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  return result.length > 0 ? result[0].id : null;
}

export async function getUpcomingGames(seasonId: number, days: number = 14) {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
  return await db
    .select()
    .from(games)
    .where(
      and(
        eq(games.seasonId, seasonId),
        gte(games.gameDate, todayStr as any),
        lte(games.gameDate, futureDateStr as any)
      )
    )
    .orderBy(games.gameDate);
}

export async function getPlayerRegistrations(seasonId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(playerRegistrations.seasonId, seasonId)];
  if (status) {
    conditions.push(eq(playerRegistrations.status, status as any));
  }
  
  return await db
    .select()
    .from(playerRegistrations)
    .where(and(...conditions))
    .orderBy(desc(playerRegistrations.createdAt));
}

export async function createPlayerRegistration(data: InsertPlayerRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(playerRegistrations).values(data);
  return result;
}

export async function updatePlayerRegistration(id: number, data: Partial<InsertPlayerRegistration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(playerRegistrations).set(data).where(eq(playerRegistrations.id, id));
}

export async function getTeamsBySeasonId(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teams).where(eq(teams.seasonId, seasonId));
}

export async function getGamesBySeasonId(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(games)
    .where(eq(games.seasonId, seasonId))
    .orderBy(games.gameDate);
}

export async function updateGameScore(gameId: number, homeScore: number, awayScore: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(games)
    .set({ homeScore, awayScore, status: "completed" })
    .where(eq(games.id, gameId));
}

export async function getNewsPosts(seasonId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(newsPosts)
    .where(eq(newsPosts.seasonId, seasonId))
    .orderBy(desc(newsPosts.createdAt))
    .limit(limit);
}

export async function createNewsPost(data: InsertNewsPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(newsPosts).values(data);
}

export async function getBlogPosts(seasonId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.seasonId, seasonId))
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit);
}

export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(blogPosts).values(data);
}

export async function getStarsOfWeek(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(starsOfWeek)
    .where(eq(starsOfWeek.seasonId, seasonId))
    .orderBy(desc(starsOfWeek.weekNumber));
}

export async function createStarOfWeek(data: InsertStarOfWeek) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(starsOfWeek).values(data);
}

export async function getSuspensions(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(suspensions)
    .where(eq(suspensions.seasonId, seasonId))
    .orderBy(desc(suspensions.startDate));
}

export async function createSuspension(data: InsertSuspension) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(suspensions).values(data);
}

export async function updateSuspension(id: number, data: Partial<InsertSuspension>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(suspensions).set(data).where(eq(suspensions.id, id));
}


// Email/Password Authentication Functions

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string | null;
  loginMethod: string;
  emailVerified: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const openId = `email_${data.email}_${Date.now()}`;
    
    const result = await db.insert(users).values({
      openId,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      loginMethod: data.loginMethod,
      emailVerified: data.emailVerified,
      lastSignedIn: new Date(),
    });
    
    const createdUser = await getUserByEmail(data.email);
    if (!createdUser) throw new Error("Failed to retrieve created user");
    
    return createdUser;
  } catch (error) {
    console.error("[Database] Error creating user:", error);
    throw error;
  }
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Error updating last signed in:", error);
    return false;
  }
}

export async function getPlayerRegistration(registrationId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db
      .select()
      .from(playerRegistrations)
      .where(eq(playerRegistrations.id, registrationId))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting player registration:", error);
    return null;
  }
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    const updatedUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return updatedUser[0] || null;
  } catch (error) {
    console.error("[Database] Error updating user password:", error);
    throw error;
  }
}


// Staff Availability Functions
export async function addStaffAvailability(staffApplicationId: number, gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(staffAvailability).values({
      staffApplicationId,
      gameId,
      isAvailable: true,
    });
  } catch (error) {
    console.error("[Database] Error adding staff availability:", error);
    throw error;
  }
}

export async function removeStaffAvailability(staffApplicationId: number, gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(staffAvailability)
      .where(and(
        eq(staffAvailability.staffApplicationId, staffApplicationId),
        eq(staffAvailability.gameId, gameId)
      ));
  } catch (error) {
    console.error("[Database] Error removing staff availability:", error);
    throw error;
  }
}

export async function getStaffAvailableGames(staffApplicationId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(staffAvailability)
      .where(and(
        eq(staffAvailability.staffApplicationId, staffApplicationId),
        eq(staffAvailability.isAvailable, true)
      ));
    return result;
  } catch (error) {
    console.error("[Database] Error getting staff available games:", error);
    return [];
  }
}

export async function getGameAvailableStaff(gameId: number, role: 'referee' | 'scorekeeper') {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(staffAvailability)
      .innerJoin(refereeApplications, eq(staffAvailability.staffApplicationId, refereeApplications.id))
      .where(and(
        eq(staffAvailability.gameId, gameId),
        eq(staffAvailability.isAvailable, true),
        eq(refereeApplications.role, role),
        eq(refereeApplications.status, 'approved')
      ));
    return result;
  } catch (error) {
    console.error("[Database] Error getting available staff for game:", error);
    return [];
  }
}

// Game Assignment Functions
export async function assignStaffToGame(gameId: number, refereeId?: number, scorekeeperId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const existing = await db.select().from(gameAssignments).where(eq(gameAssignments.gameId, gameId));
    if (existing.length > 0) {
      await db.update(gameAssignments)
        .set({ refereeId, scorekeeperId })
        .where(eq(gameAssignments.gameId, gameId));
    } else {
      await db.insert(gameAssignments).values({
        gameId,
        refereeId,
        scorekeeperId,
      });
    }
  } catch (error) {
    console.error("[Database] Error assigning staff to game:", error);
    throw error;
  }
}

export async function getGameAssignment(gameId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db
      .select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, gameId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting game assignment:", error);
    return null;
  }
}

export async function getStaffAssignedGames(staffApplicationId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(gameAssignments)
      .where(
        or(
          eq(gameAssignments.refereeId, staffApplicationId),
          eq(gameAssignments.scorekeeperId, staffApplicationId)
        )
      );
    return result;
  } catch (error) {
    console.error("[Database] Error getting staff assigned games:", error);
    return [];
  }
}
