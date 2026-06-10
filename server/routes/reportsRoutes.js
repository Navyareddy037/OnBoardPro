const express = require("express");
const router = express.Router();

/*
  GET /api/reports/my-dashboard
*/
router.get("/my-dashboard", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Dashboard report fetched successfully",
      data: {
        overallProgress: 0,
        documentsApproved: "0/0",
        tasksCompleted: "0/0",
        trainingProgress: 0,
        offerLetters: 0,
        unreadNotifications: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard report",
    });
  }
});

module.exports = router;