const express = require('express');
const productsController = require("../controllers/productController");
const multer = require('multer');
const convertImagesToBase64 = require('../middleware/convertImagesToBase64');
const resizeImages = require('../middleware/resizeImages');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/")
    .get(productsController.all)
    .post(verifyToken("admin", "maganger"), upload.array('images', 10), resizeImages, convertImagesToBase64, productsController.addNew);

router.get("/:slug", productsController.getOneBySlug)
router.put("/:slug", verifyToken("admin", "maganger"), upload.array('images', 10), resizeImages, convertImagesToBase64, productsController.updateProduct)
router.get("/types/all", productsController.getTypes)
router.delete("/:slug", verifyToken("admin", "maganger"), productsController.deleteProduct)


module.exports = router