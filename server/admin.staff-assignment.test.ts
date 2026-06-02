import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { refereeApplications, gameAssignments, games } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Staff Assignment Functionality", () => {
  let db: any;
  let testGameId: number;
  let testRefereeId: number;
  let testScorekeepeerId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test game
    const gameResult = await db.insert(games).values({
      seasonId: 1,
      homeTeamId: 1,
      awayTeamId: 2,
      gameDate: new Date(),
      gameTime: "19:00",
      venueId: 1,
      status: "scheduled",
      isEvaluationGame: false,
    });
    testGameId = gameResult[0].insertId || 1;

    // Create test referee
    const refereeResult = await db.insert(refereeApplications).values({
      firstName: "Test",
      lastName: "Referee",
      email: "test-ref@example.com",
      phone: "5141234567",
      interacEmail: "test-ref@interac.ca",
      role: "referee",
      isCertified: true,
      certifications: [],
      yearsOfExperience: 5,
      hockeyLevels: ["AAA"],
      status: "approved",
      selectedGames: [],
    });
    testRefereeId = refereeResult[0].insertId || 1;

    // Create test scorekeeper
    const skResult = await db.insert(refereeApplications).values({
      firstName: "Test",
      lastName: "Scorekeeper",
      email: "test-sk@example.com",
      phone: "5141234568",
      interacEmail: "test-sk@interac.ca",
      role: "scorekeeper",
      isCertified: false,
      certifications: [],
      yearsOfExperience: 2,
      hockeyLevels: ["AA"],
      status: "approved",
      selectedGames: [],
    });
    testScorekeepeerId = skResult[0].insertId || 2;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      try {
        await db.delete(gameAssignments).where(eq(gameAssignments.gameId, testGameId));
        await db.delete(games).where(eq(games.id, testGameId));
        await db.delete(refereeApplications).where(eq(refereeApplications.id, testRefereeId));
        await db.delete(refereeApplications).where(eq(refereeApplications.id, testScorekeepeerId));
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  });

  it("should assign a referee to a game without affecting existing scorekeeper", async () => {
    // First, create a game assignment with a scorekeeper
    await db.insert(gameAssignments).values({
      gameId: testGameId,
      refereeId: null,
      scorekeeperId: testScorekeepeerId,
    });

    // Now assign a referee
    await db.update(gameAssignments)
      .set({ refereeId: testRefereeId })
      .where(eq(gameAssignments.gameId, testGameId));

    // Verify both are assigned
    const assignment = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, testGameId))
      .limit(1);

    expect(assignment[0]).toBeDefined();
    expect(assignment[0].refereeId).toBe(testRefereeId);
    expect(assignment[0].scorekeeperId).toBe(testScorekeepeerId);
  });

  it("should assign a scorekeeper to a game without affecting existing referee", async () => {
    // Clean up previous assignment
    await db.delete(gameAssignments).where(eq(gameAssignments.gameId, testGameId));

    // Create a game assignment with a referee
    await db.insert(gameAssignments).values({
      gameId: testGameId,
      refereeId: testRefereeId,
      scorekeeperId: null,
    });

    // Now assign a scorekeeper
    await db.update(gameAssignments)
      .set({ scorekeeperId: testScorekeepeerId })
      .where(eq(gameAssignments.gameId, testGameId));

    // Verify both are assigned
    const assignment = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, testGameId))
      .limit(1);

    expect(assignment[0]).toBeDefined();
    expect(assignment[0].refereeId).toBe(testRefereeId);
    expect(assignment[0].scorekeeperId).toBe(testScorekeepeerId);
  });

  it("should assign both referee and scorekeeper to a game", async () => {
    // Clean up previous assignment
    await db.delete(gameAssignments).where(eq(gameAssignments.gameId, testGameId));

    // Create a game assignment with both
    await db.insert(gameAssignments).values({
      gameId: testGameId,
      refereeId: testRefereeId,
      scorekeeperId: testScorekeepeerId,
    });

    // Verify both are assigned
    const assignment = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, testGameId))
      .limit(1);

    expect(assignment[0]).toBeDefined();
    expect(assignment[0].refereeId).toBe(testRefereeId);
    expect(assignment[0].scorekeeperId).toBe(testScorekeepeerId);
  });

  it("should remove referee without affecting scorekeeper", async () => {
    // Ensure both are assigned
    await db.delete(gameAssignments).where(eq(gameAssignments.gameId, testGameId));
    await db.insert(gameAssignments).values({
      gameId: testGameId,
      refereeId: testRefereeId,
      scorekeeperId: testScorekeepeerId,
    });

    // Remove referee
    await db.update(gameAssignments)
      .set({ refereeId: null })
      .where(eq(gameAssignments.gameId, testGameId));

    // Verify only scorekeeper remains
    const assignment = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, testGameId))
      .limit(1);

    expect(assignment[0]).toBeDefined();
    expect(assignment[0].refereeId).toBeNull();
    expect(assignment[0].scorekeeperId).toBe(testScorekeepeerId);
  });

  it("should remove scorekeeper without affecting referee", async () => {
    // Ensure both are assigned
    await db.delete(gameAssignments).where(eq(gameAssignments.gameId, testGameId));
    await db.insert(gameAssignments).values({
      gameId: testGameId,
      refereeId: testRefereeId,
      scorekeeperId: testScorekeepeerId,
    });

    // Remove scorekeeper
    await db.update(gameAssignments)
      .set({ scorekeeperId: null })
      .where(eq(gameAssignments.gameId, testGameId));

    // Verify only referee remains
    const assignment = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.gameId, testGameId))
      .limit(1);

    expect(assignment[0]).toBeDefined();
    expect(assignment[0].refereeId).toBe(testRefereeId);
    expect(assignment[0].scorekeeperId).toBeNull();
  });
});
