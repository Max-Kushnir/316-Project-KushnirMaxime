const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PlaylistListener = sequelize.define('PlaylistListener', {
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
  listener_identifier: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  listened_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'playlist_listeners',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['playlist_id', 'listener_identifier']
    }
  ]
});

module.exports = PlaylistListener;
