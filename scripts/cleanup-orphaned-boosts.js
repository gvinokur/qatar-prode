#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function cleanupOrphanedBoosts() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Run the UPDATE query
    const updateQuery = `
      UPDATE game_guesses
      SET
        boost_multiplier = NULL,
        boost_type = NULL,
        final_score = NULL
      WHERE user_id = '0d6fe0b9-7b12-43fa-ac10-841347345fe4'
        AND (score IS NULL OR score = 0)
        AND (final_score IS NOT NULL OR boost_multiplier IS NOT NULL OR boost_type IS NOT NULL);
    `;

    console.log('Running cleanup query...\n');
    const result = await client.query(updateQuery);
    console.log(`✅ Cleaned ${result.rowCount} records\n`);

    // Verify cleanup
    const verifyQuery = `
      SELECT COUNT(*) as remaining_count
      FROM game_guesses
      WHERE user_id = '0d6fe0b9-7b12-43fa-ac10-841347345fe4'
        AND (score IS NULL OR score = 0)
        AND (final_score IS NOT NULL OR boost_multiplier IS NOT NULL OR boost_type IS NOT NULL);
    `;

    const verifyResult = await client.query(verifyQuery);
    const remainingCount = parseInt(verifyResult.rows[0].remaining_count);

    if (remainingCount === 0) {
      console.log('✅ Verification passed: No orphaned boost data remains');
    } else {
      console.log(`⚠️ Warning: ${remainingCount} records still have orphaned boost data`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

cleanupOrphanedBoosts();
