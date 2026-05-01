import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// MIHL League Tables

export const seasons = mysqlTable("seasons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logoUrl"),
  seasonId: int("seasonId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const gameVenues = mysqlTable("gameVenues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameVenue = typeof gameVenues.$inferSelect;
export type InsertGameVenue = typeof gameVenues.$inferInsert;

export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("seasonId").notNull(),
  homeTeamId: int("homeTeamId").notNull(),
  awayTeamId: int("awayTeamId").notNull(),
  venueId: int("venueId").notNull(),
  gameDate: date("gameDate").notNull(),
  gameTime: varchar("gameTime", { length: 10 }).notNull(),
  homeScore: int("homeScore"),
  awayScore: int("awayScore"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

export const playerRegistrations = mysqlTable("playerRegistrations", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  teamId: int("teamId").notNull(),
  seasonId: int("seasonId").notNull(),
  isFirstTime: boolean("isFirstTime").default(false).notNull(),
  registrationType: mysqlEnum("registrationType", ["individual", "team"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  paymentConfirmed: boolean("paymentConfirmed").default(false).notNull(),
  jerseyOrderConfirmed: boolean("jerseyOrderConfirmed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type InsertPlayerRegistration = typeof playerRegistrations.$inferInsert;

export const playerTeams = mysqlTable("playerTeams", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  registrationId: int("registrationId"),
  teamId: int("teamId").notNull(),
  seasonId: int("seasonId").notNull(),
  jerseyNumber: int("jerseyNumber"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerTeam = typeof playerTeams.$inferSelect;
export type InsertPlayerTeam = typeof playerTeams.$inferInsert;

export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  playerTeamId: int("playerTeamId").notNull(),
  seasonId: int("seasonId").notNull(),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  points: int("points").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStat = typeof playerStats.$inferSelect;
export type InsertPlayerStat = typeof playerStats.$inferInsert;

export const teamStats = mysqlTable("teamStats", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  seasonId: int("seasonId").notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  ties: int("ties").default(0).notNull(),
  points: int("points").default(0).notNull(),
  goalsFor: int("goalsFor").default(0).notNull(),
  goalsAgainst: int("goalsAgainst").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamStat = typeof teamStats.$inferSelect;
export type InsertTeamStat = typeof teamStats.$inferInsert;

export const newsPosts = mysqlTable("newsPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  authorId: int("authorId"),
  seasonId: int("seasonId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsPost = typeof newsPosts.$inferSelect;
export type InsertNewsPost = typeof newsPosts.$inferInsert;

export const starsOfWeek = mysqlTable("starsOfWeek", {
  id: int("id").autoincrement().primaryKey(),
  playerTeamId: int("playerTeamId"),
  playerName: varchar("playerName", { length: 100 }),
  teamId: int("teamId"),
  seasonId: int("seasonId"),
  weekNumber: int("weekNumber").notNull(),
  rating: int("rating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StarOfWeek = typeof starsOfWeek.$inferSelect;
export type InsertStarOfWeek = typeof starsOfWeek.$inferInsert;

export const suspensions = mysqlTable("suspensions", {
  id: int("id").autoincrement().primaryKey(),
  playerTeamId: int("playerTeamId"),
  playerName: varchar("playerName", { length: 100 }),
  teamId: int("teamId"),
  seasonId: int("seasonId"),
  reason: text("reason"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Suspension = typeof suspensions.$inferSelect;
export type InsertSuspension = typeof suspensions.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  fromAdminId: int("fromAdminId").notNull(),
  toPlayerTeamId: int("toPlayerTeamId"),
  toTeamId: int("toTeamId"),
  subject: varchar("subject", { length: 200 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  authorId: int("authorId"),
  seasonId: int("seasonId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;