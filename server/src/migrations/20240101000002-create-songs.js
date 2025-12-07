'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      artist: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      youtube_id: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      listen_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint on title, artist, year
    await queryInterface.addConstraint('songs', {
      fields: ['title', 'artist', 'year'],
      type: 'unique',
      name: 'songs_title_artist_year_unique'
    });

    // Add index on owner_id
    await queryInterface.addIndex('songs', ['owner_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('songs');
  }
};
