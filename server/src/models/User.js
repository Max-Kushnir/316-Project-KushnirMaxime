const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  avatar_image: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Instance method to return safe user data (without password)
User.prototype.toSafeJSON = function() {
  return {
    id: this.id,
    email: this.email,
    username: this.username,
    avatar_image: this.avatar_image,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = User;
