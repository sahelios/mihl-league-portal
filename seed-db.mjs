import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🌱 Starting database seeding...');

  // Create season
  const [seasonResult] = await connection.query(
    'INSERT INTO seasons (name, startDate, endDate, isActive) VALUES (?, ?, ?, ?)',
    ['2026 Summer Season', '2026-06-23', '2026-08-25', true]
  );
  const seasonId = seasonResult.insertId;
  console.log(`✅ Created season: ${seasonId}`);

  // Create teams
  const teams = [
    { name: 'Iron Lions', logo: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/iron-lions-logo-fiEiAMaxLU9qYQBRDYwNns.webp' },
    { name: 'Golan Guards', logo: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/golan-guards-logo-FbhtjKpEXATVoD9wpHyW2B.webp' },
    { name: 'H Hammers', logo: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/h-hammers-logo-GXbHhx2YjSRs2NYyRT5gQn.webp' },
    { name: 'Schvitz Saints', logo: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/schvitz-saints-logo-goQfhvsxxvmaJf3eho6a3J.webp' },
  ];

  const teamIds = [];
  for (const team of teams) {
    const [result] = await connection.query(
      'INSERT INTO teams (name, logoUrl, seasonId) VALUES (?, ?, ?)',
      [team.name, team.logo, seasonId]
    );
    teamIds.push(result.insertId);
    console.log(`✅ Created team: ${team.name}`);
  }

  // Create venues
  const [venue1Result] = await connection.query(
    'INSERT INTO gameVenues (name, address) VALUES (?, ?)',
    ['Samuel Moscovitch Arena', 'Montreal, QC']
  );
  const venue1Id = venue1Result.insertId;

  const [venue2Result] = await connection.query(
    'INSERT INTO gameVenues (name, address) VALUES (?, ?)',
    ['Outremont Arena', 'Montreal, QC']
  );
  const venue2Id = venue2Result.insertId;
  console.log(`✅ Created venues`);

  // Generate games for 10 weeks (June 23 - August 25)
  // Tuesdays: 9:30 PM at Samuel Moscovitch Arena
  // Thursdays: 10:00 PM at Outremont Arena
  const games = [];
  const startDate = new Date('2026-06-23');

  for (let week = 0; week < 10; week++) {
    // Tuesday game
    const tuesdayDate = new Date(startDate);
    tuesdayDate.setDate(tuesdayDate.getDate() + week * 7);
    const tuesdayDateStr = tuesdayDate.toISOString().split('T')[0];

    // Thursday game
    const thursdayDate = new Date(startDate);
    thursdayDate.setDate(thursdayDate.getDate() + 2 + week * 7);
    const thursdayDateStr = thursdayDate.toISOString().split('T')[0];

    // Rotate matchups
    const matchups = [
      [0, 1], // Iron Lions vs Golan Guards
      [2, 3], // H Hammers vs Schvitz Saints
      [0, 2], // Iron Lions vs H Hammers
      [1, 3], // Golan Guards vs Schvitz Saints
      [0, 3], // Iron Lions vs Schvitz Saints
      [1, 2], // Golan Guards vs H Hammers
    ];

    const tuesdayMatchup = matchups[week % matchups.length];
    const thursdayMatchup = matchups[(week + 1) % matchups.length];

    // Tuesday game
    await connection.query(
      'INSERT INTO games (seasonId, homeTeamId, awayTeamId, venueId, gameDate, gameTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [seasonId, teamIds[tuesdayMatchup[0]], teamIds[tuesdayMatchup[1]], venue1Id, tuesdayDateStr, '21:30', 'scheduled']
    );

    // Thursday game
    await connection.query(
      'INSERT INTO games (seasonId, homeTeamId, awayTeamId, venueId, gameDate, gameTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [seasonId, teamIds[thursdayMatchup[0]], teamIds[thursdayMatchup[1]], venue2Id, thursdayDateStr, '22:00', 'scheduled']
    );

    console.log(`✅ Created games for week ${week + 1}`);
  }

  // Create team stats
  for (const teamId of teamIds) {
    await connection.query(
      'INSERT INTO teamStats (teamId, seasonId, wins, losses, ties, points, goalsFor, goalsAgainst) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [teamId, seasonId, 0, 0, 0, 0, 0, 0]
    );
  }
  console.log(`✅ Created team stats`);

  // Create sample news posts
  const newsPosts = [
    {
      title: 'Season Kicks Off June 23',
      content: 'The Mensches Ice Hockey League is excited to announce the start of the 2026 summer season on June 23rd. All four teams are ready to compete!',
    },
    {
      title: 'Registration Now Open',
      content: 'Player registration is now open for the 2026 season. Individual registration is $350, or register your full team for $6,500.',
    },
    {
      title: 'Meet the Four Teams',
      content: 'Get to know the Iron Lions, Golan Guards, H Hammers, and Schvitz Saints. Each team brings unique talent and passion to the league.',
    },
  ];

  for (const post of newsPosts) {
    await connection.query(
      'INSERT INTO newsPosts (title, content, seasonId) VALUES (?, ?, ?)',
      [post.title, post.content, seasonId]
    );
  }
  console.log(`✅ Created news posts`);

  // Create sample blog posts
  const blogPosts = [
    {
      title: 'The History of the MIHL',
      content: 'Learn about the founding and growth of The Mensches Ice Hockey League, a community-driven recreational league dedicated to competition and camaraderie.',
    },
    {
      title: 'Training Tips for Summer Hockey',
      content: 'As the season approaches, here are some tips to prepare yourself physically and mentally for the upcoming games.',
    },
    {
      title: 'Sportsmanship and Fair Play',
      content: 'The MIHL is committed to maintaining the highest standards of sportsmanship and fair play. Learn about our code of conduct.',
    },
  ];

  for (const post of blogPosts) {
    await connection.query(
      'INSERT INTO blogPosts (title, content, seasonId) VALUES (?, ?, ?)',
      [post.title, post.content, seasonId]
    );
  }
  console.log(`✅ Created blog posts`);

  console.log('\n✨ Database seeding completed successfully!');
  console.log(`Season ID: ${seasonId}`);
  console.log(`Team IDs: ${teamIds.join(', ')}`);

} catch (error) {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
} finally {
  await connection.end();
}
