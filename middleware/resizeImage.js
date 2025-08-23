const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const resizeImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const parts = req.originalUrl.split('/');

    const folderName = parts[3] || 'uploads';

    const imageDir = path.join(__dirname, '..', 'uploads', folderName);

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // اسم الملف
    let originalname = req.file.originalname.split('.')[0] || req.file.originalname;

    let baseName = ''


    if (req.body.name) {
      baseName = req.body.name.trim().toLowerCase();
    } else {
      let firstname = req.body.firstname?.trim().toLowerCase();
      let lastname = req.body.lastname?.trim().toLowerCase();

      if (!firstname || !lastname) {

        if (req.params.userId) {
          const user = await require('../models').user.findByPk(req.params.userId);
          if (user) {
            if (!firstname && user.firstname) firstname = user.firstname.trim().toLowerCase();
            if (!lastname && user.lastname) lastname = user.lastname.trim().toLowerCase();
          }

        }
      }
      baseName = `${firstname || ''}-${lastname || ''}`.replace(/^-|-$/g, '');
    }



    const fileName = `${baseName}-${Date.now()}-${originalname}.webp`;
    // المسار الكامل للصورة
    const imagePath = path.join(imageDir, fileName);

    // تصغير وتحويل الصورة
    await sharp(req.file.buffer)
      .resize(300, 300)
      .toFormat('webp')
      .toFile(imagePath);

    // حفظ المسار النسبي للصورة في req.image
    req.image = path.join('uploads', folderName, fileName);

    next();
  } catch (error) {
    console.error("❌ Resize Image Error:", error.message);
    return res.status(500).json({ status: "fail", message: "Error resizing image", error: error.message });
  }
};


module.exports = resizeImage