// QuarterlyPerformance.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class QuarterlyPerformance extends Model {}

QuarterlyPerformance.init({
  quarterIdentifier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  teamUserAssociation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  revenueTarget: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  actualRevenue: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quotaAttainmentPercentage: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  activityMetrics: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  calculationTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  predictedRevenue: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  confidenceInterval: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  seasonalityFactors: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  predictionTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'QuarterlyPerformance',
});

module.exports = QuarterlyPerformance;
