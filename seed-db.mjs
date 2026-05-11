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
      await connection.query('DELETE FROM starsOfWeek');
      await connection.query('DELETE FROM blogPosts');
      await connection.query('DELETE FROM newsPosts');
      await connection.query('DELETE FROM games');
      await connection.query('DELETE FROM playerRegistrations');
      await connection.query('DELETE FROM teams');
      await connection.query('DELETE FROM gameVenues');
      await connection.query('DELETE FROM seasons');
    }

    // 1. Seed Seasons
    const [seasonResult] = await connection.query(
      `INSERT INTO seasons (name, startDate, endDate, isActive) VALUES ?`,
      [[['Summer 2026', '2026-06-23', '2026-08-25', true]]]
    );
    const seasonId = seasonResult.insertId;
    console.log(`- Inserted Season (ID: ${seasonId}).`);

    // 2. Seed Teams
    const teamsData = [
      ['Iron Lions', null, seasonId],
      ['Golan Guards', null, seasonId],
      ['H Hammers', null, seasonId],
      ['Schvitz Saints', null, seasonId]
    ];
    await connection.query(
      `INSERT INTO teams (name, logoUrl, seasonId) VALUES ?`,
      [teamsData]
    );
    const [teamsResult] = await connection.query('SELECT id FROM teams WHERE seasonId = ?', [seasonId]);
    const teamIds = teamsResult.map(t => t.id);
    console.log(`- Inserted 4 Teams.`);

    // 3. Seed Venues
    const venuesData = [
      ['Samuel Moscovitch Arena', '6985 Mackle Rd, Côte Saint-Luc'],
      ['Outremont Arena', '999 McEachran Ave, Outremont']
    ];
    await connection.query(
      `INSERT INTO gameVenues (name, address) VALUES ?`,
      [venuesData]
    );
    const [venuesResult] = await connection.query('SELECT id FROM gameVenues');
    const venueIds = venuesResult.map(v => v.id);
    console.log(`- Inserted 2 Venues.`);

    // 4. Seed Player Registrations (20 total)
    const players = [];

    for (let i = 1; i <= 20; i++) {
      let regType = 'individual';
      if (i > 10 && i <= 15) regType = 'team';

      players.push([
        `Player${i}`,
        `Last${i}`,
        `player${i}@example.com`,
        `514-555-00${i.toString().padStart(2, '0')}`,
        teamIds[i % teamIds.length],
        seasonId,
        false,
        regType,
        'approved',
        true,
        true
      ]);
    }

    const [regResult] = await connection.query(
      `INSERT INTO playerRegistrations 
      (firstName, lastName, email, phone, teamId, seasonId, isFirstTime, registrationType, status, paymentConfirmed, jerseyOrderConfirmed) 
      VALUES ?`,
      [players]
    );
    console.log(`- Inserted ${regResult.affectedRows} player registrations.`);

    // 5. Seed Games (20 Games: 10 Completed, 10 Scheduled)
    const games = [];
    const teamCombos = [
      [teamIds[0], teamIds[1]],
      [teamIds[1], teamIds[2]],
      [teamIds[2], teamIds[3]],
      [teamIds[3], teamIds[0]],
      [teamIds[0], teamIds[2]],
      [teamIds[1], teamIds[3]]
    ];

    // Past completed games (May 2026)
    for (let i = 1; i <= 10; i++) {
      const combo = teamCombos[i % teamCombos.length];
      const homeScore = Math.floor(Math.random() * 6);
      const awayScore = Math.floor(Math.random() * 6);
      games.push([
        seasonId,
        combo[0],
        combo[1],
        venueIds[i % venueIds.length],
        `2026-05-${(10 + i).toString().padStart(2, '0')}`,
        i % 2 === 0 ? '9:30 PM' : '10:00 PM',
        homeScore,
        awayScore,
        'completed'
      ]);
    }

    // Future scheduled games (June-August 2026)
    let gameDate = new Date('2026-06-23');
    for (let i = 1; i <= 10; i++) {
      const combo = teamCombos[i % teamCombos.length];
      games.push([
        seasonId,
        combo[0],
        combo[1],
        venueIds[i % venueIds.length],
        gameDate.toISOString().split('T')[0],
        i % 2 === 0 ? '9:30 PM' : '10:00 PM',
        null,
        null,
        'scheduled'
      ]);
      gameDate.setDate(gameDate.getDate() + 3);
    }

    const [gameResult] = await connection.query(
      `INSERT INTO games (seasonId, homeTeamId, awayTeamId, venueId, gameDate, gameTime, homeScore, awayScore, status) VALUES ?`,
      [games]
    );
    console.log(`- Inserted ${gameResult.affectedRows} games (10 past, 10 future).`);

    // 6. Seed Suspensions (3 active)
    const [playerRows] = await connection.query('SELECT id, firstName, lastName FROM playerRegistrations LIMIT 3');
    const suspensions = [];
    const reasons = ['Fighting', 'Unsportsmanlike conduct', 'Too many penalties'];
    playerRows.forEach((player, idx) => {
      suspensions.push([
        null,
        `${player.firstName} ${player.lastName}`,
        null,
        seasonId,
        reasons[idx],
        '2026-06-23',
        null,
        true
      ]);
    });

    await connection.query(
      `INSERT INTO suspensions (playerTeamId, playerName, teamId, seasonId, reason, startDate, endDate, isActive) VALUES ?`,
      [suspensions]
    );
    console.log(`- Inserted ${suspensions.length} active suspensions.`);

    // 7. Seed News Posts (3 posts)
    const newsData = [
      ['Welcome to MIHL Summer 2026', 'Registration is now open! Sign up today to secure your spot in the league.', null, null, seasonId],
      ['Schvitz Saints Unveil New Jerseys', 'The Saints will be rocking green and white this season. Come see them opening night.', null, null, seasonId],
      ['Rule Changes for Goalies', 'Please note the new crease violations guidelines uploaded to the portal.', null, null, seasonId]
    ];
    await connection.query(
      `INSERT INTO newsPosts (title, content, imageUrl, authorId, seasonId) VALUES ?`,
      [newsData]
    );
    console.log(`- Inserted ${newsData.length} news posts.`);

    // 8. Seed Blog Posts (3 posts)
    const blogData = [
      ['Summer League Tips', 'Here are some tips for getting the most out of your summer league experience.', null, null, seasonId],
      ['Player Spotlight: Top Scorers', 'Meet the top scorers from last season and see who will lead the charge this year.', null, null, seasonId],
      ['Referee Certification Requirements', 'All referees must maintain current certification. Check the requirements here.', null, null, seasonId]
    ];
    await connection.query(
      `INSERT INTO blogPosts (title, content, imageUrl, authorId, seasonId) VALUES ?`,
      [blogData]
    );
    console.log(`- Inserted ${blogData.length} blog posts.`);

    // 9. Seed Stars of the Week (3 stars)
    const starsData = [
      [null, 'Player1', teamIds[0], seasonId, 1, 9],
      [null, 'Player2', teamIds[1], seasonId, 2, 8],
      [null, 'Player3', teamIds[2], seasonId, 3, 9]
    ];
    await connection.query(
      `INSERT INTO starsOfWeek (playerTeamId, playerName, teamId, seasonId, weekNumber, rating) VALUES ?`,
      [starsData]
    );
    console.log(`- Inserted ${starsData.length} stars of the week.`);

    // 10. Seed Player Stats (20 stats)
    const playerStatsData = [];
    for (let i = 1; i <= 20; i++) {
      playerStatsData.push([
        i,
        seasonId,
        Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 25),
        Math.floor(Math.random() * 50),
        Math.floor(Math.random() * 15) + 1
      ]);
    }
    if (playerStatsData.length > 0) {
      await connection.query(
        `INSERT INTO playerStats (playerTeamId, seasonId, goals, assists, points, gamesPlayed) VALUES ?`,
        [playerStatsData]
      );
      console.log(`- Inserted ${playerStatsData.length} player stats.`);
    }

    console.log("\n✅ Seeding complete! Database is ready for development.");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
