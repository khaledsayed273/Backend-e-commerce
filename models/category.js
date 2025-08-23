'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      category.hasMany(models.product, { foreignKey: 'categorySlug', targetKey: 'slug', as: 'products' })
      category.hasMany(models.subcategory, { foreignKey: "categorySlug", sourceKey: 'slug', as: 'subcategories' })
    }
  }
  category.init({
    name: DataTypes.STRING,
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