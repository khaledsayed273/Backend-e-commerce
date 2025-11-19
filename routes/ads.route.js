const express = require('express');
const controller = require("../controllers/adsController");
const multer = require('multer');
const convertImagesToBase64 = require('../middleware/convertImagesToBase64');
const resizeImages = require('../middleware/resizeImages');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Select
router.get("/", controller.select)

// Create And Update
router.post("/", verifyToken("admin", "maganger"), upload.array('images', 10), resizeImages, convertImagesToBase64, controller.create)

// Delete
router.delete("/", verifyToken("admin", "maganger"), controller.destroy)

module.exports = router