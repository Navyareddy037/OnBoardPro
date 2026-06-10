const express = require("express");
const router = express.Router();

/*
  GET /api/documents/my-documents
*/
router.get("/my-documents", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Documents fetched successfully",
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
});

module.exports = router;