import mysql from 'mysql2/promise';

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mihl_league',
  ssl: 'Amazon RDS' in process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
};

async function migrate() {
  const connection = await mysql.createConnection(connectionConfig);
  
  try {
    // Check if column exists
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='playerRegistrations' AND COLUMN_NAME='evaluationDate'`
    );
    
    if (rows.length === 0) {
      console.log('Adding evaluationDate column...');
      await connection.query(
        `ALTER TABLE playerRegistrations ADD COLUMN evaluationDate VARCHAR(10)`
      );
      console.log('✓ evaluationDate column added');
    } else {
      console.log('✓ evaluationDate column already exists');
    }
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

migrate();
