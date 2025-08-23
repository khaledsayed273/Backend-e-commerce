const { Op } = require("sequelize");
const { deleteFile, deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify')

const all = async (req, res) => {

    const { name, limit = 10, page = 1 } = req.query;

    try {

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await models.brand.findAndCountAll({
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
                    WHERE p.brandSlug = brand.slug
                  )`),
                        'productsCount'
                    ]
                ]
            },
        });

        const dataWithImageUrl = rows.map(brand => {
            const brandJson = brand.toJSON();
            // for Image
            if (brandJson.image) {
                brandJson.image = `${process.env.baseUrl}/${brandJson.image.replace(/\\/g, '/')}`;
            }
            return brandJson
        });

        res.status(200).json({
            status: true,
            total: count,
            data: dataWithImageUrl
        })
    } catch (e) {
        res.status(500).json({
            status: false,
            message: "server error",
            error: e
        })
    }
}

const addNew = async (req, res) => {
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
            message: "name is required"
        })
    }

    try {
        const slug = slugify(name)
        await models.brand.create({ name, slug, image: imageUrl, placeholder: req?.imageBase64 });
        res.status(200).json({
            status: true,
            message: "brand created successfully",
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
    const { brandId } = req.params
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
        const slug = slugify(name)

        const oldBrand = await models.brand.findByPk(brandId);

        const newData = {
            name,
            slug,
            ...(req.image ? { image: req.image } : {}),
            ...(req.imageBase64 ? { placeholder: req.imageBase64 } : {}),
        }


        const [updatedRows] = await models.brand.update(
            newData,
            {
                where: {
                    id: brandId,
                },
            }
        );


        if (updatedRows > 0 && req.image) {
            deleteFile(oldBrand.image);
        }


        res.status(200).json({
            status: true,
            message: "brand updated successfully",
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

const deleteBrand = async (req, res) => {
    const { brandId } = req.params

    try {
        const brand = await models.brand.findByPk(brandId)
        if (!brand) {
            return res.status(404).json({
                status: false,
                message: "brand is not defiend",
            })
        }

        const products = await models.product.findAll({
            where: { brandSlug: brand.slug },
            include: {
                model: models.product_image,
                as: "images",
                attributes: ["imageUrl"]
            },
            attributes: ["id"]
        })
        if (products) {
            const allImages = products.flatMap(product => product.images.map(img => img.imageUrl));
            deleteFiles(allImages)
        }

        deleteFile(brand.image)

        await models.brand.destroy(
            {
                where: {
                    id: brandId,
                },
            }
        );
        res.status(200).json({
            status: true,
            message: "brand deleted successfully",
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, addNew, update, deleteBrand }