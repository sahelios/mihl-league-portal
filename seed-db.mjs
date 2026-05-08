// /home/ubuntu/mihl-league-portal/seed-db.mjs
import mysql from 'mysql2/promise';
import { URL } from 'url';

// 1. Connection Setup
const DATABASE_URL = process.env.DATABASE_URL; //[cite: 2]

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const parseDbUrl = (dbUrl) => { //[cite: 2]
  const parsed = new URL(dbUrl);
  return {
    host: parsed.hostname,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.substring(1),
    port: parsed.port || 3306,
  };
};

async function seed() {
  const config = parseDbUrl(DATABASE_URL); //[cite: 2]

  // Setup connection using mysql2/promise and handle SSL for cloud databases[cite: 2]
  const connection = await mysql.createConnection({
    ...config,
    ssl: {
      rejectUnauthorized: false, //[cite: 2]
    },
  });

  try {
    // 2 & 3. Data to Seed & Validation
    
    // --- Seed Season ---
    try {
      const startDate = new Date('2026-06-23');
      const endDate = new Date('2026-08-31');
      await connection.query(
        `INSERT IGNORE INTO seasons (name, startDate, endDate, isActive) VALUES (?, ?, ?, ?)`,
        ['2026 Summer Season', startDate, endDate, true]
      );
      console.log("✓ Season created");
    } catch (e) {
      console.error("Error creating season:", e.message);
    }

    // --- Seed Teams ---
    try {
      const teams = [
        ['Iron Lions', 'Navy', 'Silver'],
        ['Golan Guards', 'Navy', 'Silver'],
        ['H Hammers', 'Navy', 'Silver'],
        ['Schvitz Saints', 'Navy', 'Silver']
      ];
      for (const team of teams) {
        await connection.query(
          `INSERT IGNORE INTO teams (name, primaryColor, secondaryColor) VALUES (?, ?, ?)`,
          team
        );
      }
      console.log("✓ Teams created");
    } catch (e) {
      console.error("Error creating teams:", e.message);
    }

    // --- Seed Venues ---
    try {
      const venues = [['Samuel Moscovitch Arena'], ['Outremont Arena']];
      for (const venue of venues) {
         await connection.query(`INSERT IGNORE INTO venues (name) VALUES (?)`, venue);
      }
    } catch (e) {
      console.error("Error creating venues:", e.message);
    }

    // --- Seed Games ---
    try {
      const games = [];
      const teamsList = ['Iron Lions', 'Golan Guards', 'H Hammers', 'Schvitz Saints'];
      
      for(let i=0; i<10; i++) {
         const t1 = teamsList[i % 4];
         const t2 = teamsList[(i + 1) % 4];
         const date = new Date(`2026-07-${(i + 1).toString().padStart(2, '0')}`);
         const status = i < 5 ? 'completed' : 'scheduled';
         const scoreA = status === 'completed' ? Math.floor(Math.random() * 5) : null;
         const scoreB = status === 'completed' ? Math.floor(Math.random() * 5) : null;
         
         games.push([t1, t2, scoreA, scoreB, date, status]);
      }
      
      for (const game of games) {
          // Utilizing the existing schema structure for game_results[cite: 2]
          await connection.query(
              `INSERT IGNORE INTO game_results (teamAName, teamBName, teamAScore, teamBScore, date, status) VALUES (?, ?, ?, ?, ?, ?)`,
              game
          );
      }
      console.log("✓ Games created");
    } catch (e) {
      console.error("Error creating games:", e.message);
    }

    // --- Seed News Posts ---
    try {
      const news = [];
      for(let i=1; i<=5; i++) {
          news.push([`League Update ${i}`, `Sample content for MIHL news post ${i}.`, new Date()]);
      }
      for (const post of news) {
          await connection.query(
             `INSERT IGNORE INTO news_posts (title, content, publishedAt) VALUES (?, ?, ?)`,
             post
          );
      }
      console.log("✓ News posts created");
    } catch (e) {
      console.error("Error creating news posts:", e.message);
    }

    // --- Seed Player Registrations ---
    try {
      // Mapping schema field names exactly as defined in the provided Drizzle table layout[cite: 1]
      const players = [
        ['David', 'Cohen', 'david.c@example.com', '514-555-0101', 'individual', 'forward', 8, 'approved', 'paid', new Date('2026-06-01'), false, 1],
        ['Michael', 'Levy', 'michael.l@example.com', '514-555-0102', 'individual', 'defenseman', 7, 'approved', 'paid', new Date('2026-06-01'), true, 1],
        ['Sam', 'Katz', 'sam.k@example.com', '514-555-0103', 'individual', 'goalie', 9, 'approved', 'paid', new Date('2026-06-01'), false, 1],
      ];
      
      for (const p of players) {
          await connection.query(
              `INSERT IGNORE INTO player_registrations 
              (firstName, lastName, email, phone, registrationType, position, playerRating, status, paymentStatus, evaluationDate, wantsCaptain, seasonId) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              p
          );
      }
    } catch (e) {
      console.error("Error creating player registrations:", e.message);
    }

    // 4. Output
    console.log("✓ Seeding complete");

  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await connection.end(); //[cite: 2]
  }
}

seed();