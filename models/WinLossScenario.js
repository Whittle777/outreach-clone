const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WinLossScenario = sequelize.define('WinLossScenario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  prospectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Prospects',
      key: 'id',
    },
  },
  outcome: {
    type: DataTypes.ENUM('Win', 'Loss'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = WinLossScenario;
