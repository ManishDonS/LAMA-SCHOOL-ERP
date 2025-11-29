require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'school_erp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER,
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attempt to fix the PK if it was created incorrectly (version as PK)
    try {
      await client.query('ALTER TABLE schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey');
      await client.query('ALTER TABLE schema_migrations ADD PRIMARY KEY (name)');
    } catch (e) {
      // Ignore error if PK already correct or other issues, we'll proceed and see
      console.log('Note: Could not alter schema_migrations PK, might be already correct or different issue.');
    }

    // Get all migration files
    const migrationsDir = __dirname;
    const versions = fs.readdirSync(migrationsDir).filter(file => file.startsWith('v'));

    for (const version of versions.sort()) {
      const versionPath = path.join(migrationsDir, version);
      const files = fs.readdirSync(versionPath).filter(file => file.endsWith('.sql')).sort();

      for (const file of files) {
        const filePath = path.join(versionPath, file);
        const versionNum = parseInt(version.replace('v', ''));

        // Check if migration already ran
        const result = await client.query(
          'SELECT * FROM schema_migrations WHERE name = $1',
          [file]
        );

        if (result.rows.length === 0) {
          console.log(`Running migration: ${version}/${file}`);
          const sql = fs.readFileSync(filePath, 'utf8');

          await client.query(sql);

          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [versionNum, file]
          );

          console.log(`✅ Migration completed: ${file}`);
        } else {
          console.log(`⏭️  Migration already ran: ${file}`);
        }
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
