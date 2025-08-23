'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cart_item_option extends Model {

    static associate(models) {
      cart_item_option.belongsTo(models.cart_item, { foreignKey: 'cartItemId' });
      cart_item_option.belongsTo(models.product_option_value, { foreignKey: 'productOptionValueId', as: 'value', onDelete: 'CASCADE' });
    }
  }
  cart_item_option.init({
    cartItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'cart_items', key: 'id' },
      onDelete: 'CASCADE',
    },
    productOptionValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'product_option_values', key: 'id' },
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'cart_item_option',
  });
  return cart_item_option;
};