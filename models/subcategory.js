'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subcategory extends Model {

    static associate(models) {
      subcategory.belongsTo(models.category, {
        foreignKey: 'categorySlug',
        targetKey: 'slug',
        as: 'category',
      });

      subcategory.hasMany(models.subsubcategory, {
        foreignKey: 'subCategorySlug',
        sourceKey: 'slug',
        as: 'sub_sub_category',
      });

      subcategory.hasMany(models.product, {
        foreignKey: 'subCategorySlug',
        sourceKey: 'slug',
        as: 'products',
      });
    }
  }
  subcategory.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('image');
        return value ? `${process.env.baseUrl}/${value.replace(/\\/g, '/')}` : null;
      }
    },
    placeholder: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'subcategory',
    hooks: {
      beforeValidate: (subcategory) => {
        if (subcategory.name) {
          subcategory.name = subcategory.name.trim().toLowerCase();
        }
        if (subcategory.slug) {
          subcategory.slug = subcategory.slug.trim().toLowerCase();
        }
      }
    }
  });
  return subcategory;
};