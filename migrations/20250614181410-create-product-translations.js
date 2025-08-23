'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_translations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      language: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      short_description: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.addConstraint('product_translations', {
      fields: ['productId', 'language'],
      type: 'unique',
      name: 'unique_product_language'
    });
    await queryInterface.addIndex('product_translations', ['name'], {
      name: 'idx_products_name'
    });
  },
  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('product_translations', 'idx_products_name');
    } catch (err) {
      console.warn('⚠️ Index idx_products_name was not found. Skipping.');
    }

    try {
      await queryInterface.removeConstraint('product_translations', 'unique_product_language');
    } catch (err) {
      console.warn('⚠️ Constraint unique_product_language was not found. Skipping.');
    }
    await queryInterface.dropTable('product_translations');
  }
};