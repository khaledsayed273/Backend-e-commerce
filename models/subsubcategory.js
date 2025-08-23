'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subsubcategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      subsubcategory.belongsTo(models.subcategory, { foreignKey: 'subCategorySlug', targetKey: 'slug', as: 'sub_sub_category' })
      subsubcategory.hasMany(models.product, {
        foreignKey: 'subSubCategorySlug',
        targetKey: 'slug',
        as: 'subSubCategory',
      });
    }
  }
  subsubcategory.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    placeholder: DataTypes.STRING,
    image: DataTypes.STRING
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