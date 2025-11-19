const { Op } = require("sequelize");
const { deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify');
const tr = require("googletrans").default;
const cheerio = require("cheerio");
const sanitizeDescription = require("../utils/sanutuzeDescription");

const all = async (req, res) => {
    const {
        category,
        sub_category,
        sub_sub_category,
        brand,
        search,
        select,
        limit = 10,
        page = 1,
        exclude,
        out_of_stock,
    } = req.query;

    const { lang = "en", currency = 'USD' } = req.headers

    const includes = [
        {
            model: models.product_translations,
            as: "translations",
            where: {
                language: lang,
                ...(search && { name: { [Op.like]: `${search}%` } })
            },
            attributes: ['language', 'name', 'short_description'],
        },
        {
            model: models.product_image,
            as: "images",
            attributes: ["id", "isPrimary", "imageUrl", "placeholder"],
            limit: 2,
            order: [['isPrimary', 'DESC'], ['id', 'ASC']],
        },
        {
            model: models.category,
            as: "category",
            attributes: ["name", "slug"],
            ...(category ? { where: { slug: category } } : {}),
        },
        {
            model: models.subcategory,
            as: "subCategory",
            attributes: ["name", "slug"],
            ...(sub_category ? { where: { slug: sub_category } } : {}),
        },
        {
            model: models.subsubcategory,
            as: "subSubCategory",
            attributes: ["name", "slug"],
            ...(sub_sub_category ? { where: { slug: sub_sub_category } } : {}),
        },
        {
            model: models.brand,
            as: "brand",
            attributes: ["name", "slug", "placeholder", "image"],
            ...(brand ? { where: { slug: brand } } : {})
        },
    ];

    const where = {};

    if (select === 'true' || select === undefined) {
        where.isAvailable = true;
    } else if (select === 'false') {
        where.isAvailable = false;
    } else if (select === 'all') {
        // لا تضف أي شرط، رجّع الكل

    } else {
        where.isAvailable = true;
    }

    if (exclude) {
        const ids = exclude.split(",").map(id => parseInt(id)).filter(Boolean);
        if (ids.length) {
            where.id = { [Op.notIn]: ids };
        }
    }

    if (out_of_stock === 'true') {
        where.quantity = { [Op.lte]: 0 };
    } else if (out_of_stock === 'false') {
        where.quantity = { [Op.gt]: 0 };
    }


    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const rows = await models.product.findAll({
            where,
            limit: parseInt(limit),
            offset,
            attributes: [
                "id",
                "slug",
                "price",
                "discount",
                "quantity",
                "categorySlug",
                "brandSlug",
                "averageRating",
                "reviewsCount",
                "isAvailable",
                "isVisible",
                "variants",
                "sku",
            ],
            include: includes,
            distinct: true,
        });

        const count = await models.product.count({ where, include: includes, distinct: true });
        const totalPages = Math.ceil(count / parseInt(limit));

        const userCurrency = await models.currency.findOne({
            where: { code: currency.toUpperCase() }
        });

        let rate;
        let symbol;

        if (!userCurrency) {
            rate = 1;
            symbol = '$';
        }


        if (userCurrency) {
            rate = parseFloat(userCurrency?.exchange_rate)
            symbol = userCurrency?.symbol
        }


        const data = rows.map(product => {
            const productJson = product.get({ plain: true });

            // Translations
            const translation = productJson.translations?.[0];
            if (translation) {
                productJson.name = translation.name;
                productJson.short_description = translation.short_description;
            }
            delete productJson.translations;

            // Price

            productJson.price = parseFloat((productJson.price * rate).toFixed(2));
            productJson.currency = userCurrency?.code.toUpperCase() || 'USD';
            productJson.currencySymbol = symbol;

            return productJson;
        });

        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data,
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const select = async (req, res) => {

    const { admin = false } = req.query;

    const { lang = "en", currency = 'USD' } = req.headers


    const { slug } = req.params;

    try {

        const product = await models.product.findOne({
            where: {
                slug
            },
            include: [
                {
                    model: models.product_translations,
                    as: "translations",
                    attributes: ['language', 'name', 'description', 'short_description'],
                },
                {
                    model: models.product_image,
                    as: "images",
                    attributes: ["id", "isPrimary", "imageUrl", "placeholder"],
                },
            ],
            order: [
                [{ model: models.product_image, as: 'images' }, 'id', 'ASC']
            ]
        });

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        const productData = product.toJSON();

        const translation = productData.translations.find(t => t.language === lang);
        if (translation) {
            productData.name = translation.name;
            productData.description = translation.description;
            productData.short_description = translation.short_description;
        }

        // Price
        const userCurrency = await models.currency.findOne({
            where: { code: currency.toUpperCase() }
        });

        const rate = userCurrency ? parseFloat(userCurrency.exchange_rate) : 1;
        const symbol = userCurrency ? userCurrency.symbol : '$';
        productData.price = parseFloat((productData.price * rate).toFixed(2));
        productData.currency = currency.toUpperCase();
        productData.currencySymbol = symbol;

        if (!admin) {
            delete productData.translations;
        }

        res.status(200).json({
            data: productData
        })
    } catch (e) {
        res.status(500).json({
            status: false,
            message: "server error",
            error: e
        })
    }
}

const create = async (req, res) => {
    const { name, description, short_description, price, discount, quantity, brandSlug, category_slug, sub_category_slug, sub_sub_category_slug, variants, isAvailable, metaTitle, metaDescription, metaKeywords } = req.body;

    if (!req?.images) {
        return res.status(400).json({
            status: false,
            message: "image is required",
        });
    }


    if (!name || !price || !brandSlug || !category_slug || !sub_category_slug) {
        if (req.images?.length) deleteFiles(req.images);
        return res.status(400).json({
            status: false,
            message: "All required fields (name, price, category_slug, sub_category_slug, brandSlug) must be provided",
        });
    }

    const t = await models.sequelize.transaction();

    try {

        const category = await models.category.findOne({
            where: { slug: category_slug }
        })

        if (!category) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({
                status: false,
                message: "category is not found"
            });
        }

        const subCategory = await models.subcategory.findOne({
            where: { slug: sub_category_slug, categorySlug: category.slug }
        })

        if (!subCategory) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({
                status: false,
                message: "sub_category is not found"
            });
        }

        let sub_sub_category = null;
        if (sub_sub_category_slug) {

            sub_sub_category = await models.subsubcategory.findOne({
                where: { slug: sub_sub_category_slug }, include: {
                    model: models.subcategory,
                    as: "sub_category"
                }
            });
            if (!sub_sub_category) {
                if (req.images?.length) deleteFiles(req.images);
                return res.status(404).json({
                    status: false,
                    message: "sub_sub_category is not found"
                });
            }
            if (sub_sub_category.sub_category.slug != sub_category_slug) {
                if (req.images?.length) deleteFiles(req.images);
                return res.status(404).json({
                    status: false,
                    message: "sub_sub_category is not inside sub_category",
                });
            }

        }

        const brand = await models.brand.findOne({
            where: { slug: brandSlug },
        });


        if (!brand) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({
                status: false,
                message: "Brand not found",
            });
        }

        const slug = slugify(name, { lower: true });

        let parsedVariants = variants || null;

        if (typeof variants === "string") {
            try {
                parsedVariants = JSON.parse(variants);

                if (!Array.isArray(parsedVariants)) {
                    return res.status(400).json({
                        status: false,
                        message: "variants must be a JSON array."
                    });
                }

            } catch (e) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid variants format. Must be a valid JSON array."
                });
            }
        }

        const product = await models.product.create({
            slug,
            price,
            discount,
            quantity,
            isAvailable,
            metaTitle,
            metaDescription,
            metaKeywords,
            categorySlug: category_slug,
            subCategorySlug: sub_category_slug,
            subSubCategorySlug: sub_sub_category?.slug || null,
            brandSlug: brand.slug,
            variants: parsedVariants,
        }, { transaction: t });


        const safeHtml = sanitizeDescription(description);
        const $ = cheerio.load(safeHtml || "");
        const textsToTranslate = $("p, li, h3, ul").map((i, el) => $(el).text().trim()).get().filter(Boolean);
        if (textsToTranslate.length) {
            const translated = await tr(textsToTranslate.join("\n"), { from: "auto", to: "ar" });
            const translatedArray = translated.text.split("\n");
            $("p, li, h3, ul").each((i, el) => { $(el).text(translatedArray[i] || $(el).text()) });
        }
        const translatedHtml = $("body").html();


        try {
            const nameTr = name ? await tr(name, { from: "auto", to: "ar" }) : { src: "en", text: "" };
            const shortDescTr = short_description ? await tr(short_description, { from: "auto", to: "ar" }) : { text: "" };
            const detectedLang = nameTr.src;

            const translations = detectedLang === "en" ? [
                { productId: product.id, language: "en", name, description, short_description },
                { productId: product.id, language: "ar", name: nameTr.text, description: translatedHtml, short_description: shortDescTr.text || "" }
            ] : [
                { productId: product.id, language: "ar", name, description, short_description },
                { productId: product.id, language: "en", name: nameTr.text, description: translatedHtml, short_description: shortDescTr.text || "" }
            ];

            await models.product_translations.destroy({ where: { productId: product.id }, transaction: t });
            await models.product_translations.bulkCreate(translations, { transaction: t });

        } catch (translationError) {
            console.error("❌ Translation failed:", translationError);
        }


        if (req.images && req.images.length > 0) {
            const imageData = req.images.map((img, index) => ({
                productId: product.id,
                imageUrl: img,
                placeholder: req.imageBase64List[index],
                isPrimary: index === 0,
            }));
            await models.product_image.bulkCreate(imageData, { transaction: t });
        }

        await t.commit();

        res.status(200).json({
            status: true,
            message: "Product created successfully",
        })
    } catch (e) {
        if (req.images?.length) deleteFiles(req.images);
        await t.rollback();
        res.status(500).json({
            message: "server error",
            error: e,
        })
    }
}

const update = async (req, res) => {
    const { slug } = req.params;


    if (!slug) {
        return res.status(400).json({ status: false, message: "slug is required" });
    }

    const { name, description, short_description, price, discount, quantity, brandSlug, category_slug, sub_category_slug, sub_sub_category_slug, variants, isAvailable, metaTitle, metaDescription, metaKeywords } = req.body;
    const t = await models.sequelize.transaction();

    try {
        const product = await models.product.findOne({ where: { slug } });

        if (!product) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        // التأكد من صحة الأقسام والعلامة التجارية
        const category = await models.category.findOne({ where: { slug: category_slug } });
        if (!category) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({ status: false, message: "category is not found" });
        }

        const subCategory = await models.subcategory.findOne({ where: { slug: sub_category_slug, categorySlug: category.slug } });
        if (!subCategory) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({ status: false, message: "sub_category is not found" });
        }

        let sub_sub_category = null;
        if (sub_sub_category_slug) {
            sub_sub_category = await models.subsubcategory.findOne({
                where: { slug: sub_sub_category_slug },
                include: { model: models.subcategory, as: "sub_category" }
            });

            if (!sub_sub_category) {
                if (req.images?.length) deleteFiles(req.images);
                return res.status(404).json({ status: false, message: "sub_sub_category is not found" });
            }

            if (sub_sub_category.sub_category.slug != sub_category_slug) {
                if (req.images?.length) deleteFiles(req.images);
                return res.status(404).json({ status: false, message: "sub_sub_category is not inside sub_category" });
            }
        }


        const brand = await models.brand.findOne({ where: { slug: brandSlug } });
        if (!brand) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({ status: false, message: "Brand not found" });
        }

        if (req.images?.length > 0) {
            // حذف الصور القديمة
            const oldImages = await models.product_image.findAll({ where: { productId: product.id } });
            const oldImagePaths = oldImages.map(img => img.imageUrl);
            if (oldImagePaths.length) deleteFiles(oldImagePaths);
            await models.product_image.destroy({ where: { productId: product.id } });

            // إضافة الصور الجديدة
            const imageData = req.images.map((img, index) => ({
                productId: product.id,
                imageUrl: img,
                placeholder: req.imageBase64List?.[index] || null,
                isPrimary: index === 0,
            }));

            await models.product_image.bulkCreate(imageData);
        }

        let translations = [];

        try {
            const safeHtml = sanitizeDescription(description);
            const $ = cheerio.load(safeHtml || "");
            const textsToTranslate = $("p, li, h3, ul")
                .map((i, el) => $(el).text().trim())
                .get()
                .filter(Boolean);

            let translatedHtml = description;
            if (textsToTranslate.length) {
                const translated = await tr(textsToTranslate.join("\n"), { from: "auto", to: "ar" });
                const translatedArray = translated.text.split("\n");
                $("p, li, h3, ul").each((i, el) => {
                    $(el).text(translatedArray[i] || $(el).text());
                });
                translatedHtml = $("body").html();
            }

            const nameTr = name ? await tr(name, { from: "auto", to: "ar" }) : { src: "en", text: "" };
            const shortDescTr = short_description
                ? await tr(short_description, { from: "auto", to: "ar" })
                : { text: "" };

            const detectedLang = nameTr.src;

            translations =
                detectedLang === "en"
                    ? [
                        { productId: product.id, language: "en", name, description, short_description },
                        {
                            productId: product.id,
                            language: "ar",
                            name: nameTr.text,
                            description: translatedHtml,
                            short_description: shortDescTr.text || "",
                        },
                    ]
                    : [
                        { productId: product.id, language: "ar", name, description, short_description },
                        {
                            productId: product.id,
                            language: "en",
                            name: nameTr.text,
                            description: translatedHtml,
                            short_description: shortDescTr.text || "",
                        },
                    ];

            await models.product_translations.destroy({ where: { productId: product.id }, transaction: t });
            await models.product_translations.bulkCreate(translations, { transaction: t });

        } catch (translationError) {
            console.error("Translation failed:", translationError);
        }

        const newSlug = slugify(name, { lower: true });

        if (newSlug !== product.slug) {
            product.slug = newSlug;
        }

        let parsedVariants = variants || null;

        if (typeof variants === "string") {
            try {
                parsedVariants = JSON.parse(variants);

                if (!Array.isArray(parsedVariants)) {
                    return res.status(400).json({
                        status: false,
                        message: "variants must be a JSON array."
                    });
                }

            } catch (e) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid variants format. Must be a valid JSON array."
                });
            }
        }

        // تحديث بيانات المنتج
        await product.update({
            price,
            discount,
            quantity,
            isAvailable,
            metaTitle,
            metaDescription,
            metaKeywords,
            categorySlug: category_slug,
            subCategorySlug: sub_category_slug,
            subSubCategorySlug: sub_sub_category?.slug || null,
            brandSlug: brand.slug,
            variants: parsedVariants
        }, { transaction: t });

        await t.commit();
        res.status(200).json({
            status: true,
            message: "Product updated successfully",
        });

    } catch (e) {
        await t.rollback();
        if (req.images?.length) deleteFiles(req.images);
        res.status(500).json({
            message: "server error",
            error: e.message || e,
        });
    }
};

const destroy = async (req, res) => {
    const { slug } = req.params

    try {
        const product = await models.product.findOne({
            where: {
                slug
            },
            include: [
                {
                    model: models.product_image,
                    as: "images",
                    attributes: ["imageUrl"],
                }
            ],
            attributes: ["id"],
        });

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "product is not found",
            })
        }

        const allImages = product.images.flatMap((item) => item.imageUrl)
        if (allImages) {
            deleteFiles(allImages)
        }

        await product.destroy()

        res.status(200).json({
            status: true,
            message: "product deleted successfully",
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }

}

module.exports = { all, select, create, update, destroy }