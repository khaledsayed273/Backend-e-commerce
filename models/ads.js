'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ads extends Model {

    static associate(models) {
      // define association here
    }
  }
  ads.init({
    text: DataTypes.STRING,
    title: DataTypes.STRING,
    startAt: DataTypes.DATE,
    endAt: DataTypes.DATE,
    images: {
      type: DataTypes.JSON,
      get() {
        const value = this.getDataValue('images');
        if (!value) return [];
        return value.map(img => ({
          ...img,
          imageUrl: img.imageUrl
            ? `${process.env.baseUrl}/${img.imageUrl.replace(/\\/g, '/')}`
            : null
        }));
      }
    },
  }, {
    sequelize,
    modelName: 'ads',
  });
  return ads;
};