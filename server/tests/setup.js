require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

// Track schema initialization globally
let schemaInitialized = false;

/**
 * Truncates all tables atomically with CASCADE and resets sequences.
 * This is much more reliable than individual DELETE statements.
 */
async function cleanDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      playlist_listeners,
      playlist_songs,
      playlists,
      songs,
      users
    RESTART IDENTITY CASCADE
  `);
}

// Run schema.sql before all tests to ensure tables exist
beforeAll(async () => {
  if (!schemaInitialized) {
    try {
      const schemaPath = path.join(__dirname, '../src/config/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      schemaInitialized = true;
    } catch (error) {
      // Ignore if schema already exists
      if (!error.message?.includes('already exists')) {
        throw error;
      }
      schemaInitialized = true;
    }
  }
});

// Clean database BEFORE each test - guarantees clean state
// regardless of whether previous test succeeded or failed
beforeEach(async () => {
  try {
    await cleanDatabase();
  } catch (error) {
    console.error('Error cleaning database in beforeEach:', error);
    throw error;
  }
});

// Note: We don't close the pool here because afterAll runs per test file,
// not globally. The process cleanup will handle closing the pool when tests complete.
