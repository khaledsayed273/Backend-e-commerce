const express = require('express');
const controller = require("../controllers/currencyController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// All
router.get(("/"),controller.all)

// Create And Update
router.post("/" ,verifyToken("admin", "maganger"), controller.create)

// Delete
router.delete("/", verifyToken("admin", "maganger"), controller.destroy)

module.exports = router