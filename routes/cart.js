const express = require('express');
const cartsControl = require("../controllers/CartController");
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();


router.route("/:userId")
    .delete(verifyToken("user"), cartsControl.deleteCarts)
    .get(verifyToken("user"), cartsControl.carts)
    .post(verifyToken("user"), cartsControl.add)
    .put(verifyToken("user"), cartsControl.update)

router.delete("/:userId/:cartItemId", verifyToken("user"), cartsControl.deleteOneCart)

module.exports = router