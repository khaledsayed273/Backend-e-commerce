const fs = require("fs");
const { Worker } = require("worker_threads");

const convertImageToBase64 = async (req, res, next) => {
  try {

    const imageUrl = req.image;

    if (!imageUrl) return next();

    const base64 = await new Promise((resolve, reject) => {
      fs.readFile(imageUrl, (err, fileBuffer) => {
        if (err) return reject(err);

        const worker = new Worker("./workers/ImageWorker.js");

        worker.postMessage(fileBuffer);

        worker.on("message", (base64Image) => resolve(base64Image));
        worker.on("error", (error) => reject(error));
      });
    });

    req.imageBase64 = base64; // ضفها للـ req لاستخدامها لاحقاً
    next();
  } catch (error) {
    console.error("❌ Image to base64 Error:", error.message);
    return res.status(500).json({ status: false, message: "Image conversion failed", error: error.message });
  }
};

module.exports = convertImageToBase64;
