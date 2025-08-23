const express = require('express');
const resizeImage = require("../middleware/resizeImage");
const brandsControl = require("../controllers/brandController");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

router.route("/")
    .get(brandsControl.all)
    .post(upload.single('image'), resizeImage, convertImageToBase64, brandsControl.addNew);
router.put("/:brandId", upload.single('image'), resizeImage, convertImageToBase64, brandsControl.update)
router.delete("/:brandId", brandsControl.deleteBrand)
module.exports = router