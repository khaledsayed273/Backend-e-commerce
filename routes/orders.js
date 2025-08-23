const express = require('express');
const orderControl = require("../controllers/orderController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();


router.route("/")
    .get(verifyToken("admin", "maganger", "user"), orderControl.all)

router.post("/preview", verifyToken("admin", "maganger", "user"), orderControl.previewOrder)
router.post("/confirm", verifyToken("admin", "maganger", "user"), orderControl.confirmOrder)
router.delete("/:orderId", verifyToken("admin", "maganger"), orderControl.deleteOrder)
router.put("/:orderId", verifyToken("admin", "maganger", "user"), orderControl.updateOrderStatus)

module.exports = router