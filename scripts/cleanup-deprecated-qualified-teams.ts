import * as dotenv from 'dotenv';
import * as path from 'path';
import { sql } from '@vercel/postgres';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Cleanup script to delete all records from the deprecated tournament_group_team_stats_guess table
 *
 * This table is scheduled for removal on March 11, 2026.
 * Foreign key constraints prevent user deletion when records exist in this table.
 *
 * Usage: npx tsx scripts/cleanup-deprecated-qualified-teams.ts
 */

async function cleanupDeprecatedTable() {
  console.log('Starting cleanup of deprecated tournament_group_team_stats_guess table...');

  try {
    // Count records before deletion
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM tournament_group_team_stats_guess
    `;

    const recordCount = countResult.rows[0]?.count ? Number(countResult.rows[0].count) : 0;

    if (recordCount === 0) {
      console.log('No records found in tournament_group_team_stats_guess table.');
      return;
    }

    console.log(`Found ${recordCount} records to delete.`);

    // Delete all records
    await sql`
      DELETE FROM tournament_group_team_stats_guess
    `;

    console.log(`Successfully deleted ${recordCount} records from tournament_group_team_stats_guess table.`);
    console.log('Cleanup complete! User deletion should now work without foreign key constraint errors.');

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

cleanupDeprecatedTable()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
