// QuarterlyPerformancePredictor.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class QuarterlyPerformancePredictor extends Model {}

QuarterlyPerformancePredictor.init({
  modelVersion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  historicalDataReference: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  predictedRevenue: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  confidenceInterval: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  seasonalityFactors: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  predictionTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  bentoIdentifier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'QuarterlyPerformancePredictor',
});

module.exports = QuarterlyPerformancePredictor;
