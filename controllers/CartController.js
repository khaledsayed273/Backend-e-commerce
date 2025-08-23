const models = require("../models");

const carts = async (req, res) => {

    const { userId } = req.params
    const { lang = "en" } = req.headers

    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    try {

        const carts = await models.cart_item.findAll({
            where: { userId },
            include: [
                {
                    model: models.product,
                    as: 'product',
                    attributes: ['price', 'slug', "discount", "quantity", "brandSlug"],
                    include: [
                        {
                            model: models.product_translations,
                            as: 'translations',
                            where: { language: lang },
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: models.cart_item_option,
                    as: 'options',
                    attributes: ['cartItemId'],
                    include: {
                        model: models.product_option_value,
                        as: 'value',
                        attributes: ['value'],
                        include: {
                            model: models.product_option,
                            as: 'productOption',
                            attributes: ['id'],
                            include: {
                                model: models.option_types,
                                as: 'type',
                                attributes: ['name']
                            }
                        }
                    }
                }
            ]
        });

        const formattedCarts = carts.map(cart => {

            const product = {
                price: cart.product?.price,
                discount: cart.product?.discount,
                slug: cart.product?.slug,
                quantity: cart.product?.quantity,
                brandSlug: cart.product?.brandSlug,
                name: cart.product?.translations?.[0]?.name || null
            }

            const options = {};
            for (const opt of cart.options || []) {
                const key = opt?.value?.productOption?.type?.name;
                const val = opt?.value?.value;
                if (key && val) {
                    options[key] = val;
                }
            }

            return {
                id: cart.id,
                productId: cart.productId,
                quantity: cart.quantity,
                product,
                options,
                createdAt: cart.createdAt,
            };
        })

        const total = formattedCarts.reduce((acc, cart) => acc + parseFloat(cart?.quantity * (cart?.product?.price - cart?.product?.discount)), 0);

        res.status(200).json({
            status: true,
            data: formattedCarts,
            total,
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const add = async (req, res) => {
    const { userId } = req.params;

    const { productId, quantity, options = {} } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({
            status: false,
            message: "Quantity must be at least 1"
        });
    }


    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    if (req?.user?.id != userId) {
        return res.status(403).json({
            status: false,
            message: "Forbidden: You do not have access to this user"
        });
    }

    try {
        const user = await models.user.findOne({
            where: { id: userId, status: "active" },
            attributes: ['tokenVersion']
        });


        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user not found"
            })
        }

        const product = await models.product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "product not found"
            })
        }


        const existingCartItems = await models.cart_item.findAll({
            where: { userId, productId },
            include: [
                {
                    model: models.cart_item_option,
                    as: 'options',
                    include: {
                        model: models.product_option_value,
                        as: 'value',
                        include: {
                            model: models.product_option,
                            as: 'productOption',
                            include: {
                                model: models.option_types,
                                as: 'type'
                            }
                        }
                    }
                }
            ]
        });


        for (const item of existingCartItems) {
            const existingOptions = {};
            for (const opt of item.options) {
                const key = opt.value.productOption.type.name;
                const val = opt.value.value;
                existingOptions[key] = val;
            }

            if (JSON.stringify(existingOptions) === JSON.stringify(options)) {
                return res.status(409).json({
                    status: false,
                    message: "This product with the same options is already in the cart"
                });
            }
        }

        const cartItem = await models.cart_item.create({
            userId,
            productId,
            quantity,
        });

        for (const [optionName, value] of Object.entries(options)) {
            const optionType = await models.option_types.findOne({ where: { name: optionName } });

            if (!optionType) {
                return res.status(404).json({
                    status: false,
                    message: "optionType not found"
                })
            }

            const productOption = await models.product_option.findOne({ where: { productId, optionTypeId: optionType.id } });

            if (!productOption) {
                return res.status(404).json({
                    status: false,
                    message: "productOption not found"
                })
            }

            const optionValue = await models.product_option_value.findOne({ where: { productOptionId: productOption.id, value } });

            if (!optionValue) {
                return res.status(404).json({
                    status: false,
                    message: "optionValue not found"
                })
            }

            await models.cart_item_option.create({
                cartItemId: cartItem.id,
                productOptionValueId: optionValue.id
            });

        }

        res.status(201).json({
            status: true,
            message: "success",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const update = async (req, res) => {
    const { userId } = req.params;

    const { productId, cartId, quantity, options = {} } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({
            status: false,
            message: "Quantity must be at least 1"
        });
    }


    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }
    if (!cartId || cartId === "") {
        return res.status(400).json({
            status: false,
            message: "cartId is required"
        })
    }

    if (req?.user?.id != userId) {
        return res.status(403).json({
            status: false,
            message: "Forbidden: You do not have access to this user"
        });
    }

    try {
        const user = await models.user.findOne({
            where: { id: userId, status: "active" },
            attributes: ['tokenVersion']
        });


        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user not found"
            })
        }

        const product = await models.product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "product not found"
            })
        }


        const existingCartItem = await models.cart_item.findOne({
            where: { userId, productId, id: cartId },
            include: [
                {
                    model: models.cart_item_option,
                    as: 'options',
                    include: {
                        model: models.product_option_value,
                        as: 'value',
                        include: {
                            model: models.product_option,
                            as: 'productOption',
                            include: {
                                model: models.option_types,
                                as: 'type'
                            }
                        }
                    }
                }
            ]
        });

        if (!existingCartItem) {
            return res.status(404).json({
                status: false,
                message: "Cart item not found for this user and product"
            });
        }


        // تحقق من وجود عنصر آخر بنفس المنتج ونفس الخيارات
        const otherCartItems = await models.cart_item.findAll({
            where: {
                userId,
                productId,
                id: { [models.Sequelize.Op.ne]: cartId } // أي عنصر غير الحالي
            },
            include: [
                {
                    model: models.cart_item_option,
                    as: "options",
                    include: {
                        model: models.product_option_value,
                        as: "value",
                        include: {
                            model: models.product_option,
                            as: "productOption",
                            include: {
                                model: models.option_types,
                                as: "type"
                            }
                        }
                    }
                }
            ]
        });


        for (const item of otherCartItems) {
            const existingOptions = {};
            for (const opt of item.options || []) {
                const key = opt.value?.productOption?.type?.name;
                const val = opt.value?.value;
                if (key && val) existingOptions[key] = val;
            }

            if (JSON.stringify(existingOptions) === JSON.stringify(options)) {
                return res.status(409).json({
                    status: false,
                    message: "Another cart item with the same product and options already exists"
                });
            }
        }


        await models.cart_item_option.destroy({
            where: { cartItemId: existingCartItem.id }
        });

        for (const [optionName, value] of Object.entries(options)) {
            const optionType = await models.option_types.findOne({ where: { name: optionName } });
            if (!optionType) return res.status(404).json({ status: false, message: "optionType not found" });

            const productOption = await models.product_option.findOne({
                where: { productId, optionTypeId: optionType.id }
            });
            if (!productOption) return res.status(404).json({ status: false, message: "productOption not found" });

            const optionValue = await models.product_option_value.findOne({
                where: { productOptionId: productOption.id, value }
            });
            if (!optionValue) return res.status(404).json({ status: false, message: "optionValue not found" });

            await models.cart_item_option.create({
                cartItemId: existingCartItem.id,
                productOptionValueId: optionValue.id
            });
        }

        await models.cart_item.update(
            { quantity },
            { where: { id: existingCartItem.id } }
        );

        return res.status(200).json({
            status: true,
            message: "Cart item updated successfully with new options"
        });


    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const deleteOneCart = async (req, res) => {
    const { userId, cartItemId } = req.params

    try {
        const user = await models.user.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user is not defiend",
            })
        }

        if (user.email !== req.user.email) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: You do not have access to delete this cart"
            });
        }

        if (user.tokenVersion !== req.user.tokenVersion) {
            return res.status(401).json({ message: 'Token Expired' });
        }

        const deletedCount = await models.cart_item.destroy({
            where: { userId, id: cartItemId }
        });

        if (deletedCount > 0) {
            res.status(200).json({
                status: true,
                message: "Cart deleted successfully"
            });
        } else {
            res.status(404).json({
                status: false,
                message: "Cart not found"
            });
        }

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const deleteCarts = async (req, res) => {
    const { userId } = req.params

    try {
        const user = await models.user.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user is not defiend",
            })
        }


        if (user.email !== req.user.email) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: You do not have access to delete this cart"
            });
        }

        if (user.tokenVersion !== req.user.tokenVersion) {
            return res.status(401).json({ message: 'Token Expired' });
        }

        const deletedCount = await models.cart_item.destroy({
            where: { userId }
        });

        if (deletedCount > 0) {
            res.status(200).json({
                status: true,
                message: "Carts deleted successfully"
            });
        } else {
            res.status(404).json({
                status: false,
                message: "No cart items found for this user"
            });
        }

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { carts, add, update, deleteOneCart, deleteCarts }