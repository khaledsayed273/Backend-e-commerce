const jwt = require('jsonwebtoken');
const models = require('../models');

const verifyToken = (...role) => {
    return async (req, res, next) => {

        
        const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await models.user.findByPk(decoded.id);

            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found and token is invalid"
                });
            }

            if (decoded.email !== user.email || decoded.role !== user.role) {
                return res.status(403).json({
                    status: false,
                    message: "Forbidden: You do not have access to this user"
                });
            }

            if (decoded.tokenVersion !== user.tokenVersion) {
                return res.status(401).json({ message: 'Token Expired' });
            }

            if (role.length && !role.includes(decoded.role)) {
                return res.status(403).json({
                    status: false,
                    message: "Forbidden: You do not have the required role"
                });
            }
            req.user = user;
            next();
        } catch (error) {
            return res.status(403).json({
                status: false,
                message: "Failed to authenticate token",
                error: error.message
            });
        }
    }
}

module.exports = verifyToken;