// middlewares/resizeImages.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const resizeImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) return next();

        const parts = req.originalUrl.split('/');
        const folderName = parts[3] || 'uploads';
        const imageDir = path.join(__dirname, '..', 'uploads', folderName);

        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        req.images = [];

        for (const file of req.files) {
            const originalname = file.originalname.split('.')[0] || file.originalname;
            const fileName = `${req.body.name.trim().toLowerCase()}-${Date.now()}-${originalname}.webp`;
            const imagePath = path.join(imageDir, fileName);

            await sharp(file.buffer)
                .resize(300, 300)
                .toFormat('webp')
                .toFile(imagePath);

            req.images.push(path.join('uploads', folderName, fileName));
        }

        next();
    } catch (error) {
        console.error("❌ Resize Image Error:", error.message);
        return res.status(500).json({ status: false, message: "Error resizing image", error: error.message });
    }
};


module.exports = resizeImages;
