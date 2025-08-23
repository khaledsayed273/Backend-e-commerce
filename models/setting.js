'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class setting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  setting.init({
    logo: DataTypes.STRING,
    placeholder: DataTypes.TEXT('long'),
    address: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    facebook: DataTypes.STRING,
    instagram: DataTypes.STRING,
    twitter: DataTypes.STRING,
    youtube: DataTypes.STRING,
    linkedin: DataTypes.STRING,
    copyright: DataTypes.STRING,
    metaTitle: DataTypes.STRING,
    metaDescription: DataTypes.TEXT,
    metaKeywords: DataTypes.STRING,
    fontFamily: DataTypes.STRING,
    mainColor: DataTypes.STRING,
    secondaryColor: DataTypes.STRING,
    categoryColor: DataTypes.STRING,
    subCategoryColor: DataTypes.STRING,
    subSubCategoryColor: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'setting',
  });
  return setting;
};