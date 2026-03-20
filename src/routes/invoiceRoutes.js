const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const societyMiddleware = require("../middleware/societyMiddleware");
const { getMyInvoices } = require("../controllers/invoiceController");

router.get("/", auth, societyMiddleware, getMyInvoices);

module.exports = router;