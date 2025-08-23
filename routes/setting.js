const express = require('express');
const settingControl = require("../controllers/settingController");
const multer = require('multer');
const verifyToken = require('../middleware/verifyToken');
const resizeLogo = require('../middleware/resizeLogo');
const convertLogoToBase64 = require('../middleware/convertLogoToBase64');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

router.route("/")
    .get(settingControl.all)
    .post(verifyToken("manager", "admin"), upload.single('logo'), resizeLogo, convertLogoToBase64, settingControl.save);
module.exports = router