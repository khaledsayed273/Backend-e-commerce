'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cart_item extends Model {

    static associate(models) {
      cart_item.belongsTo(models.user, { foreignKey: 'userId' , as: 'user'});
      cart_item.belongsTo(models.product, { foreignKey: 'productId' });
      cart_item.hasMany(models.cart_item_option, { foreignKey: 'cartItemId', as: 'options', onDelete: 'CASCADE' });
    }
  }
  cart_item.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
  }, {
    sequelize,
    modelName: 'cart_item',
  });
  return cart_item;
};