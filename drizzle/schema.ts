import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean, decimal, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"), // For email/password signup
  emailVerified: boolean("emailVerified").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'google', 'email', etc.
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Note: Either openId (OAuth) or (email + passwordHash) must be provided for authentication

// MIHL League Tables

export const seasons = mysqlTable("seasons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  registrationDeadline: date("registrationDeadline"),
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
  captainId: int("captainId"),
  colors: varchar("colors", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const gameVenues = mysqlTable("gameVenues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
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

// Note: isEvaluationGame column does not exist in the actual database

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
  evaluationDate: varchar("evaluationDate", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type InsertPlayerRegistration = typeof playerRegistrations.$inferInsert;

export const playerTeams = mysqlTable("playerTeams", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  teamId: int("teamId").notNull(),
  seasonId: int("seasonId").notNull(),
  jerseyNumber: int("jerseyNumber"),
  isCaptain: boolean("isCaptain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerTeam = typeof playerTeams.$inferSelect;
export type InsertPlayerTeam = typeof playerTeams.$inferInsert;

export const spareAssignments = mysqlTable("spareAssignments", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  gameId: int("gameId").notNull(),
  teamId: int("teamId").notNull(),
  replacingPlayerId: int("replacingPlayerId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "played"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpareAssignment = typeof spareAssignments.$inferSelect;
export type InsertSpareAssignment = typeof spareAssignments.$inferInsert;

export const teamRosterRequests = mysqlTable("teamRosterRequests", {
  id: int("id").autoincrement().primaryKey(),
  teamCaptainId: int("teamCaptainId").notNull(),
  playerRegistrationIds: json("playerRegistrationIds"),
  seasonId: int("seasonId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamRosterRequest = typeof teamRosterRequests.$inferSelect;
export type InsertTeamRosterRequest = typeof teamRosterRequests.$inferInsert;

export const teamTrades = mysqlTable("teamTrades", {
  id: int("id").autoincrement().primaryKey(),
  fromTeamId: int("fromTeamId").notNull(),
  toTeamId: int("toTeamId").notNull(),
  fromTeamCaptainId: int("fromTeamCaptainId").notNull(),
  toTeamCaptainId: int("toTeamCaptainId").notNull(),
  playerFromId: int("playerFromId").notNull(),
  playerToId: int("playerToId").notNull(),
  seasonId: int("seasonId").notNull(),
  status: mysqlEnum("status", ["pending", "approved_both", "approved_admin", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamTrade = typeof teamTrades.$inferSelect;
export type InsertTeamTrade = typeof teamTrades.$inferInsert;

export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  playerTeamId: int("playerTeamId").notNull(),
  seasonId: int("seasonId").notNull(),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  points: int("points").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  penalties: int("penalties").default(0).notNull(),
  shotsOnGoal: int("shotsOnGoal").default(0).notNull(),
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

export const gameStats = mysqlTable("gameStats", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  playerTeamId: int("playerTeamId").notNull(),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  penalties: int("penalties").default(0).notNull(),
  penaltyDuration: int("penaltyDuration").default(0).notNull(),
  shotsOnGoal: int("shotsOnGoal").default(0).notNull(),
  period: int("period").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameStat = typeof gameStats.$inferSelect;
export type InsertGameStat = typeof gameStats.$inferInsert;

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  playerTeamId: int("playerTeamId").notNull(),
  badgeType: varchar("badgeType", { length: 50 }).notNull(),
  description: text("description"),
  seasonId: int("seasonId").notNull(),
  awardedBy: mysqlEnum("awardedBy", ["system", "admin"]).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const newsPosts = mysqlTable("newsPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  authorId: int("authorId"),
  seasonId: int("seasonId"),
  isApproved: boolean("isApproved").default(false).notNull(),
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

export const teamMessages = mysqlTable("teamMessages", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  fromPlayerId: int("fromPlayerId").notNull(),
  content: text("content").notNull(),
  isArchivedAfterSeason: boolean("isArchivedAfterSeason").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMessage = typeof teamMessages.$inferSelect;
export type InsertTeamMessage = typeof teamMessages.$inferInsert;

export const adminMessages = mysqlTable("adminMessages", {
  id: int("id").autoincrement().primaryKey(),
  fromAdminId: int("fromAdminId").notNull(),
  toPlayerTeamId: int("toPlayerTeamId"),
  toTeamId: int("toTeamId"),
  subject: varchar("subject", { length: 200 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = typeof adminMessages.$inferInsert;

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

export const refereeIncidentReports = mysqlTable("refereeIncidentReports", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  refereeId: int("refereeId").notNull(),
  playerTeamId: int("playerTeamId"),
  teamId: int("teamId"),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["minor", "major", "ejection"]).notNull(),
  sentToTeamCaptain: boolean("sentToTeamCaptain").default(false).notNull(),
  sentToPlayer: boolean("sentToPlayer").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RefereeIncidentReport = typeof refereeIncidentReports.$inferSelect;
export type InsertRefereeIncidentReport = typeof refereeIncidentReports.$inferInsert;

export const jerseyPoll = mysqlTable("jerseyPoll", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("seasonId").notNull(),
  option: varchar("option", { length: 100 }).notNull(),
  votes: int("votes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JerseyPoll = typeof jerseyPoll.$inferSelect;
export type InsertJerseyPoll = typeof jerseyPoll.$inferInsert;

export const jerseyPollVotes = mysqlTable("jerseyPollVotes", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId").notNull(),
  registrationId: int("registrationId").notNull(),
  selectedOption: varchar("selectedOption", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JerseyPollVote = typeof jerseyPollVotes.$inferSelect;
export type InsertJerseyPollVote = typeof jerseyPollVotes.$inferInsert;

export const waivers = mysqlTable("waivers", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  seasonId: int("seasonId").notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  signedDate: timestamp("signedDate").notNull(),
  waiverText: text("waiverText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waiver = typeof waivers.$inferSelect;
export type InsertWaiver = typeof waivers.$inferInsert;

export const seasonArchives = mysqlTable("seasonArchives", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("seasonId").notNull(),
  archivedData: json("archivedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeasonArchive = typeof seasonArchives.$inferSelect;
export type InsertSeasonArchive = typeof seasonArchives.$inferInsert;

export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  submissionType: mysqlEnum("submissionType", ["registration_question", "general_inquiry", "complaint", "feedback"]).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  targetType: varchar("targetType", { length: 50 }),
  targetId: int("targetId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const refereeApplications = mysqlTable("refereeApplications", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  interacEmail: varchar("interacEmail", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["referee", "scorekeeper"]).notNull(),
  isCertified: boolean("isCertified").default(false).notNull(),
  certifications: json("certifications"), // Array of {type, year}
  yearsOfExperience: int("yearsOfExperience").notNull(),
  hockeyLevels: json("hockeyLevels"), // Array of levels: U15, U18, Junior, Beer League, Other
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvalDate: timestamp("approvalDate"),
  paymentAmount: decimal("paymentAmount", { precision: 10, scale: 2 }),
  selectedGames: json("selectedGames"), // Array of game IDs they're available for
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RefereeApplication = typeof refereeApplications.$inferSelect;
export type InsertRefereeApplication = typeof refereeApplications.$inferInsert;
