// middlewares/convertImagesToBase64.js
const fs = require("fs");
const { Worker } = require("worker_threads");

const convertImagesToBase64 = async (req, res, next) => {
    try {
        if (!req.images || req.images.length === 0) {
            return next();
        }

        req.imageBase64List = [];

        for (const imagePath of req.images) {
            const fileBuffer = fs.readFileSync(imagePath);

            const base64 = await new Promise((resolve, reject) => {
                const worker = new Worker("./workers/ImageWorker.js");
                worker.postMessage(fileBuffer);

                worker.on("message", resolve);
                worker.on("error", reject);
            });

            req.imageBase64List.push(base64);
        }

        next();
    } catch (error) {
        console.error("❌ Image to base64 Error:", error.message);
        return res.status(500).json({ status: false, message: "Image conversion failed", error: error.message });
    }
};


module.exports = convertImagesToBase64;
