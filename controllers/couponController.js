const { Op } = require("sequelize");
const models = require("../models");

const all = async (req, res) => {

    const { status, search, limit = 10, page = 1, } = req.query

    const theStatus = status === "active" ? true : false

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await models.coupon.findAndCountAll({
            where: {
                ...(status && { isActive: theStatus }),
                ...(search && {
                    code: {
                        [Op.like]: `%${search}%`,
                    },
                }),
            },
            limit: parseInt(limit),
            offset,
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

const add = async (req, res) => {

    const {
        code,
        type,
        value,
        expiresAt,
        usageLimit,
        startsAt,
        maxDiscount,
        minOrderValue,
        isActive
    } = req.body;

    if (!code || code === "") {
        return res.status(400).json({
            status: false,
            message: "code is required"
        })
    }

    if (!type || type === "") {
        return res.status(400).json({
            status: false,
            message: "type is required"
        })
    }

    if (!value || value === "") {
        return res.status(400).json({
            status: false,
            message: "value is required"
        })
    }

    if (!expiresAt || expiresAt === "") {
        return res.status(400).json({
            status: false,
            message: "expiresAt is required"
        })
    }

    try {
        const coupon = await models.coupon.create({
            code,
            type,
            value,
            usageLimit,
            startsAt,
            maxDiscount,
            minOrderValue,
            expiresAt,
            isActive
        })
        res.status(201).json({
            status: true,
            message: "coupon created successfully",
            coupon
        })

    } catch (e) {
        if (e.name === "SequelizeUniqueConstraintError") {
            return res.status(500).json({
                message: "code must be uniqe",
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
    const { couponId } = req.params

    const {
        code,
        type,
        value,
        expiresAt,
        usageLimit,
        startsAt,
        maxDiscount,
        minOrderValue
    } = req.body;


    if (!couponId || couponId === "") {
        return res.status(400).json({
            status: false,
            message: "couponId is required"
        })
    }


    try {

        const coupon = await models.coupon.findByPk(couponId)
        if (!coupon) {
            return res.status(404).json({
                status: false,
                message: "coupon is not defiend",
            })
        }

        await models.coupon.update({
            code,
            type,
            value,
            usageLimit,
            startsAt,
            maxDiscount,
            minOrderValue,
            expiresAt
        }, {
            where: {
                id: couponId
            }
        })

        res.status(201).json({
            status: true,
            message: "coupon updated successfully",

        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const deleteCoupon = async (req, res) => {
    const { couponId } = req.params

    if (!couponId || couponId === "") {
        return res.status(400).json({
            status: false,
            message: "couponId is required"
        })
    }


    try {
        const coupon = await models.coupon.findByPk(couponId)
        if (!coupon) {
            return res.status(404).json({
                status: false,
                message: "coupon is not defiend",
            })
        }
        await models.coupon.destroy({
            where: {
                id: couponId
            }
        })

        res.status(201).json({
            status: true,
            message: "coupon deleted successfully",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, add, update, deleteCoupon }