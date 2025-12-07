'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlist_listeners', {
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
      listener_identifier: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      listened_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint
    await queryInterface.addConstraint('playlist_listeners', {
      fields: ['playlist_id', 'listener_identifier'],
      type: 'unique',
      name: 'playlist_listeners_playlist_id_listener_identifier_unique'
    });

    // Add index
    await queryInterface.addIndex('playlist_listeners', ['playlist_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('playlist_listeners');
  }
};
