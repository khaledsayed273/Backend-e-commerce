const express = require('express');
const categoriesControl = require("../controllers/categoriesController")
const router = express.Router();

router.route("/")
.get(categoriesControl.all)
.post(categoriesControl.addNew)
router.put("/:categoryId", categoriesControl.update)
router.delete("/:categoryId", categoriesControl.deleteCategory)

module.exports = router