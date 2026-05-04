import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: 'Amazon RDS',
});

try {
  await connection.execute('ALTER TABLE `users` DROP COLUMN `phone`');
  console.log('✅ Migration successful: phone column dropped');
} catch (error) {
  if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
    console.log('⚠️  Column already dropped or does not exist');
  } else {
    console.error('❌ Migration failed:', error.message);
  }
}

await connection.end();
