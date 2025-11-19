'use strict';
const {
  Model
} = require('sequelize');

function generateSKU() {
  const prefix = "SKU";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

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
        as: 'brand'
      });
      product.hasMany(models.product_translations, { foreignKey: 'productId', as: 'translations' });
      product.hasMany(models.review, { foreignKey: 'productId', as: 'reviews' });
    }
  }
  product.init({
    slug: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    discount: DataTypes.DECIMAL(10, 2),
    sku: {
      type: DataTypes.STRING,
      unique: true,
    },
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
    variants: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'product',
    hooks: {
      beforeCreate: (product) => {
        if (!product.sku) {
          product.sku = generateSKU();
        }
      }
    }
  });
  return product;
};