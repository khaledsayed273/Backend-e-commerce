const { review, product, Sequelize } = require('../models');

const updateRatingStats = async (productId) => {
    const result = await review.findAll({
        where: { productId },
        attributes: [
            [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        raw: true
    });

    const average = parseFloat(result[0].avgRating) || 0;
    const count = parseInt(result[0].count) || 0;

    await product.update(
        {
            averageRating: average,
            reviewsCount: count
        },
        { where: { id: productId } }
    );
};

module.exports = updateRatingStats;
