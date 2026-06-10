const express = require("express");
const router = express.Router();

/*
  GET /api/offers/my-offers
  GET /api/offer-letters/my-offers
*/
router.get("/my-offers", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Offer letters fetched successfully",
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch offer letters",
    });
  }
});

module.exports = router;