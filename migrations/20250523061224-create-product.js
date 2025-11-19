'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sold: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      variants: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      metaTitle: {
        type: Sequelize.STRING,
      },
      metaDescription: {
        type: Sequelize.TEXT,
      },
      metaKeywords: {
        type: Sequelize.STRING,
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      categorySlug: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'slug',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subCategorySlug: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'subcategories',
          key: 'slug',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subSubCategorySlug: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'subsubcategories',
          key: 'slug',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      brandSlug: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'brands',
          key: 'slug',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      averageRating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      reviewsCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex('products', ['slug'], {
      name: 'idx_products_slug',
      unique: true,
    });
    await queryInterface.addIndex('products', ['price'], {
      name: 'idx_products_price',
    });
    await queryInterface.addIndex('products', ['isAvailable'], {
      name: 'idx_products_isAvailable',
    });
    await queryInterface.addIndex('products', ['createdAt'], {
      name: 'idx_products_createdAt',
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('products', 'idx_products_slug');
    await queryInterface.removeIndex('products', 'idx_products_price');
    await queryInterface.removeIndex('products', 'idx_products_isAvailable');
    await queryInterface.removeIndex('products', 'idx_products_createdAt');
    await queryInterface.dropTable('products');
  }
};