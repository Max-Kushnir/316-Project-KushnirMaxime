'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlists', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      listener_count: {
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

    // Add unique constraint on name + owner_id
    await queryInterface.addConstraint('playlists', {
      fields: ['name', 'owner_id'],
      type: 'unique',
      name: 'playlists_name_owner_id_unique'
    });

    // Add index on owner_id
    await queryInterface.addIndex('playlists', ['owner_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('playlists');
  }
};
