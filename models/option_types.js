'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class option_types extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      option_types.hasMany(models.product_option, { foreignKey: 'optionTypeId' });
    }
  }
  option_types.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'option_types',
  });
  return option_types;
};