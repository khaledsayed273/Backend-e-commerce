const express = require('express');
const controller = require("../controllers/productController");
const multer = require('multer');
const convertImagesToBase64 = require('../middleware/convertImagesToBase64');
const resizeImages = require('../middleware/resizeImages');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All
router.get("/", controller.all)

// Create
router.post("/", verifyToken("admin", "maganger"), upload.array('images', 10), resizeImages, convertImagesToBase64, controller.create)

// Select
router.get("/:slug", controller.select)

// Update
router.put("/:slug", verifyToken("admin", "maganger"), upload.array('images', 10), resizeImages, convertImagesToBase64, controller.update)

// Delete
router.delete("/:slug", verifyToken("admin", "maganger"), controller.destroy)

module.exports = router