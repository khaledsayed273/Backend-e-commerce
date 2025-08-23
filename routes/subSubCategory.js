const express = require('express');
const resizeImage = require("../middleware/resizeImage");
const subSubCategoryControl = require("../controllers/subSubCategoryController");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

router.route("/:sub_category")
    .get(subSubCategoryControl.all)
    .post(upload.single('image'), resizeImage, convertImageToBase64, subSubCategoryControl.addNew);

router.put("/:subSubCategoryId", upload.single('image'), resizeImage, convertImageToBase64, subSubCategoryControl.update)
router.delete("/:subSubCategoryId", subSubCategoryControl.deleteSubSubCategory)

module.exports = router