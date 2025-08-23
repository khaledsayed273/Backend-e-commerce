const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const resizeLogo = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const imageDir = path.join(__dirname, '..', 'uploads', "setting");

        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        let originalname = req.file.originalname.split('.')[0] || req.file.originalname;

        const fileName = `logo-${Date.now()}-${originalname}.webp`;
        const imagePath = path.join(imageDir, fileName);

        // تصغير وتحويل الصورة
        await sharp(req.file.buffer)
            .resize(600, 600, {
                fit: 'inside',
                withoutEnlargement: true 
            })
            .toFormat('webp')
            .toFile(imagePath);

        req.logo = path.join('uploads', "setting", fileName);

        next();
    } catch (error) {
        console.error("❌ Resize Image Error:", error.message);
        return res.status(500).json({ status: "fail", message: "Error resizing image", error: error.message });
    }
};


module.exports = resizeLogo