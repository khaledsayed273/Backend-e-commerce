'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class setting extends Model {

    static associate(models) {
      // define association here
    }
  }
  setting.init({
    logo: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('logo');
        if (!value) return null;
        return `${process.env.baseUrl}/${value.replace(/\\/g, '/')}`;
      }
    },
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