'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_item_options', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cartItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cart_items', key: 'id' },
        onDelete: 'CASCADE',
      },
      productOptionValueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'product_option_values', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cart_item_options');
  }
};