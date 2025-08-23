const { Op } = require("sequelize");
const { deleteFile, deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

const all = async (req, res) => {

    const { sub_category: sub_categorySlug } = req.params;

    const { name, limit = 10, page = 1 } = req.query;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await models.subsubcategory.findAndCountAll({
            distinct: true,
            limit: parseInt(limit),
            offset,
            where: {
                subCategorySlug: sub_categorySlug,
                ...(name && { name: { [Op.like]: `${name}%` } })
            },
            attributes: {
                include: [
                    [
                        models.sequelize.literal(`(
    SELECT COUNT(*)
    FROM products AS p
    WHERE p.subSubCategorySlug = subsubcategory.slug
  )`),
                        'productsCount'
                    ]
                ]
            },
        });

        const dataWithImageUrl = rows.map(subSubCategory => {
            const subSubCategoryJson = subSubCategory.toJSON();
            // for Image
            if (subSubCategoryJson.image) {
                subSubCategoryJson.image = `${process.env.baseUrl}/${subSubCategoryJson.image.replace(/\\/g, '/')}`;
            }
            return subSubCategoryJson
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
    const { sub_category: sub_categorySlug } = req.params;

    if (req.image) {
        imageUrl = req.image
    }

    if (!name || name === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "sub_category is required"
        })
    }

    try {
        const sub_category = await models.subcategory.findOne({ where: { slug: sub_categorySlug.trim().toLowerCase() } })
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
    const { subSubCategoryId } = req.params
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
        const oldSubSubCategory = await models.subsubcategory.findByPk(subSubCategoryId);

        if (!oldSubSubCategory) {
            if (req.image) {
                deleteFile(req.image)
            }
            res.status(404).json({
                status: false,
                message: "sub_sub_category is not found",
            })
        }

        const slug = slugify(name)

        const newData = {
            name,
            slug,
            ...(req.image ? { image: req.image } : {}),
            ...(req.imageBase64 ? { placeholder: req.imageBase64 } : {}),
        }

        const [updatedRows] = await models.subsubcategory.update(
            newData,
            {
                where: {
                    id: oldSubSubCategory.id,
                },
            }
        );

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

const deleteSubSubCategory = async (req, res) => {
    const { subSubCategoryId } = req.params

    if (!subSubCategoryId || subSubCategoryId === "") {
        return res.status(400).json({
            status: false,
            message: "subSubCategoryId is required"
        })
    }



    try {
        const subSubCategory = await models.subsubcategory.findByPk(subSubCategoryId);

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
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, addNew, update, deleteSubSubCategory }