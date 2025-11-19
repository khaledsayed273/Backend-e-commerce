'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class brand extends Model {

    static associate(models) {
      brand.hasMany(models.product, {
        foreignKey: 'brandSlug',  
        sourceKey: 'slug',       
        as: 'products'            
      });
    }
  }
  brand.init({
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
    modelName: 'brand',
    hooks: {
      beforeValidate: (brand) => {
        if (brand.name) {
          brand.name = brand.name.trim().toLowerCase();
        }
        if (brand.slug) {
          brand.slug = brand.slug.trim().toLowerCase();
        }
      }
    }
  });
  return brand;
};