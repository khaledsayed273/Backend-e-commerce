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
    imageUrl: DataTypes.STRING,
    // image: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     const rawValue = this.getDataValue('imageUrl');
    //     const baseUrl = process.env.BASE_URL || 'http://localhost:8080/api/v1';
    //     if (rawValue && !rawValue.startsWith('http')) {
    //       const fixedPath = rawValue.replace(/\\/g, '/');
    //       return `${baseUrl}/${fixedPath}`;
    //     }
    //     return rawValue ? rawValue.replace(/\\/g, '/') : null;
    //   }
    // },
    placeholder: DataTypes.TEXT,
    isPrimary: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'product_image',
  });
  return product_image;
};