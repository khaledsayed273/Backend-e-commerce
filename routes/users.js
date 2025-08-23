const express = require('express');
const resizeImage = require("../middleware/resizeImage");
const usersControl = require("../controllers/userControllers");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

router.route("/")
    .get(verifyToken("manager", "admin"), usersControl.all)
    .post(upload.single('image'), resizeImage, convertImageToBase64, usersControl.register);

router.route("/:userId")
    .delete(verifyToken("manager", "admin", "user"), usersControl.deleteUser)
    .get(verifyToken("manager", "admin", "user"), usersControl.getUserById);

router.put("/:userId", verifyToken("manager", "admin", "user"), upload.single('image'), resizeImage, convertImageToBase64, usersControl.update)

router.post("/login", usersControl.login)
module.exports = router