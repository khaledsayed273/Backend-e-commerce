const { Op, fn, col } = require("sequelize");
const { deleteFile, deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

const all = async (req, res) => {
    const { categorySlug } = req.params
    const { name, limit = 10, page = 1 } = req.query;

    try {
        // Offset calculation
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Where conditions
        const whereConditions = {
            categorySlug,
            // name of subcategory
            ...(name && { name: { [Op.like]: `${name}%` } }),
        };

        // Find all subcategories
        const { count, rows } = await models.subcategory.findAndCountAll({
            distinct: true,
            limit: parseInt(limit),
            offset,
            where: whereConditions,
            include: [
                {
                    model: models.product,
                    as: "products",
                    attributes: [],
                },
                {
                    model: models.subsubcategory,
                    as: "sub_sub_category",
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [
                        fn("COUNT", col("products.id")),
                        "productsCount"
                    ],
                    [
                        fn("COUNT", col("sub_sub_category.id")),
                        "subsubcategoriesCount"
                    ]
                ]
            },
            group: ["subcategory.id"],
            subQuery: false,

        });

        // Calculate total count
        const totalCount = Array.isArray(count) ? count.length : count;

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.status(200).json({
            total: totalCount,
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
    const { categorySlug } = req.params;

    if (req.image) {
        imageUrl = req.image
    }

    if (!name || name === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "subcategory is required"
        })
    }

    try {
        // Check if category exists
        const category = await models.category.findOne({ where: { slug: categorySlug.trim().toLowerCase() } })
        if (!category) {
            if (imageUrl) {
                deleteFile(imageUrl)
            }
            return res.status(404).json({
                status: false,
                message: "category is not found"
            })
        }

        const slug = slugify(name)
        // Create subcategory
        await models.subcategory.create({ name, slug, image: imageUrl, placeholder: req?.imageBase64, categorySlug: category.slug });

        res.status(200).json({
            status: true,
            message: "subcategory created successfully",
        })
    } catch (e) {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const update = async (req, res) => {
    const { subCategorySlug } = req.params
    const { name } = req.body

    if (!name) {
        if (req.image) {
            deleteFile(req.image)
        }
        return res.status(404).json({
            status: false,
            message: "name is required"
        })
    }

    try {
        // Check if subcategory exists
        const oldSubCategory = await models.subcategory.findOne({ where: { slug: subCategorySlug } });

        if (!oldSubCategory) {
            if (req.image) {
                deleteFile(req.image)
            }
            res.status(404).json({
                status: false,
                message: "sub_category is not found",
            })
        }

        // prepare new data
        const newData = {};
        if (name && name !== oldSubCategory.name) {
            newData.name = name;
            newData.slug = slugify(name);
        }

        if (req.image) {
            newData.image = req.image;
        }
        if (req.imageBase64) {
            newData.placeholder = req.imageBase64;
        }

        // Update subcategory
        const [updatedRows] = await models.subcategory.update(newData, {
            where: { id: oldSubCategory.id },
        });

        // Delete old image
        if (updatedRows > 0 && req.image) {
            deleteFile(oldSubCategory.image);
        }

        res.status(200).json({
            status: true,
            message: "Sub Category updated successfully",
        })
    } catch (e) {
        if (req.image) {
            deleteFile(req.image)
        }
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const destroy = async (req, res) => {
    const { subCategorySlug } = req.params

    if (!subCategorySlug || subCategorySlug === "") {
        return res.status(400).json({
            status: false,
            message: "subCategorySlug is required"
        })
    }

    try {
        // Check if subcategory exists
        const subCategory = await models.subcategory.findOne({ where: { slug: subCategorySlug } })

        if (!subCategory) {
            return res.status(404).json({
                status: false,
                message: "subCategory is not found"
            })
        }

        // Delete subcategory image
        if (subCategory.image) {
            deleteFile(subCategory.image)
        }

        // Find all sub sub categories
        const subSubCategory = await models.subsubcategory.findAll({
            where: {
                subCategorySlug: subCategory.slug
            },
            attributes: ["image"]
        });

        // Delete all sub sub category images
        if (subSubCategory.length > 0) {
            const allImagesofSubSubCategories = subSubCategory
                .map(item => item.image)
                .filter(Boolean);
            deleteFiles(allImagesofSubSubCategories);
        }

        // Find all products
        const products = await models.product.findAll({
            where: { subCategorySlug: subCategory.slug },
            include: [{
                model: models.product_image,
                as: "images",
                attributes: ["imageUrl"]
            },
            ],
            attributes: ["id"]
        })

        // Delete all product images
        if (products.length > 0) {
            const allImagesOfProducts = products.flatMap(product =>
                (product.images || [])
                    .map(img => img.imageUrl)
                    .filter(Boolean)
            );
            if (allImagesOfProducts.length > 0) {
                deleteFiles(allImagesOfProducts);
            }
        }

        await subCategory.destroy()
        res.status(200).json({
            status: true,
            message: "Sub Category deleted successfully",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, create, update, destroy }