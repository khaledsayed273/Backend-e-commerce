const { Op } = require("sequelize");
const { deleteFiles, deleteFile } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify');

const all = async (req, res) => {
    const { name, limit = 10, page = 1 } = req.query;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await models.category.findAndCountAll({
            distinct: true,
            limit: parseInt(limit),
            offset,
            where: {
                ...(name && { name: { [Op.like]: `${name}%` } })
            },
            attributes: {
                include: [
                    [
                        models.sequelize.literal(`(
        SELECT COUNT(*)
        FROM products AS p
        WHERE p.categorySlug = category.slug
      )`),
                        'productsCount'
                    ]
                ]
            },
            include: [
                {
                    model: models.subcategory,
                    as: "subcategories",
                    attributes: {
                        include: [
                            [
                                models.sequelize.literal(`(
                                            SELECT COUNT(*)
                                            FROM products AS p
                                            WHERE p.subCategorySlug = subcategories.slug
                                          )`),
                                'productsCount'
                            ]
                        ],
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: [
                        {
                            model: models.subsubcategory,
                            as: "sub_sub_category",
                            attributes: {
                                include: [
                                    [
                                        models.sequelize.literal(`(
                                                    SELECT COUNT(*)
                                                    FROM products AS p
                                                    WHERE p.subSubCategorySlug = \`subcategories->sub_sub_category\`.slug
                                                )`),
                                        'productsCount'
                                    ]
                                ]
                            }

                        },
                    ]
                },

            ]
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: rows,
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const create = async (req, res) => {
    let imageUrl;

    const { name } = req.body

    if (req.image) {
        imageUrl = req.image
    }

    if (!name || name === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "category is required"
        })
    }

    try {
        const slug = slugify(name)
        await models.category.create({ name, slug, image: imageUrl, placeholder: req?.imageBase64 });
        res.status(200).json({
            status: true,
            message: "category created successfully"
        })
    } catch (e) {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        if (e.name === "SequelizeUniqueConstraintError") {
            return res.status(500).json({
                message: "category must be uniqe",
                error: e
            })
        }
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const update = async (req, res) => {
    const { id } = req.params
    const { name } = req.body

    if (!name) {

        if (req.image) {
            deleteFile(req.image)
        }
        res.status(404).json({
            status: false,
            message: "name is required",
        })
    }

    try {
        // Check if category exists
        const oldCategory = await models.category.findByPk(id);
        if (!oldCategory) {
            if (req.image) {
                deleteFile(req.image)
            }
            res.status(404).json({
                status: false,
                message: "category is not found",
            })
        }

        // prepare new data
        const newData = {};
        if (name && name !== oldCategory.name) {
            newData.name = name;
            newData.slug = slugify(name);
        }

        if (req.image) {
            newData.image = req.image;
        }
        if (req.imageBase64) {
            newData.placeholder = req.imageBase64;
        }

        // update category
        const [updatedRows] = await models.category.update(
            newData,
            { where: { id } }
        );

        //
        if (updatedRows > 0 && req.image) {
            deleteFile(oldCategory.image);
        }

        res.status(200).json({
            status: true,
            message: "category updated successfully",
        })
    } catch (e) {

        if (req.image) {
            deleteFile(req.image)
        }

        if (e.name === "SequelizeUniqueConstraintError") {
            return res.status(500).json({
                message: "category name must to be uniqe",
                error: e
            })
        }

        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const destroy = async (req, res) => {
    const { id } = req.params

    try {
        const category = await models.category.findByPk(id)
        if (!category) {
            return res.status(404).json({
                status: false,
                message: "category is not defiend",
            })
        }

        const subCategories = await models.subcategory.findAll({
            where: {
                categorySlug: category.slug
            }
        });

        if (subCategories) {
            const allImagesofSubCategories = subCategories.flatMap((item) => item.image)
            deleteFiles(allImagesofSubCategories)
            const subCategorySlugs = subCategories.map(sub => sub.slug);

            const subSubCategory = await models.subsubcategory.findAll({
                where: {
                    subCategorySlug: subCategorySlugs
                }
            });

            if (subSubCategory) {
                const allImagesofSubSubCategories = subSubCategory.flatMap((item) => item.image)
                deleteFiles(allImagesofSubSubCategories)
            }
        }

        if (category.image) {
            deleteFile(category.image)
        }


        const products = await models.product.findAll({
            where: { categorySlug: category.slug },
            include: [{
                model: models.product_image,
                as: "images",
                attributes: ["imageUrl"]
            },
            ],
            attributes: ["id"]
        })
        if (products) {
            const allImages = products.flatMap(product => product.images.map(img => img.imageUrl));
            deleteFiles(allImages)
        }

        await category.destroy()

        res.status(200).json({
            status: true,
            message: "category deleted successfully",
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, create, update, destroy }