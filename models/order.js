'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      order.belongsTo(models.user, { foreignKey: 'userId', as: 'user' });
      order.belongsTo(models.coupon, { foreignKey: 'couponId', as: 'coupon' });
      order.hasMany(models.order_item, { foreignKey: 'orderId', as: 'items' });
    }
  }
  order.init({
    code: DataTypes.STRING,
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    finalTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentMethod: DataTypes.STRING,
    address: DataTypes.TEXT,
    notes: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'order',
  });
  return order;
};