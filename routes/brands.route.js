const express = require('express');
const resizeImage = require("../middleware/resizeImage");
const controller = require("../controllers/brandController");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

// All
router.get("/", controller.all)

// Create
router.post("/", verifyToken("admin", "maganger"), upload.single('image'), resizeImage, convertImageToBase64, controller.create)

// Update
router.put("/:id", verifyToken("admin", "maganger"), upload.single('image'), resizeImage, convertImageToBase64, controller.update)

// Delete
router.delete("/:id", verifyToken("admin", "maganger"), controller.destroy)

module.exports = router