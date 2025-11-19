const models = require("../models");
const updateRatingStats = require("../utils/updateRatingStats");

const all = async (req, res) => {
    const { limit = 10, page = 1, } = req.query
    const { productId } = req.params

    if (!productId || productId === "") {
        return res.status(400).json({
            status: false,
            message: "productId is required"
        })
    }

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await models.review.findAndCountAll({
            where: {
                productId
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

const create = async (req, res) => {
    const { comment, rating } = req.body;
    const { productId, userId } = req.params
    if (!rating || rating === "") {
        return res.status(400).json({
            status: false,
            message: "rating is required"
        })
    }

    if (!productId || productId === "") {
        return res.status(400).json({
            status: false,
            message: "productId is required"
        })
    }

    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    try {

        const user = await models.user.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user is not defiend",
            })
        }

        const product = await models.product.findByPk(productId)
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "product is not defiend",
            })
        }

        const userReviewed = await models.review.findOne({
            where: {
                productId,
                userId
            }
        })
        if (userReviewed) {
            return res.status(400).json({
                status: false,
                message: "you have already reviewed this product",
            })
        }

        const review = await models.review.create({ comment, rating, productId, userId })

        await updateRatingStats(productId);

        res.status(201).json({
            status: true,
            message: "review added successfully",
            review
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const update = async (req, res) => {
    const { comment, rating } = req.body;

    const { userId, reviewId } = req.params

    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    if (!reviewId || reviewId === "") {
        return res.status(400).json({
            status: false,
            message: "reviewId is required"
        })
    }

    try {

        const review = await models.review.findByPk(reviewId)
        if (!review) {
            return res.status(404).json({
                status: false,
                message: "review is not defiend",
            })
        }

        await models.review.update({
            comment, rating
        }, {
            where: {
                id: reviewId
            }
        })

        await updateRatingStats(review.productId);

        res.status(201).json({
            status: true,
            message: "review updated successfully",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const destroy = async (req, res) => {
    const { userId, reviewId } = req.params

    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    if (!reviewId || reviewId === "") {
        return res.status(400).json({
            status: false,
            message: "reviewId is required"
        })
    }


    try {
        const review = await models.review.findByPk(reviewId)
        if (!review) {
            return res.status(404).json({
                status: false,
                message: "review is not defiend",
            })
        }
        await models.review.destroy({
            where: {
                id: reviewId
            }
        })

        await updateRatingStats(review.productId);


        res.status(201).json({
            status: true,
            message: "review deleted successfully",
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, create, update, destroy }