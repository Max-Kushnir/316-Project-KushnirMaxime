'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlist_songs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      playlist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'playlists',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      song_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'songs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint on playlist_id + position
    await queryInterface.addConstraint('playlist_songs', {
      fields: ['playlist_id', 'position'],
      type: 'unique',
      name: 'playlist_songs_playlist_id_position_unique'
    });

    // Add indexes
    await queryInterface.addIndex('playlist_songs', ['playlist_id']);
    await queryInterface.addIndex('playlist_songs', ['song_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('playlist_songs');
  }
};
