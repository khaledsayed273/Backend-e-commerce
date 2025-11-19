const { Op, fn, col } = require("sequelize");
const { deleteFile, deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

const all = async (req, res) => {

    const { subCategorySlug } = req.params;

    const { name, limit = 10, page = 1 } = req.query;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Find all subsubcategories
        const { count, rows } = await models.subsubcategory.findAndCountAll({
            distinct: true,
            limit: parseInt(limit),
            offset,
            where: {
                subCategorySlug,
                ...(name && { name: { [Op.like]: `${name}%` } })
            },
            include: [
                {
                    model: models.product,
                    as: "products",
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [
                        fn("COUNT", col("products.id")),
                        "productsCount"
                    ]
                ]
            },
            group: ["subsubcategory.id"],
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
        console.log(e);

        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const create = async (req, res) => {
    let imageUrl;
    const { name } = req.body
    const { subCategorySlug } = req.params;

    if (req.image) {
        imageUrl = req.image
    }

    if (!name || name === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "name is required"
        })
    }

    if (!subCategorySlug || subCategorySlug === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "subCategorySlug is required"
        })
    }

    try {
        const sub_category = await models.subcategory.findOne({ where: { slug: subCategorySlug.trim().toLowerCase() } })
        if (!sub_category) {
            if (imageUrl) {
                deleteFile(imageUrl)
            }
            return res.status(404).json({
                status: false,
                message: "sub_category is not found"
            })
        }

        const slug = slugify(name)

        await models.subsubcategory.create({ name, slug, image: imageUrl, placeholder: req?.imageBase64, subCategorySlug: sub_category.slug });

        res.status(200).json({
            status: true,
            message: "sub_sub_category created successfully",
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
    const { subSubCategorySlug } = req.params
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
        const oldSubSubCategory = await models.subsubcategory.findOne({ where: { slug: subSubCategorySlug.trim().toLowerCase() } });

        if (!oldSubSubCategory) {
            if (req.image) {
                deleteFile(req.image)
            }
            res.status(404).json({
                status: false,
                message: "sub_sub_category is not found",
            })
        }

        // prepare new data
        const newData = {};
        if (name && name !== oldSubSubCategory.name) {
            newData.name = name;
            newData.slug = slugify(name);
        }

        if (req.image) {
            newData.image = req.image;
        }
        if (req.imageBase64) {
            newData.placeholder = req.imageBase64;
        }

        // update sub_sub_category
        const [updatedRows] = await models.subsubcategory.update(newData, {
            where: { id: oldSubSubCategory.id, }
        });

        if (updatedRows > 0 && req.image) {
            deleteFile(oldSubSubCategory.image);
        }

        res.status(200).json({
            status: true,
            message: "Sub Sub Category updated successfully",
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
    const { subSubCategorySlug } = req.params

    if (!subSubCategorySlug || subSubCategorySlug === "") {
        return res.status(400).json({
            status: false,
            message: "subSubCategorySlug is required"
        })
    }

    try {
        const subSubCategory = await models.subsubcategory.findOne({ where: { slug: subSubCategorySlug.trim().toLowerCase() } });

        if (!subSubCategory) {
            return res.status(404).json({
                status: false,
                message: "sub sub category is not found"
            })
        }
        const products = await models.product.findAll({
            where: { subSubCategorySlug: subSubCategory.slug },
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

        deleteFile(subSubCategory.image)

        await subSubCategory.destroy()

        res.status(200).json({
            status: true,
            message: "Sub Sub Category deleted successfully",
        })
    } catch (e) {
        console.log(e);

        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, create, update, destroy }