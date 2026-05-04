// /home/ubuntu/mihl-league-portal/seed-db.mjs
import mysql from 'mysql2/promise';
import { URL } from 'url';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const parseDbUrl = (dbUrl) => {
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
  const config = parseDbUrl(DATABASE_URL);
  const shouldClear = process.argv.includes('--clear');

  console.log("Seeding database...");

  const connection = await mysql.createConnection({
    ...config,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    if (shouldClear) {
      console.log("Clearing existing data...");
      await connection.query('DELETE FROM suspensions');
      await connection.query('DELETE FROM game_results');
      await connection.query('DELETE FROM player_registrations');
    }

    // A. Seed Player Registrations (20 total)[cite: 1, 2, 3]
    const players = [];
    const types = ['individual', 'spare', 'referee', 'scorekeeper'];
    const statuses = ['pending', 'approved', 'rejected'];
    const payments = ['paid', 'unpaid'];
    const positions = ['forward', 'defenseman', 'goalie'];

    for (let i = 1; i <= 20; i++) {
      let regType = 'individual';
      if (i > 10 && i <= 15) regType = 'spare';
      if (i > 15 && i <= 18) regType = 'referee';
      if (i > 18) regType = 'scorekeeper';

      players.push([
        `First${i}`,
        `Last${i}`,
        `player${i}@example.com`,
        `514-555-00${i.toString().padStart(2, '0')}`,
        regType,
        regType === 'referee' || regType === 'scorekeeper' ? null : positions[i % 3],
        regType === 'referee' || regType === 'scorekeeper' ? null : Math.floor(Math.random() * 10) + 1,
        statuses[i % 3],
        payments[i % 2],
        i % 2 === 0 ? '2026-06-24' : '2026-06-26',
        1 // seasonId
      ]);
    }

    const [regResult] = await connection.query(
      `INSERT INTO player_registrations 
      (firstName, lastName, email, phone, registrationType, position, playerRating, status, paymentStatus, evaluationDate, seasonId) 
      VALUES ?`,
      [players]
    );
    console.log(`- Inserted ${regResult.affectedRows} player registrations.`);

    // B. Seed Game Results (10 games)[cite: 1, 2, 3]
    const teams = ['Iron Lions', 'Golan Guards', 'H Hammers', 'Schvitz Saints'];
    const games = [];
    for (let i = 1; i <= 10; i++) {
      const teamA = teams[i % 4];
      const teamB = teams[(i + 1) % 4];
      games.push([
        teamA,
        teamB,
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6),
        `2026-06-${(10 + i).toString().padStart(2, '0')}`,
        'completed'
      ]);
    }

    const [gameResult] = await connection.query(
      `INSERT INTO game_results (teamAName, teamBName, teamAScore, teamBScore, date, status) VALUES ?`,
      [games]
    );
    console.log(`- Inserted ${gameResult.affectedRows} game results.`);

    // C. Seed Suspensions (3 active)[cite: 1, 2, 3]
    // Fetch newly created player IDs to link suspensions
    const [rows] = await connection.query('SELECT id, firstName, lastName FROM player_registrations LIMIT 3');
    const suspensions = [
      [rows[0].id, `${rows[0].firstName} ${rows[0].lastName}`, "Fighting", 2, true],
      [rows[1].id, `${rows[1].firstName} ${rows[1].lastName}`, "Unsportsmanlike conduct", 3, true],
      [rows[2].id, `${rows[2].firstName} ${rows[2].lastName}`, "Excessive penalties", 1, true]
    ];

    const [susResult] = await connection.query(
      `INSERT INTO suspensions (playerId, playerName, reason, gamesRemaining, active) VALUES ?`,
      [suspensions]
    );
    console.log(`- Inserted ${susResult.affectedRows} active suspensions.`);

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await connection.end();
  }
}

seed();