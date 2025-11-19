const express = require('express');
const resizeImage = require("../middleware/resizeImage");
const controller = require("../controllers/userControllers");
const multer = require('multer');
const convertImageToBase64 = require('../middleware/convertImageToBase64');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer(storage);

// All
router.get("/", verifyToken("manager", "admin"), controller.all)

// Register
router.post("/", upload.single('image'), resizeImage, convertImageToBase64, controller.register)

// Login
router.post("/login", controller.login)

// Refresh
router.post("/refresh", controller.refresh)

// Select
router.get("/:userId", verifyToken("manager", "admin", "user"), controller.select)

// Update
router.put("/:userId", verifyToken("manager", "admin", "user"), upload.single('image'), resizeImage, convertImageToBase64, controller.update)

// Delete
router.delete("/:userId", verifyToken("manager", "admin"), controller.destroy)

module.exports = router