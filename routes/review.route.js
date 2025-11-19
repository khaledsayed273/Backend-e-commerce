const express = require('express');
const controller = require("../controllers/reviewController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// All
router.get("/:productId", controller.all)

// Create
router.post("/:productId/:userId", verifyToken("admin", "maganger", "user"), controller.create)

// Update
router.put("/:userId/:reviewId", verifyToken("admin", "maganger", "user"), controller.update)

// Delete
router.delete("/:userId/:reviewId", verifyToken("admin", "maganger", "user"), controller.destroy)

module.exports = router