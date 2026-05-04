import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: url.hostname,
  port: url.port || 4000,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

try {
  // Check current columns in users table
  const [userCols] = await connection.execute("SHOW COLUMNS FROM users");
  console.log("Users table columns:", userCols.map(c => c.Field));
  
  // Add evaluationDate to playerRegistrations
  await connection.execute("ALTER TABLE `playerRegistrations` ADD COLUMN `evaluationDate` VARCHAR(20) DEFAULT NULL");
  console.log("✅ evaluationDate column added to playerRegistrations");
} catch (error) {
  if (error.message?.includes("Duplicate column")) {
    console.log("⚠️ evaluationDate column already exists");
  } else {
    console.error("❌ Error:", error.message);
  }
}

await connection.end();
