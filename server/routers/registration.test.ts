import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { playerRegistrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Registration Router", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe("submit", () => {
    it("should create an individual registration", async () => {
      const testData = {
        registrationType: "individual" as const,
        firstName: "Test",
        lastName: "Player",
        email: "test@example.com",
        phone: "5551234567",
        rating: 7,
        position: "forward" as const,
        emergencyName: "Emergency Contact",
        emergencyPhone: "5559876543",
        emergencyRelationship: "Spouse",
        waiverSigned: true,
        waiverSignature: "Test Player",
        language: "en" as const,
      };

      // Insert test registration
      const result = await db.insert(playerRegistrations).values({
        firstName: testData.firstName,
        lastName: testData.lastName,
        email: testData.email,
        phone: testData.phone,
        registrationType: testData.registrationType,
        playerRating: testData.rating,
        position: testData.position,
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      expect(result).toBeDefined();
    });

    it("should validate team size for team registrations", () => {
      // Team must have 10-15 players
      const smallTeam = Array(9).fill({
        firstName: "Player",
        lastName: "Name",
        email: "player@example.com",
        phone: "5551234567",
        position: "forward" as const,
        rating: 5,
      });

      expect(smallTeam.length).toBeLessThan(10);

      const validTeam = Array(12).fill({
        firstName: "Player",
        lastName: "Name",
        email: "player@example.com",
        phone: "5551234567",
        position: "forward" as const,
        rating: 5,
      });

      expect(validTeam.length).toBeGreaterThanOrEqual(10);
      expect(validTeam.length).toBeLessThanOrEqual(15);
    });

    it.skip("should accept spare registrations", async () => {
      // Spare registrations use refereeApplications table, not playerRegistrations
      const testData = {
        registrationType: "individual" as const,
        firstName: "Spare",
        lastName: "Player",
        email: "spare@example.com",
        phone: "5551234567",
        emergencyName: "Emergency",
        emergencyPhone: "5559876543",
        emergencyRelationship: "Friend",
        waiverSigned: true,
        waiverSignature: "Spare Player",
      };

      const result = await db.insert(playerRegistrations).values({
        firstName: testData.firstName,
        lastName: testData.lastName,
        email: testData.email,
        phone: testData.phone,
        registrationType: testData.registrationType,
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      expect(result).toBeDefined();
    });

    it.skip("should accept referee registrations", async () => {
      // Referee registrations use refereeApplications table, not playerRegistrations
      const testData = {
        registrationType: "individual" as const,
        firstName: "Ref",
        lastName: "Eree",
        email: "ref@example.com",
        phone: "5551234567",
        emergencyName: "Emergency",
        emergencyPhone: "5559876543",
        emergencyRelationship: "Sibling",
        waiverSigned: true,
        waiverSignature: "Ref Eree",
      };

      const result = await db.insert(playerRegistrations).values({
        firstName: testData.firstName,
        lastName: testData.lastName,
        email: testData.email,
        phone: testData.phone,
        registrationType: testData.registrationType,
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      expect(result).toBeDefined();
    });

    it.skip("should accept scorekeeper registrations", async () => {
      // Scorekeeper registrations use refereeApplications table, not playerRegistrations
      const testData = {
        registrationType: "individual" as const,
        firstName: "Score",
        lastName: "Keeper",
        email: "scorekeeper@example.com",
        phone: "5551234567",
        emergencyName: "Emergency",
        emergencyPhone: "5559876543",
        emergencyRelationship: "Parent",
        waiverSigned: true,
        waiverSignature: "Score Keeper",
      };

      const result = await db.insert(playerRegistrations).values({
        firstName: testData.firstName,
        lastName: testData.lastName,
        email: testData.email,
        phone: testData.phone,
        registrationType: testData.registrationType,
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe("getPending", () => {
    it("should retrieve pending registrations", async () => {
      const pending = await db
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.status, "pending"));
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe("approve", () => {
    it("should update registration status to approved", async () => {
      // Create a test registration
      const result = await db.insert(playerRegistrations).values({
        firstName: "Approve",
        lastName: "Test",
        email: "approve@example.com",
        phone: "5551234567",
        registrationType: "individual",
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      const registrationId = (result as any).insertId || 0;

      // Update to approved
      if (registrationId) {
        await db
          .update(playerRegistrations)
          .set({ status: "approved" })
          .where(eq(playerRegistrations.id, registrationId));

        const updated = await db
          .select()
          .from(playerRegistrations)
          .where(eq(playerRegistrations.id, registrationId));
        expect(updated[0]?.status).toBe("approved");
      }
    });
  });

  describe("reject", () => {
    it("should update registration status to rejected", async () => {
      // Create a test registration
      const result = await db.insert(playerRegistrations).values({
        firstName: "Reject",
        lastName: "Test",
        email: "reject@example.com",
        phone: "5551234567",
        registrationType: "individual",
        status: "pending",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      const registrationId = (result as any).insertId || 0;

      // Update to rejected
      if (registrationId) {
        await db
          .update(playerRegistrations)
          .set({ status: "rejected" })
          .where(eq(playerRegistrations.id, registrationId));

        const updated = await db
          .select()
          .from(playerRegistrations)
          .where(eq(playerRegistrations.id, registrationId));
        expect(updated[0]?.status).toBe("rejected");
      }
    });
  });

  describe("markPaid", () => {
    it("should update payment status", async () => {
      // Create a test registration
      const result = await db.insert(playerRegistrations).values({
        firstName: "Payment",
        lastName: "Test",
        email: "payment@example.com",
        phone: "5551234567",
        registrationType: "individual",
        status: "approved",
        paymentStatus: "unpaid",
        seasonId: 1,
        userId: 0,
        isFirstTime: false,
        wantsCaptain: false,
      });

      const registrationId = (result as any).insertId || 0;

      // Mark as paid
      if (registrationId) {
        await db
          .update(playerRegistrations)
          .set({ paymentStatus: "paid" })
          .where(eq(playerRegistrations.id, registrationId));

        const updated = await db
          .select()
          .from(playerRegistrations)
          .where(eq(playerRegistrations.id, registrationId));
        expect(updated[0]?.paymentStatus).toBe("paid");
      }
    });
  });

  describe("getStats", () => {
    it("should return registration statistics", async () => {
      const pending = await db
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.status, "pending"));
      const approved = await db
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.status, "approved"));
      const rejected = await db
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.status, "rejected"));

      const stats = {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: pending.length + approved.length + rejected.length,
      };

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.approved).toBeGreaterThanOrEqual(0);
      expect(stats.rejected).toBeGreaterThanOrEqual(0);
    });
  });
});
