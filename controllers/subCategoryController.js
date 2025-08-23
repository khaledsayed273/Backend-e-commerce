const { Op } = require("sequelize");
const { deleteFile, deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

const all = async (req, res) => {

    const { category } = req.params

    const { name, limit = 10, page = 1 } = req.query;

    try {

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await models.subcategory.findAndCountAll({
            distinct: true,
            limit: parseInt(limit),
            offset,
            where: {
                categorySlug: category,
                ...(name && { name: { [Op.like]: `${name}%` } })
            },
            attributes: {
                include: [
                    [
                        models.sequelize.literal(`(
        SELECT COUNT(*)
        FROM products AS p
        WHERE p.subCategorySlug = subcategory.slug
      )`),
                        'productsCount'
                    ],
                    [
                        models.sequelize.literal(`(
        SELECT COUNT(*)
        FROM subsubcategories  AS ssc
        WHERE ssc.subCategorySlug = subcategory.slug
      )`),
                        'subSubCategoriesCount'
                    ]

                ]
            },
        });

        const dataWithImageUrl = rows.map(subCategory => {
            const subCategoryJson = subCategory.toJSON();
            // for Image
            if (subCategoryJson.image) {
                subCategoryJson.image = `${process.env.baseUrl}/${subCategoryJson.image.replace(/\\/g, '/')}`;
            }
            return subCategoryJson
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.status(200).json({
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: dataWithImageUrl,
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const addNew = async (req, res) => {
    let imageUrl;
    const { name } = req.body
    const { category: categorySlug } = req.params;

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
    const { subCategoryId } = req.params
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
        const oldSubCategory = await models.subcategory.findByPk(subCategoryId);

        if (!oldSubCategory) {
            if (req.image) {
                deleteFile(req.image)
            }
            res.status(404).json({
                status: false,
                message: "sub_category is not found",
            })
        }

        const slug = slugify(name)

        const newData = {
            name,
            slug,
            ...(req.image ? { image: req.image } : {}),
            ...(req.imageBase64 ? { placeholder: req.imageBase64 } : {}),
        }

        const [updatedRows] = await models.subcategory.update(newData, {
            where: { id: oldSubCategory.id },
        });

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

const deleteSubCategory = async (req, res) => {
    const { subCategoryId } = req.params

    if (!subCategoryId || subCategoryId === "") {
        return res.status(400).json({
            status: false,
            message: "subCategoryId is required"
        })
    }

    try {
        const subCategory = await models.subcategory.findByPk(subCategoryId)

        if (!subCategory) {
            return res.status(404).json({
                status: false,
                message: "subCategory is not found"
            })
        }

        if (subCategory.image) {
            deleteFile(subCategory.image)
        }


        const subSubCategory = await models.subsubcategory.findAll({
            where: {
                subCategorySlug: subCategory.slug
            }
        });

        if (subSubCategory) {
            const allImagesofSubSubCategories = subSubCategory.flatMap((item) => item.image)
            deleteFiles(allImagesofSubSubCategories)
        }

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
        if (products) {
            const allImages = products.flatMap(product => product.images.map(img => img.imageUrl));
            deleteFiles(allImages)
        }

        await subCategory.destroy()

        res.status(200).json({
            status: true,
            message: "Sub Category deleted successfully",
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

module.exports = { all, addNew, update, deleteSubCategory }