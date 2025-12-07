const sequelize = require('../config/sequelize');
const User = require('./User');
const Song = require('./Song');
const Playlist = require('./Playlist');
const PlaylistSong = require('./PlaylistSong');
const PlaylistListener = require('./PlaylistListener');

// Define associations

// User has many Songs (as owner)
User.hasMany(Song, { foreignKey: 'owner_id', as: 'songs' });
Song.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User has many Playlists (as owner)
User.hasMany(Playlist, { foreignKey: 'owner_id', as: 'playlists' });
Playlist.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Playlist belongsToMany Songs through PlaylistSong
Playlist.belongsToMany(Song, {
  through: PlaylistSong,
  foreignKey: 'playlist_id',
  otherKey: 'song_id',
  as: 'songs'
});
Song.belongsToMany(Playlist, {
  through: PlaylistSong,
  foreignKey: 'song_id',
  otherKey: 'playlist_id',
  as: 'playlists'
});

// For direct access to junction table
Playlist.hasMany(PlaylistSong, { foreignKey: 'playlist_id', as: 'playlistSongs' });
PlaylistSong.belongsTo(Playlist, { foreignKey: 'playlist_id' });
PlaylistSong.belongsTo(Song, { foreignKey: 'song_id', as: 'song' });
Song.hasMany(PlaylistSong, { foreignKey: 'song_id', as: 'playlistSongs' });

// Playlist has many PlaylistListeners
Playlist.hasMany(PlaylistListener, { foreignKey: 'playlist_id', as: 'listeners' });
PlaylistListener.belongsTo(Playlist, { foreignKey: 'playlist_id' });

module.exports = {
  sequelize,
  User,
  Song,
  Playlist,
  PlaylistSong,
  PlaylistListener
};
