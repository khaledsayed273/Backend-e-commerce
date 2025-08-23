const { parentPort } = require("worker_threads");
const sharp = require("sharp");

const generateLowQualityBase64 = async (imageBuffer) => {
    try {
        const base64Image = await sharp(imageBuffer)
            .resize({ width: 20 })
            .blur(5)
            .webp({ quality: 5 }) 
            .toBuffer()
            .then((data) => `data:image/webp;base64,${data.toString("base64")}`);

        return base64Image;
    } catch (error) {
        console.error("Error processing image:", error);
        return null;
    }
};

// 🔹 استقبال الصورة من `Worker` ومعالجتها
parentPort.on("message", async (imageBuffer) => {
    const base64Image = await generateLowQualityBase64(imageBuffer);
    parentPort.postMessage(base64Image);
});
