const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Song = sequelize.define('Song', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  artist: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  youtube_id: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  listen_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'songs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['title', 'artist', 'year']
    }
  ]
});

module.exports = Song;
