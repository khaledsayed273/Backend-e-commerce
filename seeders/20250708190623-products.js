'use strict';
const slugify = require('slugify');
const downloadImage = require('../utils/downloadImage');
const convertToBase64 = require('../utils/convertToBase64');

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
    const imagePaths = [];

    for (let i = 1; i <= 100; i++) {
      const name = `Product ${i}`;
      const slug = slugify(name, { lower: true });
      const brandSlug = brandSlugs[Math.floor(Math.random() * brandSlugs.length)];
      const categorySlug = categorySlugs[Math.floor(Math.random() * categorySlugs.length)];
      const subCategoryList = categorySubMap[categorySlug];
      const subCategorySlug = subCategoryList[Math.floor(Math.random() * subCategoryList.length)];

      const remoteImageUrl = `https://picsum.photos/seed/product-${i}/600/600`;
      const fileName = `product-${i}.jpg`;
      const savedImagePath = await downloadImage(remoteImageUrl, fileName, 'uploads/products');
      const base64 = await convertToBase64(savedImagePath);

      imagePaths.push({ savedImagePath, base64 });

      products.push({
        slug,
        name,
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
      });
    }

    // أولاً: أدخل المنتجات
    const insertProducts = products.map(({ name, ...rest }) => rest);
    await queryInterface.bulkInsert('products', insertProducts);

    const slugs = products.map(p => p.slug);

    // ثانياً: جلب آخر 100 منتجات حسب الترتيب
    const insertedProducts = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products WHERE slug IN (:slugs)`,
      {
        replacements: { slugs },
        type: Sequelize.QueryTypes.SELECT
      }
    );


    const existingOptionTypes = await queryInterface.sequelize.query(
      `SELECT name FROM option_types`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingNames = new Set(existingOptionTypes.map(opt => opt.name));

    const newOptionTypes = [
      { name: 'size', createdAt: now, updatedAt: now },
      { name: 'color', createdAt: now, updatedAt: now },
      { name: 'material', createdAt: now, updatedAt: now },
      { name: 'length', createdAt: now, updatedAt: now },
    ].filter(opt => !existingNames.has(opt.name));

    if (newOptionTypes.length > 0) {
      await queryInterface.bulkInsert('option_types', newOptionTypes);
    }


    // جلب الأنواع من جدول option_types
    const optionTypes = await queryInterface.sequelize.query(
      `SELECT id, name FROM option_types`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const productOptions = [];
    const optionValues = [];

    const defaultValuesMap = {
      size: ['s', 'm', 'l', 'xl'],
      color: ['red', 'blue', 'green', "yellow", "black", "white", "gray"],
      material: ['cotton', 'wool', 'polyester'],
    };

    for (const product of insertedProducts) {
      for (const optionType of optionTypes) {
        const productOption = {
          productId: product.id,
          optionTypeId: optionType.id,
          createdAt: now,
          updatedAt: now
        };
        productOptions.push(productOption);
      }
    }


    await queryInterface.bulkInsert('product_options', productOptions);

    // جلبهم بعد الإدخال للحصول على IDs
    const insertedProductOptions = await queryInterface.sequelize.query(
      `SELECT id, productId, optionTypeId FROM product_options ORDER BY id DESC LIMIT ${productOptions.length}`,
      { type: Sequelize.QueryTypes.SELECT }
    );


    // إنشاء القيم
    for (const option of insertedProductOptions) {
      const type = optionTypes.find(t => t.id === option.optionTypeId);
      const values = defaultValuesMap[type.name] || ['Default'];

      for (const value of values) {
        optionValues.push({
          productOptionId: option.id,
          value,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // إدخال القيم
    await queryInterface.bulkInsert('product_option_values', optionValues);

    const translations = [];
    const images = [];

    for (let i = 0; i < insertedProducts.length; i++) {
      const { id, slug } = insertedProducts[i];
      const original = products.find(p => p.slug === slug);
      const name = original.name;
      const productNumber = name.split(" ")[1];

      translations.push(
        {
          productId: id,
          language: 'en',
          name,
          description: `This is the full description of ${name}.`,
          short_description: `Short description for ${name}.`,
          createdAt: now,
          updatedAt: now,
        },
        {
          productId: id,
          language: 'ar',
          name: `منتج ${productNumber}`,
          description: `الوصف الكامل لـ منتج ${productNumber} بجودة عالية.`,
          short_description: `وصف مختصر لـ منتج ${productNumber}.`,
          createdAt: now,
          updatedAt: now,
        }
      );

      const firstImage = imagePaths[i]; // لأنه في ترتيب متوافق
      images.push({
        productId: id,
        imageUrl: firstImage.savedImagePath,
        placeholder: firstImage.base64,
        isPrimary: true, // أول صورة رئيسية
        createdAt: now,
        updatedAt: now,
      });

      // أضف 3 صور إضافية
      for (let imgIndex = 1; imgIndex <= 2; imgIndex++) {
        const remoteImageUrl = `https://picsum.photos/seed/product-${i + 1}-${imgIndex}/600/600`;
        const fileName = `product-${i + 1}-${imgIndex}.jpg`;
        const savedImagePath = await downloadImage(remoteImageUrl, fileName, 'uploads/products');
        const base64 = await convertToBase64(savedImagePath);

        images.push({
          productId: id,
          imageUrl: savedImagePath,
          placeholder: base64,
          isPrimary: false, // الصورة مش أساسية
          createdAt: now,
          updatedAt: now,
        });
      }

    }

    await queryInterface.bulkInsert('product_translations', translations);
    await queryInterface.bulkInsert('product_images', images);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('product_translations', null, {});
    await queryInterface.bulkDelete('product_option_values', null, {});
    await queryInterface.bulkDelete('product_options', null, {});
    await queryInterface.bulkDelete('option_types', {
      name: ['size', 'color', 'material', 'length']
    }, {});

    await queryInterface.bulkDelete('products', {
      slug: {
        [Sequelize.Op.like]: 'product-%'
      }
    }, {});

  }
};
