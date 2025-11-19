'use strict';
const slugify = require('slugify');
const downloadImage = require('../utils/downloadImage');
const convertToBase64 = require('../utils/convertToBase64');

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

    const categories = [];

    for (const name of categoryNames) {
      const slug = slugify(name, { lower: true });

      const fileName = `${slug}.jpg`;
      const imageUrl = `https://picsum.photos/seed/${slug}/600/600`;

      const savedImagePath = await downloadImage(
        imageUrl,
        fileName,
        'uploads/categories'
      );
      const base64 = await convertToBase64(savedImagePath);

      categories.push({
        name,
        slug,
        image: savedImagePath.replace(/^.*?uploads[\\/]/, 'uploads/').replace(/\\/g, '/'),
        placeholder: base64,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('categories', categories);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
