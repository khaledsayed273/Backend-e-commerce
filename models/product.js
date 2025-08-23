'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product extends Model {

    static associate(models) {
      // define association here
      product.hasMany(models.product_image, { foreignKey: 'productId', as: 'images' });
      product.belongsTo(models.category, {
        foreignKey: 'categorySlug',
        targetKey: 'slug',
        as: 'category',
      });
      product.belongsTo(models.subcategory, {
        foreignKey: 'subCategorySlug',
        targetKey: 'slug',
        as: 'subCategory',
      });
      product.belongsTo(models.subsubcategory, {
        foreignKey: 'subSubCategorySlug',
        targetKey: 'slug',
        as: 'subSubCategory',
      });
      product.belongsTo(models.brand, {
        foreignKey: 'brandSlug',
        targetKey: 'slug',
        as: 'brand',
      });
      
      product.hasMany(models.product_option, { foreignKey: 'productId', as: 'options' });
      product.hasMany(models.product_translations, { foreignKey: 'productId', as: 'translations' });
      product.hasMany(models.order_item, { foreignKey: 'productId', as: 'orderItems' });
      product.hasMany(models.cart_item, { foreignKey: 'productId', as: 'cartItems' });
      product.hasMany(models.review, { foreignKey: 'productId', as: 'reviews' });
    }
  }
  product.init({
    slug: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    discount: DataTypes.DECIMAL(10, 2),
    quantity: DataTypes.INTEGER,
    categorySlug: DataTypes.STRING,
    subCategorySlug: DataTypes.STRING,
    subSubCategorySlug: DataTypes.STRING,
    brandSlug: DataTypes.STRING,
    isAvailable: DataTypes.BOOLEAN,
    metaTitle: DataTypes.STRING,
    metaDescription: DataTypes.TEXT,
    metaKeywords: DataTypes.STRING,
    isVisible: DataTypes.BOOLEAN,
    averageRating: DataTypes.FLOAT,
    reviewsCount: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'product',
  });
  return product;
};