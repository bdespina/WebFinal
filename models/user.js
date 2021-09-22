const uuidv4 = require('uuid').v4;
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM([
      'admin',
      'user'
    ]),
    defaultValue: 'user'
  },
  userUuid: {
    type: DataTypes.STRING
  }
}, {
});

User.beforeCreate(user => {
  user.userUuid = uuidv4();
});

module.exports = User;
