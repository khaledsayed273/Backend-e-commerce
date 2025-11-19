const express = require('express');
const controller = require("../controllers/settingController");
const multer = require('multer');
const verifyToken = require('../middleware/verifyToken');
const resizeLogo = require('../middleware/resizeLogo');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

// All
router.get("/" , controller.all)

// Create And Update
router.post("/" , verifyToken("manager", "admin"), upload.single('logo'), resizeLogo, convertImageToBase64, controller.save)

module.exports = router