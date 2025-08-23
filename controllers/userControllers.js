const { Op } = require("sequelize");
const { deleteFile } = require("../middleware/deleteFile");
const models = require("../models");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const all = async (req, res) => {

    const { status, search, limit = 10, page = 1, } = req.query

    const searchConditions = [];

    if (search) {
        const terms = search.trim().split(/\s+/);

        if (terms.length === 1) {
            searchConditions.push(
                { firstname: { [Op.like]: `${terms[0]}%` } },
                { lastname: { [Op.like]: `${terms[0]}%` } }
            );
        } else if (terms.length === 2) {
            searchConditions.push(
                {
                    [Op.and]: [
                        { firstname: { [Op.like]: `${terms[0]}%` } },
                        { lastname: { [Op.like]: `${terms[1]}%` } }
                    ]
                },
            );
        }
    }

    try {

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await models.user.findAndCountAll({
            where: {
                ...(status && { status }),
                ...(searchConditions.length > 0 && {
                    [Op.or]: searchConditions
                })
            },
            limit: parseInt(limit),
            offset,
            attributes: { exclude: ['password'] }
        });

        const dataWithImageUrl = rows.map(user => {
            const userJson = user.toJSON();
            // for Image
            if (userJson.image) {
                userJson.image = `${process.env.baseUrl}/${userJson.image.replace(/\\/g, '/')}`;
            }
            return userJson
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.status(200).json({
            status: true,
            total: count,
            limit: parseInt(limit),
            page: parseInt(page) || 1,
            totalPages,
            data: dataWithImageUrl
        })

    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || username === "" || !password || password === "") {
        return res.status(400).json({
            status: false,
            message: "username and password are required"
        })
    }

    try {
        const user = await models.user.findOne({
            where: { username, status: "active" },
            attributes: ['password', 'id', 'email', 'role', 'tokenVersion']
        });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user not found"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: false,
                message: "invalid user or password"
            })
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            status: true,
            userId: user.id,
            role: user.role,
            token,
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const register = async (req, res) => {
    let imageUrl;

    const { firstname, lastname, username, email, password, phone } = req.body

    if (req.image) {
        imageUrl = req.image
    }

    if (!firstname || firstname === "" || !lastname || lastname === "" || !username || username === "" || !email || email === "" || !password || password === "") {
        if (imageUrl) {
            deleteFile(imageUrl)
        }
        return res.status(400).json({
            status: false,
            message: "all fields are required"
        })
    }

    try {

        const passwordHash = await bcrypt.hash(password, 10);

        await models.user.create({
            firstname,
            lastname,
            username,
            email,
            password: passwordHash,
            phone,
            ...(imageUrl ? { image: imageUrl } : {}),
            ...(req.imageBase64 ? { placeholder: req.imageBase64 } : {}),
        });
        res.status(200).json({
            status: true,
            message: "user created successfully",
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

const getUserById = async (req, res) => {
    const { userId } = req.params;

    if (!userId || userId === "") {
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    try {
        if (req.user.id != userId) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: You do not have access to this user"
            });
        }


        req.user.image = req.user.image ? `${process.env.baseUrl}/${req.user.image.replace(/\\/g, '/')}` : null;

        res.status(200).json({
            status: true,
            data: req.user
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

const update = async (req, res) => {
    const { userId } = req.params
    const { firstname, lastname, username, email, oldPassword, newPassword, phone } = req.body

    if (!userId || userId === "") {
        if (req?.image) {
            deleteFile(req.image)
        }
        return res.status(400).json({
            status: false,
            message: "userId is required"
        })
    }

    try {
        
        const user = await models.user.findByPk(userId);
        if (!user) {
            if (req?.image) {
                deleteFile(req.image)
            }
            return res.status(404).json({
                status: false,
                message: "user not found"
            })
        }

        if (user.email !== req.user.email) {
            if (req?.image) {
                deleteFile(req.image)
            }
            return res.status(403).json({
                status: false,
                message: "Forbidden: You do not have access to this user"
            });
        }

        if (user.tokenVersion !== req.user.tokenVersion) {
            if (req?.image) {
                deleteFile(req.image)
            }
            return res.status(401).json({ message: 'Token Expired' });
        }

        if (oldPassword && newPassword) {
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                if (req?.image) {
                    deleteFile(req.image)
                }
                return res.status(401).json({
                    status: false,
                    message: "invalid password"
                })
            }
            if (oldPassword === newPassword) {
                if (req?.image) {
                    deleteFile(req.image)
                }
                return res.status(400).json({
                    status: false,
                    message: "new password must be different from old password"
                })
            }
            user.tokenVersion += 1;
            await user.save();
        }

        const newData = {
            firstname,
            lastname,
            username,
            email,
            phone,
            ...(oldPassword && newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
            ...(req.image ? { image: req.image } : {}),
            ...(req.imageBase64 ? { placeholder: req.imageBase64 } : {}),
        }

        if (req.image) {
            deleteFile(user.image)
        }

        await models.user.update(
            newData,
            {
                where: {
                    id: userId,
                },
            }
        );
        res.status(200).json({
            status: true,
            message: "user updated successfully",
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

const deleteUser = async (req, res) => {
    const { userId } = req.params

    try {

        if (req.user.id != userId) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: You do not have access to this user"
            });
        }

        if (req.user?.image) {
            deleteFile(req.user.image)
        }

        await models.user.destroy(
            {
                where: {
                    id: userId,
                },
            }
        );
        res.status(200).json({
            status: true,
            message: "user deleted successfully",
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }
}

module.exports = { all, login, register, getUserById, update, deleteUser }