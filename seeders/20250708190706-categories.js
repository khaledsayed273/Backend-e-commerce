'use strict';
const slugify = require('slugify');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const categoryNames = [
      'Electronics',
      'Fashion',
      'Home & Kitchen',
      'Books',
      'Health & Beauty',
      'Sports & Outdoors',
      'Toys & Games',
      'Automotive',
      'Grocery',
      'Office Supplies'
    ];

    const categories = categoryNames.map(name => ({
      name,
      slug: slugify(name, { lower: true }),
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('categories', categories);

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.bulkDelete('categories', null, {});
  }
};
