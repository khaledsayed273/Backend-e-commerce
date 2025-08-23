const { Op } = require("sequelize");
const { deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");
const slugify = require('slugify');
const tr = require("googletrans").default;

const all = async (req, res) => {

    const { category, sub_category, sub_sub_category, brand, search, select, limit = 10, page = 1, lang = "en" } = req.query;

    const includes = [
        {
            model: models.product_translations,
            as: "translations",
            where: {
                language: lang,
                ...(search && { name: { [Op.like]: `${search}%` } })
            },
            attributes: ['language', 'name', 'description', 'short_description'],
        },
        {
            model: models.product_image,
            as: "images",
            attributes: ["id", "isPrimary", "imageUrl", "placeholder"],
            separate: true,
            limit: 2,
            order: [['isPrimary', 'DESC'], ['id', 'ASC']],
        },
        {
            model: models.product_option,
            as: "options",
            include: [
                { model: models.option_types, as: 'type' },
                { model: models.product_option_value, as: 'values' }
            ]
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

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await models.product.findAndCountAll({
            where,
            distinct: true,
            limit: parseInt(limit),
            offset,
            attributes: [
                'id',
                'slug',
                'price',
                'discount',
                'quantity',
                'categorySlug',
                'brandSlug',
                'averageRating',
                'reviewsCount',
                'isAvailable',
                'isVisible'
            ],
            include: includes
        });


        const totalPages = Math.ceil(count / parseInt(limit));

        const dataWithSimplifiedOptions = rows.map(product => {
            const productJson = product.toJSON();

            // for Translations

            const translation = productJson.translations.find(t => t.language === lang);

            if (translation) {
                productJson.name = translation.name;
                productJson.description = translation.description;
                productJson.short_description = translation.short_description;
            }

            delete productJson.translations;

            // for Images
            if (productJson.images?.length) {
                productJson.images = productJson.images.map(image => ({
                    ...image,
                    imageUrl: `${process.env.baseUrl}/${image.imageUrl.replace(/\\/g, '/')}`,
                }));
            }

            // for Image brand

            if (productJson.brand?.image) {
                productJson.brand.image = `${process.env.baseUrl}/${productJson.brand.image.replace(/\\/g, '/')}`;
            }


            // for Options

            const transformedOptions = productJson.options.reduce((acc, option) => {
                const typeName = option.type?.name || 'unknown';
                acc[typeName] = option.values?.map(v => v.value) || [];
                return acc;
            }, {});

            productJson.options = transformedOptions;

            return productJson
        });


        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: dataWithSimplifiedOptions,
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const getOneBySlug = async (req, res) => {

    const { lang = "en", admin = false } = req.query;

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
                {
                    model: models.product_option,
                    as: "options",
                    include: [
                        { model: models.option_types, as: 'type' },
                        { model: models.product_option_value, as: 'values' }
                    ]
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

        if (!admin) {
            delete productData.translations;
        }


        // for Images
        if (productData.images?.length) {
            productData.images = productData.images.map(image => ({
                ...image,
                imageUrl: `${process.env.baseUrl}/${image.imageUrl.replace(/\\/g, '/')}`,
            }));
        }

        // for Options

        productData.options = productData.options.reduce((acc, option) => {
            const typeName = option.type?.name || 'unknown';
            acc[typeName] = option.values?.map(v => v.value) || [];
            return acc;
        }, {});


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

const addNew = async (req, res) => {
    const { name, description, short_description, price, discount, quantity, brandSlug, category_slug, sub_category_slug, sub_sub_category_slug, options, isAvailable, metaTitle, metaDescription, metaKeywords } = req.body;

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
        }, { transaction: t });


        // الترجمة التلقائية
        try {
            const [nameTr, descTr, shortDescTr] = await Promise.all([
                tr(name, { from: "en", to: "ar" }),
                tr(description, { from: "en", to: "ar" }),
                tr(short_description, { from: "en", to: "ar" }),
            ]);

            const detectedLang = nameTr.src;

            let nameEn, nameAr, descEn, descAr, shortDescEn, shortDescAr;

            if (detectedLang === "en") {
                nameEn = name;
                nameAr = nameTr.text;
                descEn = description;
                descAr = descTr.text;
                shortDescEn = short_description;
                shortDescAr = shortDescTr.text;
            } else {
                nameAr = name;
                nameEn = nameTr.text;
                descAr = description;
                descEn = descTr.text;
                shortDescAr = short_description;
                shortDescEn = shortDescTr.text;
            }

            await models.product_translations.bulkCreate([
                {
                    productId: product.id,
                    language: "en",
                    name: nameEn,
                    description: descEn,
                    short_description: shortDescEn,
                },
                {
                    productId: product.id,
                    language: "ar",
                    name: nameAr,
                    description: descAr,
                    short_description: shortDescAr,
                },
            ], { transaction: t });
        } catch (translationError) {
            console.error("Translation failed:", translationError);
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

        // to add options 

        if (options) {

            let parsedOptions = JSON.parse(options);

            const groupedByType = {};
            for (const item of parsedOptions) {
                if (!item.typeId || !Array.isArray(item.values) || item.values.every(val => !val.trim())) {
                    continue;
                }
                if (!groupedByType[item.typeId]) {
                    groupedByType[item.typeId] = [];
                }
                groupedByType[item.typeId].push(...item.values);
            }


            for (const typeId of Object.keys(groupedByType)) {

                const exists = await models.option_type.findOne({
                    where: { id: parseInt(typeId) }
                });

                if (!exists) {
                    return res.status(400).json({
                        status: false,
                        message: `OptionType with id ${typeId} does not exist`
                    });
                }

                const productOption = await models.product_option.create({
                    productId: product.id,
                    optionTypeId: parseInt(typeId),
                }, { transaction: t });

                const values = groupedByType[typeId].map((value) => ({
                    productOptionId: productOption.id,
                    value,
                }));

                await models.product_option_value.bulkCreate(values, { transaction: t });
            }
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

const updateProduct = async (req, res) => {
    const { slug } = req.params;

    if (!slug) {
        return res.status(400).json({ status: false, message: "slug is required" });
    }

    const { name, description, short_description, price, discount, quantity, brandSlug, category_slug, sub_category_slug, sub_sub_category_slug, options, isAvailable, metaTitle, metaDescription, metaKeywords } = req.body;

    if ((!req.images || req.images.length === 0)) {
        return res.status(400).json({
            status: false,
            message: "At least one image (new or old) is required",
        });
    }

    if (!name || !price || !brandSlug || !category_slug || !sub_category_slug) {
        if (req.images?.length) deleteFiles(req.images);
        return res.status(400).json({
            status: false,
            message: "All required fields (name, price, category_slug, sub_category_slug, brandSlug) must be provided",
        });
    }

    try {
        // جلب المنتج الحالي
        const product = await models.product.findOne({ where: { slug } });

        if (!product) {
            if (req.images?.length) deleteFiles(req.images);
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        // التأكد من صحة الأقسام والعلامة التجارية كما في السابق
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

        // حذف الصور القديمة
        const oldImagesFromDB = await models.product_image.findAll({ where: { productId: product.id } });
        const oldImagePaths = oldImagesFromDB.map(img => img.imageUrl);
        if (oldImagePaths?.length > 0) {
            deleteFiles(oldImagePaths);
            await models.product_image.destroy({ where: { productId: product.id } });
        }

        // إضافة الصور الجديدة
        const imageData = req.images.map((img, index) => ({
            productId: product.id,
            imageUrl: img,
            placeholder: req.imageBase64List?.[index] || null,
            isPrimary: index === 0,
        }));

        await models.product_image.bulkCreate(imageData);


        try {
            const nameTr = await tr(name, { from: "en", to: "ar" });
            const descTr = await tr(description || "", { from: "en", to: "ar" });
            const shortDescTr = await tr(short_description || "", { from: "en", to: "ar" });

            const detectedLang = nameTr.src;
            let nameEn, nameAr, descEn, descAr, shortDescEn, shortDescAr;

            if (detectedLang === "en") {
                nameEn = name;
                nameAr = nameTr.text;
                descEn = description;
                descAr = descTr.text;
                shortDescEn = short_description;
                shortDescAr = shortDescTr.text;
            } else {
                nameAr = name;
                nameEn = nameTr.text;
                descAr = description;
                descEn = descTr.text;
                shortDescAr = short_description;
                shortDescEn = shortDescTr.text;
            }

            // حذف الترجمات القديمة
            await models.product_translations.destroy({ where: { productId: product.id } });

            // حفظ الترجمتين
            await models.product_translations.bulkCreate([
                {
                    productId: product.id,
                    language: "en",
                    name: nameEn,
                    description: descEn,
                    short_description: shortDescEn,
                },
                {
                    productId: product.id,
                    language: "ar",
                    name: nameAr,
                    description: descAr,
                    short_description: shortDescAr,
                },
            ]);
        } catch (translationError) {
            console.error("❌ Translation failed:", translationError);
        }

        // تحديث بيانات المنتج
        const newSlug = slugify(name, { lower: true });
        await product.update({
            slug: newSlug,
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
        });



        const deleteOldProductOptions = async (productId) => {
            const oldOptions = await models.product_option.findAll({ where: { productId } });
            for (const option of oldOptions) {
                await models.product_option_value.destroy({ where: { productOptionId: option.id } });
            }
            await models.product_option.destroy({ where: { productId } });
        };
        // تعديل الخيارات (Options)
        if (options) {
            let parsedOptions = JSON.parse(options);
            const groupedByType = {};
            for (const item of parsedOptions) {
                if (!groupedByType[item.typeId]) {
                    groupedByType[item.typeId] = [];
                }
                groupedByType[item.typeId].push(...item.values);
            }

            // حذف الخيارات القديمة مع القيم المرتبطة بها (تم حذفها قبل، لكن فقط لو لم تفعل من قبل)
            const oldOptions = await models.product_option.findAll({ where: { productId: product.id } });
            for (const option of oldOptions) {
                await models.product_option_value.destroy({ where: { productOptionId: option.id } });
            }
            await models.product_option.destroy({ where: { productId: product.id } });

            for (const typeId of Object.keys(groupedByType)) {
                const productOption = await models.product_option.create({
                    productId: product.id,
                    optionTypeId: parseInt(typeId),
                });

                const values = groupedByType[typeId].map((value) => ({
                    productOptionId: productOption.id,
                    value,
                }));

                await models.product_option_value.bulkCreate(values);
            }
        } else {
            await deleteOldProductOptions(product.id);
        }



        res.status(200).json({
            status: true,
            message: "Product updated successfully",
        });

    } catch (e) {
        if (req.images?.length) deleteFiles(req.images);

        res.status(500).json({
            message: "server error",
            error: e.message || e,
        });
    }
};

const deleteProduct = async (req, res) => {
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

const getTypes = async (req, res) => {

    try {
        const types = await models.option_types.findAll({
            attributes: ["id", "name"],
        });

        res.status(200).json({
            status: true,
            data: types,
        });
    } catch (e) {
        res.status(500).json({
            status: false,
            message: "server error",
            error: e,
        });
    }
}

module.exports = { all, addNew, getOneBySlug, deleteProduct, getTypes, updateProduct }