const express = require('express');
const couponControl = require("../controllers/couponController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();


router.route("/")
    .get(verifyToken("admin", "maganger"), couponControl.all)
    .post(verifyToken("admin", "maganger"), couponControl.add)

router.delete("/:couponId", verifyToken("admin", "maganger"), couponControl.deleteCoupon)
router.put("/:couponId", verifyToken("admin", "maganger"), couponControl.update)

module.exports = router