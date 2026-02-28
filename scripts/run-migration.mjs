import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run-migration.mjs <migration-file>');
  process.exit(1);
}

const migrationPath = join(__dirname, '..', 'migrations', migrationFile);
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log(`Running migration: ${migrationFile}`);
console.log('---');

// Split into individual SQL statements (remove comments and split by semicolon)
const statements = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
  .join('\n')
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);

try {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    await sql.query(stmt);
    console.log(`✓ Statement ${i + 1} completed`);
  }
  console.log('\n✓ Migration completed successfully');
} catch (error) {
  console.error('\n✗ Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

process.exit(0);
