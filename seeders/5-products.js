'use strict';
const slugify = require('slugify');
const downloadImage = require('../utils/downloadImage');
const convertToBase64 = require('../utils/convertToBase64');
const bcrypt = require('bcrypt');

function generateSKU() {
  const prefix = "SKU";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const brandSlugs = ['apple', 'samsung', 'huawei'];
    const categorySubMap = {
      electronics: ['phones', 'laptops', 'watches'],
      fashion: ['men-clothing', 'women-clothing', 'shoes'],
      books: ['fiction', 'non-fiction', 'comics'],
      'home-and-kitchen': ['furniture', 'appliances', 'decor'],
    };

    const categorySlugs = Object.keys(categorySubMap);

    const products = [];

    for (let i = 1; i <= 100; i++) {
      const name = `Product ${i}`;
      const slug = slugify(name, { lower: true });

      const brandSlug = brandSlugs[Math.floor(Math.random() * brandSlugs.length)];
      const categorySlug = categorySlugs[Math.floor(Math.random() * categorySlugs.length)];
      const subCategoryList = categorySubMap[categorySlug];
      const subCategorySlug = subCategoryList[Math.floor(Math.random() * subCategoryList.length)];

      products.push({
        slug,
        sku: generateSKU(),
        price: (Math.random() * 900 + 100).toFixed(2),
        discount: (Math.random() * 90).toFixed(2),
        quantity: Math.floor(Math.random() * 1000) + 1,
        isAvailable: true,
        metaTitle: name,
        metaDescription: `Meta for ${name}`,
        metaKeywords: 'tech,product',
        categorySlug,
        subCategorySlug,
        subSubCategorySlug: null,
        brandSlug,
        averageRating: 0,
        reviewsCount: 0,
        createdAt: now,
        updatedAt: now,
        variants: JSON.stringify([
          { size: "sm", color: "red", price: 200, quantity: 5 },
          { size: "md", color: "red", price: 200, quantity: 3 },
          { size: "lg", color: "red", price: 200, quantity: 2 },
          { size: "lg", color: "green", price: 230, quantity: 6 }
        ])
      });
    }

    await queryInterface.bulkInsert('products', products);

    // Get inserted products
    const slugs = products.map(p => p.slug);
    const insertedProducts = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products WHERE slug IN (:slugs)`,
      {
        replacements: { slugs },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const translations = [];
    const images = [];

    for (const product of insertedProducts) {
      const id = product.id;

      const nameEn = `Product ${id}`;
      const nameAr = `منتج ${id}`;

      translations.push(
        {
          productId: id,
          language: 'en',
          name: nameEn,
          description: `This is the full description of ${nameEn}.`,
          short_description: `Short description for ${nameEn}.`,
          createdAt: now,
          updatedAt: now,
        },
        {
          productId: id,
          language: 'ar',
          name: nameAr,
          description: `الوصف الكامل لـ ${nameAr} بجودة عالية.`,
          short_description: `وصف مختصر لـ ${nameAr}.`,
          createdAt: now,
          updatedAt: now,
        }
      );

      // ========= MAIN IMAGE =========
      const mainUrl = `https://picsum.photos/seed/product-${id}/600/600`;
      const mainFile = `product-${id}.webp`;

      const mainSaved = await downloadImage(mainUrl, mainFile, 'uploads/products');
      const mainBase64 = await convertToBase64(mainSaved);

      images.push({
        productId: id,
        imageUrl: mainSaved,
        placeholder: mainBase64,
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });

      // ========= EXTRA IMAGES =========
      for (let imgIndex = 1; imgIndex <= 2; imgIndex++) {
        const extraUrl = `https://picsum.photos/seed/product-${id}-${imgIndex}/600/600`;
        const extraFile = `product-${id}-${imgIndex}.webp`;

        const extraSaved = await downloadImage(extraUrl, extraFile, 'uploads/products');
        const extraBase64 = await convertToBase64(extraSaved);

        images.push({
          productId: id,
          imageUrl: extraSaved,
          placeholder: extraBase64,
          isPrimary: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await queryInterface.bulkInsert('product_translations', translations);
    await queryInterface.bulkInsert('product_images', images);

    // Admin User
    const hashedPassword = await bcrypt.hash('123456', 10);
    await queryInterface.bulkInsert('users', [
      {
        firstname: 'khaled',
        lastname: 'sayed',
        username: 'admin',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('product_translations', null, {});
    await queryInterface.bulkDelete('products', null, {});
  }
};
