'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class category extends Model {
    static associate(models) {
      category.hasMany(models.subcategory, { foreignKey: "categorySlug", sourceKey: 'slug', as: 'subcategories' })
      category.hasMany(models.product, { foreignKey: 'categorySlug', targetKey: 'slug', as: 'products' })
    }
  }
  category.init({
    name: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('image');
        return value ? `${process.env.baseUrl}/${value.replace(/\\/g, '/')}` : null;
      }
    },
    placeholder: DataTypes.TEXT('long'),
    slug: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'category',
    hooks: {
      beforeValidate: (category) => {
        if (category.name) {
          category.name = category.name.trim().toLowerCase();
        }
        if (category.slug) {
          category.slug = category.slug.trim().toLowerCase();
        }
      }
    }
  });
  return category;
};