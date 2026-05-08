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
    ssl: { rejectUnauthorized: false },
  });

  try {
    if (shouldClear) {
      console.log("Clearing existing data...");
      await connection.query('DELETE FROM suspensions');
      await connection.query('DELETE FROM game_results');
      await connection.query('DELETE FROM player_registrations');
      await connection.query('DELETE FROM teams');
      await connection.query('DELETE FROM venues');
      await connection.query('DELETE FROM seasons');
      await connection.query('DELETE FROM news_posts');
    }

    // 1. Seed Seasons
    const [seasonResult] = await connection.query(
      `INSERT INTO seasons (name, startDate, endDate) VALUES ?`,
      [[['Summer 2026', '2026-05-01', '2026-08-31']]]
    );
    const seasonId = seasonResult.insertId;
    console.log(`- Inserted Season (ID: ${seasonId}).`);

    // 2. Seed Teams
    const teamsData = [
      ['Iron Lions', '#B22222', '#FFFFFF'],
      ['Golan Guards', '#000080', '#FFFFFF'],
      ['H Hammers', '#4B0082', '#FFD700'],
      ['Schvitz Saints', '#006400', '#FFFFFF'] // Community favorite
    ];
    await connection.query(
      `INSERT INTO teams (name, primaryColor, secondaryColor) VALUES ?`,
      [teamsData]
    );
    console.log(`- Inserted 4 Teams.`);

    // 3. Seed Venues
    const venuesData = [
      ['Samuel Moscovitch Arena', '6985 Mackle Rd', 'Côte Saint-Luc', 500],
      ['Outremont Arena', '999 McEachran Ave', 'Outremont', 300]
    ];
    await connection.query(
      `INSERT INTO venues (name, address, city, capacity) VALUES ?`,
      [venuesData]
    );
    console.log(`- Inserted 2 Venues.`);

    // 4. Seed Player Registrations (20 total)
    const players = [];
    const types = ['individual', 'spare', 'referee', 'scorekeeper'];
    const statuses = ['pending', 'approved', 'rejected'];
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
        'approved', // Keep most approved so they show in Admin tools
        'paid',
        '2026-05-15',
        seasonId
      ]);
    }

    const [regResult] = await connection.query(
      `INSERT INTO player_registrations 
      (firstName, lastName, email, phone, registrationType, position, playerRating, status, paymentStatus, evaluationDate, seasonId) 
      VALUES ?`,
      [players]
    );
    console.log(`- Inserted ${regResult.affectedRows} player registrations.`);

    // 5. Seed Games (20 Games: 10 Completed, 10 Scheduled)
    const teams = ['Iron Lions', 'Golan Guards', 'H Hammers', 'Schvitz Saints'];
    const games = [];
    
    // Past completed games
    for (let i = 1; i <= 10; i++) {
      games.push([
        teams[i % 4],
        teams[(i + 1) % 4],
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6),
        `2026-05-${(10 + i).toString().padStart(2, '0')}`,
        '9:30 PM',
        venuesData[i % 2][0],
        'completed'
      ]);
    }

    // Future scheduled games (For the upcoming games slider)
    const futureDate = new Date(); // To ensure they always render dynamically
    for (let i = 1; i <= 10; i++) {
      futureDate.setDate(futureDate.getDate() + 2); 
      games.push([
        teams[i % 4],
        teams[(i + 2) % 4],
        0, 
        0, 
        futureDate.toISOString().split('T')[0],
        i % 2 === 0 ? '9:30 PM' : '10:00 PM',
        venuesData[i % 2][0],
        'scheduled'
      ]);
    }

    const [gameResult] = await connection.query(
      `INSERT INTO game_results (teamAName, teamBName, teamAScore, teamBScore, date, time, venueName, status) VALUES ?`,
      [games]
    );
    console.log(`- Inserted ${gameResult.affectedRows} game results (10 past, 10 future).`);

    // 6. Seed Suspensions
    const [rows] = await connection.query('SELECT id, firstName, lastName FROM player_registrations LIMIT 3');
    const suspensions = [
      [rows[0].id, `${rows[0].firstName} ${rows[0].lastName}`, "Fighting", 2, true],
      [rows[1].id, `${rows[1].firstName} ${rows[1].lastName}`, "Unsportsmanlike conduct", 3, true],
      [rows[2].id, `${rows[2].firstName} ${rows[2].lastName}`, "Too many penalties", 1, true]
    ];

    await connection.query(
      `INSERT INTO suspensions (playerId, playerName, reason, gamesRemaining, active) VALUES ?`,
      [suspensions]
    );
    console.log(`- Inserted 3 active suspensions.`);

    // 7. Seed News Posts
    const newsData = [
      ['Welcome to MIHL Summer 2026', 'Registration is now open! Sign up today to secure your spot in the league.', null, true],
      ['Schvitz Saints Unveil New Jerseys', 'The Saints will be rocking green and white this season. Come see them opening night.', null, true],
      ['Rule Changes for Goalies', 'Please note the new crease violations guidelines uploaded to the portal.', null, true]
    ];
    await connection.query(
      `INSERT INTO news_posts (title, content, imageUrl, published) VALUES ?`,
      [newsData]
    );
    console.log(`- Inserted 3 news posts.`);

    console.log("Seeding complete! Ready for local development.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await connection.end();
  }
}

seed();