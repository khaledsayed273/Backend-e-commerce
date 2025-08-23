const express = require('express');
const subCategoryControl = require("../controllers/subCategoryController")
const resizeImage = require("../middleware/resizeImage");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

router.route("/:category")
    .get(subCategoryControl.all)
    .post(upload.single('image'), resizeImage, convertImageToBase64, subCategoryControl.addNew);

router.put("/:subCategoryId", upload.single('image'), resizeImage, convertImageToBase64, subCategoryControl.update)
router.delete("/:subCategoryId", subCategoryControl.deleteSubCategory)

module.exports = router