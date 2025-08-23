const { Op } = require("sequelize");
const { deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

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
                    attributes: ["id", "name", "slug", "image", "placeholder"],
                    include: [
                        {
                            model: models.subsubcategory,
                            as: "sub_sub_category",
                            attributes: ["id", "name", "slug", "image", "placeholder"]
                        },
                    ]
                },

            ]
        });

        const editData = rows.map(category => {
            const categoryJson = category.toJSON();
            categoryJson.subcategories = categoryJson?.subcategories?.map(subcategory => {

                subcategory.image = `${process.env.baseUrl}/${subcategory.image.replace(/\\/g, '/')}`;

                subcategory.sub_sub_category = subcategory?.sub_sub_category?.map(subsubcategory => {
                    if (subsubcategory.image) {
                        subsubcategory.image = `${process.env.baseUrl}/${subsubcategory.image.replace(/\\/g, '/')}`;
                    }
                    return subsubcategory;
                });
                return subcategory;
            });
            return categoryJson;
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: editData,
        })

    } catch (e) {
        console.log(e);

        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const addNew = async (req, res) => {
    const { name } = req.body

    if (!name || name === "") {
        return res.status(400).json({
            status: false,
            message: "category is required"
        })
    }

    try {
        const slug = slugify(name)
        await models.category.create({ name, slug });
        res.status(200).json({
            status: true,
            message: "category created successfully"
        })
    } catch (e) {
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
    const { categoryId } = req.params
    const { name } = req.body

    if (!name) {
        res.status(404).json({
            status: false,
            message: "name is required",
        })
    }

    try {

        const oldCategory = await models.category.findByPk(categoryId);

        if (!oldCategory) {
            res.status(404).json({
                status: false,
                message: "category is not found",
            })
        }

        const slug = slugify(name)

        const newData = {
            name,
            slug,
        }

        await models.category.update(
            newData,
            {
                where: {
                    id: categoryId,
                },
            }
        );

        res.status(200).json({
            status: true,
            message: "category updated successfully",
        })
    } catch (e) {

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

const deleteCategory = async (req, res) => {
    const { categoryId } = req.params

    try {
        const category = await models.category.findByPk(categoryId)
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

module.exports = { all, addNew, update, deleteCategory }