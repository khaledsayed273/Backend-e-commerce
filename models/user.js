'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.order, { foreignKey: 'userId', as: 'orders' });
      user.hasMany(models.cart_item, { foreignKey: 'userId', as: 'carts' });
      user.hasMany(models.review, { foreignKey: 'userId', as: 'reviews' });
    }
  }
  user.init({
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    image: DataTypes.STRING,
    placeholder: DataTypes.TEXT,
    role: {
      type: DataTypes.ENUM('user', 'admin', 'manager'),
      defaultValue: 'user',
    },
    phone: {
      type: DataTypes.STRING,
    },
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'not_active'),
      defaultValue: 'active',
    },
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};