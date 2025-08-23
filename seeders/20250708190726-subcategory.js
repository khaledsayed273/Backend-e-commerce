'use strict';
const slugify = require('slugify');
const downloadImage = require('../utils/downloadImage');
const convertToBase64 = require('../utils/convertToBase64');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const categorySubMap = {
      [slugify('Electronics', { lower: true })]: ['Phones', 'Laptops', 'Watches'],
      [slugify('Fashion', { lower: true })]: ['Men Clothing', 'Women Clothing', 'Shoes'],
      [slugify('Books', { lower: true })]: ['Fiction', 'Non-Fiction', 'Comics'],
      [slugify('Home & Kitchen', { lower: true })]: ['Furniture', 'Appliances', 'Decor'],
    };

    const subcategories = [];

    for (const [categorySlug, subNames] of Object.entries(categorySubMap)) {
      for (const name of subNames) {
        const slug = slugify(name, { lower: true });
        const imageUrl = `https://picsum.photos/seed/${slug}/600/600`;
        const fileName = `${slug}.jpg`;

        const savedImagePath = await downloadImage(imageUrl, fileName, 'uploads/sub_category');
        const base64 = await convertToBase64(savedImagePath);

        subcategories.push({
          name,
          slug,
          image: savedImagePath.replace(/^.*?uploads[\\/]/, 'uploads/').replace(/\\/g, '/'),
          placeholder: base64,
          categorySlug,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await queryInterface.bulkInsert('subcategories', subcategories);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subcategories', null, {});
  }
};
