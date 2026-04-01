const express = require("express");
const router = express.Router();
const testCaseController = require("../controllers/testCaseController");

// ✅ Public route (NO AUTH)
router.get("/:questionId", testCaseController.getByQuestion);

module.exports = router;