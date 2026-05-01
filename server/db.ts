import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  seasons, teams, games, playerRegistrations, 
  playerTeams, playerStats, teamStats, newsPosts, 
  blogPosts, starsOfWeek, suspensions, gameVenues,
  InsertPlayerRegistration, InsertGame, InsertNewsPost, InsertBlogPost, InsertStarOfWeek, InsertSuspension
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
