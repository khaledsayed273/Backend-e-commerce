const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function downloadImage(imageUrl, fileName, folder) {
    const folderPath = path.resolve(__dirname, "..", folder);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const filePath = path.resolve(folderPath, fileName);
    const resizedFilePath = filePath.replace(/\.\w+$/, ".webp"); 

    // لو الصورة موجودة مسبقاً بعد التحويل، نرجع المسار مباشرة
    if (fs.existsSync(resizedFilePath)) {
        return path.posix.join(folder, path.basename(resizedFilePath));
    }

    // تحميل الصورة
    const response = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data, "binary");

    // تحويل وتقليل الأبعاد باستخدام sharp
    await sharp(buffer)
        .resize(300, 300) // الحجم المطلوب
        .toFormat("webp", { quality: 60 }) // تحويل إلى webp مع جودة أقل
        .toFile(resizedFilePath);

    return path.posix.join(folder, path.basename(resizedFilePath));
}

module.exports = downloadImage;
