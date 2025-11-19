'use strict';
const downloadImage = require('../utils/downloadImage');
const slugify = require('slugify');
const convertToBase64 = require('../utils/convertToBase64');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const brandNames = [
      'Apple',
      'Samsung',
      'Huawei',
      'Sony',
      'Dell',
      'HP',
      'Asus',
      'Lenovo',
      'Xiaomi',
      'Microsoft',
      'Google',
      'LG',
      'Nokia',
      'OnePlus'
    ];

    const brands = [];

    for (const name of brandNames) {
      const slug = slugify(name, { lower: true });

      const imageUrl = `https://logo.clearbit.com/${slug}.com`; 
      const fileName = `${slug}.png`;

      const savedImagePath = await downloadImage(
        imageUrl,
        fileName,
        'uploads/brands'
      );

      const base64 = await convertToBase64(savedImagePath);

      brands.push({
        name,
        slug,
        image: savedImagePath,
        placeholder: base64,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('brands', brands);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('brands', null, {});
  }
};
