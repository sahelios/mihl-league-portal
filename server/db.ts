import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, users, 
  seasons, teams, games, playerRegistrations, 
  playerTeam, playerStats, teamStats, newsPosts, 
  blogPosts, starsOfWeek, suspensions, gameVenues,
  InsertPlayerRegistration, InsertGame, InsertNewsPost, InsertBlogPost, InsertStarOfWeek, InsertSuspension,
  staffAvailability, gameAssignments, refereeApplications
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create connection pool with automatic reconnection
async function createConnectionPool() {
  if (_pool) return _pool;
  
  try {
    _pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });
    
    // Test the connection
    const conn = await _pool.getConnection();
    conn.release();
    console.log("[Database] Connection pool created successfully");
    _connectionRetries = 0;
    return _pool;
  } catch (error) {
    console.error("[Database] Failed to create connection pool:", error);
    _pool = null;
    throw error;
  }
}

// Lazily create the drizzle instance with connection pooling
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = await createConnectionPool();
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to initialize drizzle:", error);
      _db = null;
      
      // Retry with exponential backoff
      if (_connectionRetries < MAX_RETRIES) {
        _connectionRetries++;
        const delay = RETRY_DELAY * Math.pow(2, _connectionRetries - 1);
        console.log(`[Database] Retrying in ${delay}ms... (attempt ${_connectionRetries}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return getDb(); // Recursive retry
      }
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
      values[field] = value;
      updateSet[field] = value;
    };

    assignNullable("name");
    assignNullable("email");
    assignNullable("loginMethod");

    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.openId, openId),
    });
    return result || null;
  } catch (error) {
    console.error("[Database] Error getting user by openId:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });
    return result || null;
  } catch (error) {
    console.error("[Database] Error getting user by email:", error);
    throw error;
  }
}

export async function getUserById(id: number): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
    return result || null;
  } catch (error) {
    console.error("[Database] Error getting user by id:", error);
    throw error;
  }
}

export async function getAllUsers(): Promise<(typeof users.$inferSelect)[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  try {
    return await db.query.users.findMany();
  } catch (error) {
    console.error("[Database] Error getting all users:", error);
    throw error;
  }
}
