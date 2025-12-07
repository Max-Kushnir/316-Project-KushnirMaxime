const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/sequelize');

const Playlist = sequelize.define('Playlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  listener_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'playlists',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'owner_id']
    }
  ]
});

// Static method to get next untitled name
Playlist.getNextUntitledName = async function(ownerId) {
  const playlists = await this.findAll({
    where: {
      owner_id: ownerId,
      name: {
        [Op.regexp]: '^Untitled [0-9]+$'
      }
    },
    attributes: ['name'],
    order: [['name', 'ASC']]
  });

  const existingNumbers = playlists.map(p => {
    const match = p.name.match(/^Untitled (\d+)$/);
    return match ? parseInt(match[1]) : -1;
  });

  let nextNumber = 0;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  return `Untitled ${nextNumber}`;
};

module.exports = Playlist;
