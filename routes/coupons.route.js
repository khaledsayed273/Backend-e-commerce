const express = require('express');
const controller = require("../controllers/couponController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// All 
router.get("/", verifyToken("admin", "maganger"), controller.all)

// Create
router.post("/", verifyToken("admin", "maganger"), controller.create)

// Update
router.put("/:id", verifyToken("admin", "maganger"), controller.update)

// Delete
router.delete("/:id", verifyToken("admin", "maganger"), controller.destroy)

module.exports = router