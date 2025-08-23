'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      logo: {
        type: Sequelize.STRING
      },
      placeholder: {
        type: Sequelize.TEXT('long')
      },
      address: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      facebook: {
        type: Sequelize.STRING
      },
      instagram: {
        type: Sequelize.STRING
      },
      twitter: {
        type: Sequelize.STRING
      },
      youtube: {
        type: Sequelize.STRING
      },
      linkedin: {
        type: Sequelize.STRING
      },
      copyright: {
        type: Sequelize.STRING
      },
      metaTitle: {
        type: Sequelize.STRING
      },
      metaDescription: {
        type: Sequelize.TEXT
      },
      metaKeywords: {
        type: Sequelize.STRING
      },
      fontFamily: {
        type: Sequelize.STRING
      },
      mainColor: {
        type: Sequelize.STRING
      },
      secondaryColor: {
        type: Sequelize.STRING
      },
      categoryColor: {
        type: Sequelize.STRING
      },
      subCategoryColor: {
        type: Sequelize.STRING
      },
      subSubCategoryColor: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('settings');
  }
};