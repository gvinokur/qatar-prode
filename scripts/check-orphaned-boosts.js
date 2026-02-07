#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function checkOrphanedBoosts() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const query = `
      SELECT
        gg.id,
        gg.user_id,
        g.game_type,
        g.home_team,
        g.away_team,
        gg.score,
        gg.final_score,
        gg.boost_multiplier,
        gg.boost_type
      FROM game_guesses gg
      JOIN games g ON gg.game_id = g.id
      WHERE gg.user_id = '0d6fe0b9-7b12-43fa-ac10-841347345fe4'
        AND (gg.score IS NULL OR gg.score = 0)
        AND (gg.final_score IS NOT NULL OR gg.boost_multiplier IS NOT NULL)
      ORDER BY g.game_date DESC;
    `;

    const result = await client.query(query);

    console.log(`Found ${result.rows.length} records with orphaned boost data:\n`);

    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('✅ No orphaned boost data found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkOrphanedBoosts();
