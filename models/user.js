'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate(models) {
      // define association here
      user.hasMany(models.review, { foreignKey: 'userId', as: 'reviews' });
    }
  }
  user.init({
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('image');
        return value ? `${process.env.baseUrl}/${value.replace(/\\/g, '/')}` : null;
      }
    },
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