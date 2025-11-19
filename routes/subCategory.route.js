const express = require('express');
const control = require("../controllers/sub_category_controller")
const resizeImage = require("../middleware/resizeImage");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

// All
router.get("/:categorySlug", control.all)

// Create
router.post("/:categorySlug", verifyToken("admin", "maganger"), upload.single('image'), resizeImage, convertImageToBase64, control.create)

// Update
router.put("/:subCategorySlug", verifyToken("admin", "maganger"), upload.single('image'), resizeImage, convertImageToBase64, control.update)

// Delete
router.delete("/:subCategorySlug", verifyToken("admin", "maganger"), control.destroy)

module.exports = router