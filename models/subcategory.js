'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subcategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      subcategory.belongsTo(models.category, { foreignKey: 'categorySlug', targetKey: 'slug', as: 'category' })
      subcategory.hasMany(models.subsubcategory, { foreignKey: "subCategorySlug", sourceKey: 'slug', as: 'sub_sub_category' })
    }
  }
  subcategory.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    image: DataTypes.STRING,
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