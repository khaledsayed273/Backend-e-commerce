'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class currency extends Model {

    static associate(models) {
      // define association here
    }
  }
  currency.init({
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    symbol: DataTypes.STRING,
    exchange_rate: DataTypes.DECIMAL(10, 4)
  }, {
    sequelize,
    modelName: 'currency',
  });
  return currency;
};