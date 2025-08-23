const sharp = require("sharp");
const fs = require("fs").promises;

module.exports = async function convertToTinyBase64(imagePath) {
    try {
        const fileBuffer = await fs.readFile(imagePath);

        const tinyImageBuffer = await sharp(fileBuffer)
            .resize({ width: 10 })
            .blur(10)
            .webp({ quality: 5 })
            .toBuffer();

        return `data:image/webp;base64,${tinyImageBuffer.toString("base64")}`;
    } catch (error) {
        console.error("❌ Failed to convert image to tiny base64:", error.message);
        return null;
    }
};
