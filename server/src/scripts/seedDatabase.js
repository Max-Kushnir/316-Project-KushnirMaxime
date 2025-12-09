/**
 * Database Seed Script for Playlister
 *
 * Fetches test data from PlaylisterData GitHub repository and imports into database.
 *
 * Usage: npm run seed
 * Options:
 *   --clear  Clear existing data before seeding
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Song, Playlist, PlaylistSong, PlaylistListener } = require('../models');

const DATA_URL = 'https://raw.githubusercontent.com/TheMcKillaGorilla/PlaylisterData/main/public/data/PlaylisterData.json';
const DEFAULT_PASSWORD = 'password123';
const SALT_ROUNDS = 10;

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');

/**
 * Fetch JSON data from the PlaylisterData repository
 */
async function fetchData() {
  console.log('Fetching data from:', DATA_URL);

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Fetched ${data.users?.length || 0} users and ${data.playlists?.length || 0} playlists`);

  return data;
}

/**
 * Clear all existing data from the database
 */
async function clearDatabase(transaction) {
  console.log('Clearing existing data...');

  // Delete in order respecting foreign key constraints
  await PlaylistListener.destroy({ where: {}, transaction });
  console.log('  - Cleared playlist_listeners');

  await PlaylistSong.destroy({ where: {}, transaction });
  console.log('  - Cleared playlist_songs');

  await Playlist.destroy({ where: {}, transaction });
  console.log('  - Cleared playlists');

  await Song.destroy({ where: {}, transaction });
  console.log('  - Cleared songs');

  await User.destroy({ where: {}, transaction });
  console.log('  - Cleared users');

  console.log('Database cleared successfully');
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract YouTube video ID from a string
 * YouTube IDs are 11 characters, may have URL parameters after
 */
function extractYouTubeId(input) {
  if (!input) return null;

  // If it's already just the ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Extract from URL or string with parameters
  // Handles: youTubeId, youTubeId&list=..., watch?v=youTubeId, etc.
  const match = input.match(/^([a-zA-Z0-9_-]{11})/);
  if (match) {
    return match[1];
  }

  // Try to extract from full URL
  const urlMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return input.slice(0, 20); // Fallback: truncate to fit column
}

/**
 * Create users from the source data
 * Returns a map of email -> user record
 */
async function createUsers(users, passwordHash, transaction) {
  console.log('\nCreating users...');

  const userMap = new Map();
  let created = 0;
  let skipped = 0;

  for (const userData of users) {
    if (!userData.email || !userData.name) {
      console.warn(`  - Skipping user with missing data: ${JSON.stringify(userData)}`);
      skipped++;
      continue;
    }

    // Validate email format
    if (!isValidEmail(userData.email)) {
      console.warn(`  - Skipping user with invalid email: ${userData.email}`);
      skipped++;
      continue;
    }

    try {
      // Use findOrCreate to avoid unique constraint errors that abort transactions
      // Normalize email to lowercase to match express-validator's normalizeEmail()
      const normalizedEmail = userData.email.toLowerCase();
      const [user, wasCreated] = await User.findOrCreate({
        where: { email: normalizedEmail },
        defaults: {
          username: userData.name,
          password_hash: passwordHash,
          avatar_image: null
        },
        transaction
      });

      userMap.set(userData.email.toLowerCase(), user);

      if (wasCreated) {
        created++;
        console.log(`  + Created user: ${userData.name} (${userData.email})`);
      } else {
        console.log(`  = Found existing user: ${user.username} (${userData.email})`);
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.warn(`  - Skipping user with validation error: ${userData.email}`);
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log(`Created ${created} users, found ${userMap.size - created} existing (skipped ${skipped})`);
  return userMap;
}

/**
 * Extract unique songs from all playlists
 * Returns a map of "title|artist|year" -> song data with owner
 */
function extractUniqueSongs(playlists, userMap) {
  console.log('\nExtracting unique songs from playlists...');

  const songMap = new Map();

  for (const playlist of playlists) {
    const ownerEmail = playlist.ownerEmail?.toLowerCase();
    const owner = userMap.get(ownerEmail);

    if (!owner) {
      // Silently skip - we'll warn when creating playlists
      continue;
    }

    if (!playlist.songs || !Array.isArray(playlist.songs)) {
      continue;
    }

    for (const song of playlist.songs) {
      if (!song.title || !song.artist || song.year === undefined || !song.youTubeId) {
        console.warn(`  - Skipping song with missing data: ${JSON.stringify(song)}`);
        continue;
      }

      const youtubeId = extractYouTubeId(song.youTubeId);
      if (!youtubeId) {
        console.warn(`  - Skipping song with invalid YouTube ID: ${song.youTubeId}`);
        continue;
      }

      // Truncate fields to fit database schema (VARCHAR(255))
      const title = song.title.slice(0, 255);
      const artist = song.artist.slice(0, 255);

      const key = `${title}|${artist}|${song.year}`;

      // First user to use this song becomes the owner
      if (!songMap.has(key)) {
        songMap.set(key, {
          title: title,
          artist: artist,
          year: song.year,
          youtube_id: youtubeId,
          owner_id: owner.id
        });
      }
    }
  }

  console.log(`Found ${songMap.size} unique songs`);
  return songMap;
}

/**
 * Create songs in the database using bulk insert
 * Returns a map of "title|artist|year" -> song record
 */
async function createSongs(songMap, transaction) {
  console.log('\nCreating songs...');

  // Prepare bulk data
  const songsToCreate = [];
  const keyOrder = [];

  for (const [key, songData] of songMap) {
    keyOrder.push(key);
    songsToCreate.push({
      title: songData.title,
      artist: songData.artist,
      year: songData.year,
      youtube_id: songData.youtube_id,
      owner_id: songData.owner_id,
      listen_count: 0
    });
  }

  // Bulk create all songs
  const createdSongs = await Song.bulkCreate(songsToCreate, {
    transaction,
    ignoreDuplicates: true,
    returning: true
  });

  console.log(`  + Bulk created ${createdSongs.length} songs`);

  // Build the map from created records
  const songRecordMap = new Map();

  // Fetch all songs to get their IDs (needed because ignoreDuplicates may not return all)
  const allSongs = await Song.findAll({ transaction });
  for (const song of allSongs) {
    const key = `${song.title}|${song.artist}|${song.year}`;
    songRecordMap.set(key, song);
  }

  console.log(`Created/found ${songRecordMap.size} songs`);
  return songRecordMap;
}

/**
 * Create playlists and their song associations using bulk insert
 */
async function createPlaylists(playlists, userMap, songRecordMap, transaction) {
  console.log('\nCreating playlists...');

  // First pass: prepare playlist data and track which songs go where
  const playlistsToCreate = [];
  const playlistSongData = []; // Will store { playlistKey, songKey, position }

  let skipped = 0;

  for (let i = 0; i < playlists.length; i++) {
    const playlistData = playlists[i];
    const ownerEmail = playlistData.ownerEmail?.toLowerCase();
    const owner = userMap.get(ownerEmail);

    if (!owner) {
      console.warn(`  - Skipping playlist "${playlistData.name}": owner not found (${playlistData.ownerEmail})`);
      skipped++;
      continue;
    }

    if (!playlistData.name) {
      console.warn(`  - Skipping playlist with no name for user ${ownerEmail}`);
      skipped++;
      continue;
    }

    // Use name|owner_id as key (matches unique constraint)
    const playlistKey = `${playlistData.name}|${owner.id}`;
    playlistsToCreate.push({
      name: playlistData.name,
      owner_id: owner.id,
      listener_count: 0
    });

    // Track songs for this playlist
    if (playlistData.songs && Array.isArray(playlistData.songs)) {
      for (let position = 0; position < playlistData.songs.length; position++) {
        const songData = playlistData.songs[position];

        if (!songData.title || !songData.artist || songData.year === undefined) {
          continue;
        }

        const key = `${songData.title}|${songData.artist}|${songData.year}`;
        if (songRecordMap.has(key)) {
          playlistSongData.push({ playlistKey, songKey: key, position });
        }
      }
    }
  }

  console.log(`  Prepared ${playlistsToCreate.length} playlists (skipped ${skipped})`);

  // Bulk create all playlists (ignore duplicates for idempotent seeding)
  await Playlist.bulkCreate(playlistsToCreate, {
    transaction,
    ignoreDuplicates: true
  });

  console.log(`  + Bulk created playlists`);

  // Fetch all playlists to get their IDs (needed because ignoreDuplicates may not return all)
  const allPlaylists = await Playlist.findAll({ transaction });
  const playlistRecordMap = new Map();
  for (const playlist of allPlaylists) {
    const key = `${playlist.name}|${playlist.owner_id}`;
    playlistRecordMap.set(key, playlist);
  }

  console.log(`  Found ${playlistRecordMap.size} playlists in database`);

  // Build playlist_songs records
  const playlistSongsToCreate = [];

  for (const { playlistKey, songKey, position } of playlistSongData) {
    const playlist = playlistRecordMap.get(playlistKey);
    const song = songRecordMap.get(songKey);

    if (playlist && song) {
      playlistSongsToCreate.push({
        playlist_id: playlist.id,
        song_id: song.id,
        position: position
      });
    }
  }

  console.log(`  Prepared ${playlistSongsToCreate.length} playlist-song links`);

  // Bulk create all playlist_songs
  await PlaylistSong.bulkCreate(playlistSongsToCreate, {
    transaction,
    ignoreDuplicates: true
  });

  console.log(`  + Bulk created ${playlistSongsToCreate.length} playlist-song links`);
}

/**
 * Main seed function
 */
async function seed() {
  console.log('='.repeat(60));
  console.log('Playlister Database Seed Script');
  console.log('='.repeat(60));
  console.log(`Clear existing data: ${shouldClear ? 'Yes' : 'No'}`);
  console.log('');

  const transaction = await sequelize.transaction();

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.\n');

    // Hash password once for all users
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Clear existing data if requested
    if (shouldClear) {
      await clearDatabase(transaction);
    }

    // Fetch source data
    const data = await fetchData();

    if (!data.users || !Array.isArray(data.users)) {
      throw new Error('Invalid data format: missing users array');
    }

    if (!data.playlists || !Array.isArray(data.playlists)) {
      throw new Error('Invalid data format: missing playlists array');
    }

    // Create users
    const userMap = await createUsers(data.users, passwordHash, transaction);

    // Extract and create songs
    const songDataMap = extractUniqueSongs(data.playlists, userMap);
    const songRecordMap = await createSongs(songDataMap, transaction);

    // Create playlists and song associations
    await createPlaylists(data.playlists, userMap, songRecordMap, transaction);

    // Commit transaction
    await transaction.commit();

    console.log('\n' + '='.repeat(60));
    console.log('Database seeded successfully!');
    console.log('='.repeat(60));
    console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('\n' + '='.repeat(60));
    console.error('Seed failed! Transaction rolled back.');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the seed script
seed();
