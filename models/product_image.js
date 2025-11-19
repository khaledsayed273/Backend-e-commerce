'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product_image extends Model {
    static associate(models) {
      // define association here
      product_image.belongsTo(models.product, { foreignKey: 'productId' })
    }
  }
  product_image.init({
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        const value = this.getDataValue('imageUrl');
        return value ? `${process.env.baseUrl}/${value.replace(/\\/g, '/')}` : null;
      }
    },
    placeholder: DataTypes.TEXT,
    isPrimary: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'product_image',
  });
  return product_image;
};