'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product_option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      product_option.belongsTo(models.product, { foreignKey: 'productId' });
      product_option.belongsTo(models.option_types, { foreignKey: 'optionTypeId', as: 'type' });
      product_option.hasMany(models.product_option_value, { foreignKey: 'productOptionId', as: 'values' });

    }
  }
  product_option.init({
  }, {
    sequelize,
    modelName: 'product_option',
  });
  return product_option;
};