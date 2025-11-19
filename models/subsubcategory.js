'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subsubcategory extends Model {

    static associate(models) {
      // define association here
      subsubcategory.belongsTo(models.subcategory, { foreignKey: 'subCategorySlug', targetKey: 'slug', as: 'sub_category' })
      subsubcategory.hasMany(models.product, {
        foreignKey: 'subSubCategorySlug',
        sourceKey: 'slug',
        as: 'products',
      });
    }
  }
  subsubcategory.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    placeholder: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('image');
        return value ? `${process.env.baseUrl}/${value.replace(/\\/g, '/')}` : null;
      }
    }
  }, {
    sequelize,
    modelName: 'subsubcategory',
    hooks: {
      beforeValidate: (subsubcategory) => {
        if (subsubcategory.name) {
          subsubcategory.name = subsubcategory.name.trim().toLowerCase();
        }
        if (subsubcategory.slug) {
          subsubcategory.slug = subsubcategory.slug.trim().toLowerCase();
        }
      }
    }
  });
  return subsubcategory;
};