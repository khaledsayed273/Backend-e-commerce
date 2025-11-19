'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product_translations extends Model {

    static associate(models) {
      // define association here
      product_translations.belongsTo(models.product, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  product_translations.init({
    productId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    short_description: DataTypes.STRING,
    language: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'product_translations',
  });
  return product_translations;
};