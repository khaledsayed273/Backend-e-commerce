'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('percentage', 'amount'),
        allowNull: false
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      maxDiscount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      minOrderValue: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      startsAt: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable('coupons');
  }
};