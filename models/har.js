const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('Har', {
  userUuid: {
    type: DataTypes.STRING
  },
  uploadName: {
    type: DataTypes.STRING
  },
  startedDateTime: {
    type: DataTypes.STRING
  },
  wait: {
    type: DataTypes.STRING
  },
  serverIPAddress: {
    type: DataTypes.STRING
  },
  request: {
    type: DataTypes.JSON
  },
  response:{
    type: DataTypes.JSON
  },
  serverLatitude: {
    type: DataTypes.STRING
  },
  serverLongtitude: {
    type: DataTypes.STRING
  },
  geo: {
    type: DataTypes.JSON
  }
}, {
});

module.exports = User;
