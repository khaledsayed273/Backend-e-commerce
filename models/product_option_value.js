'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product_option_value extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      product_option_value.belongsTo(models.product_option, { foreignKey: 'productOptionId', as: 'productOption' });
    }
  }
  product_option_value.init({
    value: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'product_option_value',
  });
  return product_option_value;
};