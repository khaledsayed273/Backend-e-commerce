const { Op } = require("sequelize");
const models = require("../models");

const all = async (req, res) => {

    const { status, search, limit = 10, page = 1, } = req.query

    try {

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await models.order.findAndCountAll({
            where: {
                ...(status && { status }),
                ...(search && {
                    code: {
                        [Op.like]: `%${search}%`,
                    },
                }),
            },
            limit: parseInt(limit),
            offset,
            include: [
                {
                    model: models.order_item,
                    as: "items",
                },
            ],
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: rows
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const previewOrder = async (req, res) => {
    const { userId, couponCode } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        const cartItems = await models.cart_item.findAll({
            where: { userId },
            include: [
                {
                    model: models.product,
                    as: 'product'
                },
                {
                    model: models.cart_item_option,
                    as: 'options'
                }
            ]
        })

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        let total = 0;
        const itemsData = [];

        for (const item of cartItems) {
            const originalPrice = item.product.price;
            const productDiscount = item.product.discount || 0;

            const finalPrice = originalPrice - productDiscount;
            total += finalPrice * item.quantity;

            itemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: finalPrice,
                options: item.options
            });
        }


        // coupon
        let discount = 0
        let couponRecord = null;

        if (couponCode) {
            couponRecord = await models.coupon.findOne({ where: { code: couponCode } })
            if (!couponRecord) {
                return res.status(400).json({ message: 'Invalid coupon code' });
            }

            const {
                minOrderValue,
                maxDiscount,
                value,
                type,
                isActive,
                startsAt,
                expiresAt,
                usageLimit
            } = couponRecord;

            const now = new Date();

            if (!isActive || (startsAt && now < new Date(startsAt)) || (expiresAt && now > new Date(expiresAt))) {
                return res.status(400).json({ message: 'Coupon is not active or expired' });
            }

            if (usageLimit === 0) {
                return res.status(400).json({ message: 'Coupon usage limit has been reached' });
            }

            if (total < minOrderValue) {
                return res.status(400).json({ message: `Order total must be at least ${minOrderValue}` });
            }

            if (type === 'percentage') {
                discount = total * (value / 100);
            } else if (type === 'amount') {
                discount = value;
            }

            if (maxDiscount !== null && discount > maxDiscount) {
                return res.status(400).json({ message: `Discount exceeds max allowed (${maxDiscount})` });
            }
        }



        return res.status(200).json({
            status: true,
            message: 'Preview success',
            total,
            discount,
            finalTotal: total - discount,
            items: itemsData,
            coupon: couponRecord
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const confirmOrder = async (req, res) => {
    const t = await models.sequelize.transaction();

    const {
        userId,
        couponId,
        discount = 0,
        total,
        finalTotal,
        paymentMethod,
        address,
        notes
    } = req.body;

    if (!userId || total == null || finalTotal == null) {
        return res.status(400).json({ message: 'userId, total, and finalTotal are required' });
    }

    try {

        const cartItems = await models.cart_item.findAll({
            where: { userId },
            include: [
                {
                    model: models.product,
                    as: 'product'
                }
            ]
        })

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }


        if (couponId) {
            const coupon = await models.coupon.findOne({
                where: {
                    id: couponId,
                    usageLimit: {
                        [Op.gt]: 0,
                    },
                },
            });

            if (coupon) {
                await models.coupon.increment("usedCount", {
                    by: 1,
                    where: { id: couponId },
                });

                await models.coupon.decrement("usageLimit", {
                    by: 1,
                    where: {
                        id: couponId,
                        usageLimit: {
                            [Op.gt]: 0,
                        },
                    },
                });
                const updatedCoupon = await models.coupon.findByPk(couponId);
                if (updatedCoupon.usageLimit === 0) {
                    await updatedCoupon.update({ isActive: false });
                }
            } else {
                return res.status(400).json({
                    message: "Coupon has reached its usage limit.",
                });
            }
        }

        const newOrder = await models.order.create({
            userId,
            couponId: couponId || null,
            total,
            discount,
            finalTotal,
            paymentMethod,
            address,
            notes,
            code: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }, { transaction: t });

        for (const item of cartItems) {
            const productPrice = item.product.price;
            const productDiscount = item.product.discount || 0;
            const finalPrice = productPrice - productDiscount;

            await models.order_item.create({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: finalPrice
            }, { transaction: t });
        }

        await t.commit();

        await models.cart_item.destroy({ where: { userId } });

        res.status(201).json({
            status: true,
            message: 'Order created successfully',
            order: newOrder
        })

    } catch (e) {
        await t.rollback();

        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params

    const { status } = req.body

    if (!orderId || orderId === "") {
        return res.status(400).json({
            status: false,
            message: "orderId is required"
        })
    }

    if (!status || status === "") {
        return res.status(400).json({
            status: false,
            message: "status is required"
        })
    }

    if (status !== "cancelled" && req?.user?.role === "user") {
        return res.status(400).json({
            status: false,
            message: "user doesn't have access to do it"
        })
    }

    try {

        const order = await models.order.findByPk(orderId)

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "order is not defiend",
            })
        }
        await models.order.update(
            { status },
            { where: { id: orderId } }
        )

        res.status(201).json({
            status: true,
            message: "order updated successfully",
            order
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const deleteOrder = async (req, res) => {
    const { orderId } = req.params

    if (!orderId || orderId === "") {
        return res.status(400).json({
            status: false,
            message: "orderId is required"
        })
    }

    try {
        const order = await models.order.findByPk(orderId)
        if (!order) {
            return res.status(404).json({
                status: false,
                message: "order is not defiend",
            })
        }
        await models.order.destroy({
            where: {
                id: orderId
            }
        })

        res.status(201).json({
            status: true,
            message: "order deleted successfully",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, previewOrder, confirmOrder, updateOrderStatus, deleteOrder }