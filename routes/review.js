const express = require('express');
const reviewControl = require("../controllers/reviewController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.get("/:productId", verifyToken("admin", "maganger", "user"), reviewControl.all)
router.post("/:productId/:userId", verifyToken("admin", "maganger", "user"), reviewControl.add)
router.delete("/:userId/:reviewId", verifyToken("admin", "maganger", "user"), reviewControl.deleteReview)
router.put("/:userId/:reviewId", verifyToken("admin", "maganger", "user"), reviewControl.update)

module.exports = router