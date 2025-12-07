const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PlaylistSong = sequelize.define('PlaylistSong', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  playlist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'playlists',
      key: 'id'
    }
  },
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'songs',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'playlist_songs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['playlist_id', 'position']
    }
  ]
});

module.exports = PlaylistSong;
