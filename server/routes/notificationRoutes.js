const express = require("express");
const { body, param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// HR/Manager sends notification or reminder
router.post(
  "/",
  allowRoles("hr", "manager"),
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Notification title is required")
      .isLength({ min: 3, max: 150 })
      .withMessage("Title must be between 3 and 150 characters"),

    body("message")
      .trim()
      .notEmpty()
      .withMessage("Notification message is required")
      .isLength({ min: 3, max: 1000 })
      .withMessage("Message must be between 3 and 1000 characters"),

    body("type")
      .optional()
      .isIn(["general", "task", "document", "training", "offer", "reminder", "progress"])
      .withMessage("Invalid notification type"),

    body("employee_id")
      .optional()
      .isInt()
      .withMessage("Employee ID must be a number"),

    body("send_to_all")
      .optional()
      .isBoolean()
      .withMessage("send_to_all must be true or false"),
  ],
  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        title,
        message,
        type = "general",
        employee_id,
        send_to_all = false,
      } = req.body;

      await client.query("BEGIN");

      if (send_to_all) {
        const usersResult = await client.query(
          `SELECT u.id
           FROM users u
           JOIN employees e ON u.id = e.user_id
           WHERE u.is_active = TRUE`
        );

        if (usersResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            success: false,
            message: "No active employees found.",
          });
        }

        for (const user of usersResult.rows) {
          await client.query(
            `INSERT INTO notifications
             (
              user_id,
              created_by,
              title,
              message,
              type
             )
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, req.user.id, title, message, type]
          );
        }

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          message: "Notification sent to all active employees.",
          sent_count: usersResult.rows.length,
        });
      }

      if (!employee_id) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "employee_id is required when send_to_all is false.",
        });
      }

      const employeeResult = await client.query(
        `SELECT
          e.id,
          e.user_id,
          u.is_active
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [employee_id]
      );

      if (employeeResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      if (!employeeResult.rows[0].is_active) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Cannot send notification to inactive employee.",
        });
      }

      const result = await client.query(
        `INSERT INTO notifications
         (
          user_id,
          created_by,
          title,
          message,
          type
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          employeeResult.rows[0].user_id,
          req.user.id,
          title,
          message,
          type,
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Notification sent successfully.",
        notification: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Send notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while sending notification.",
      });
    } finally {
      client.release();
    }
  }
);

// HR/Manager views all notifications
router.get("/", allowRoles("hr", "manager"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at,

        receiver.id AS receiver_user_id,
        receiver.name AS receiver_name,
        receiver.email AS receiver_email,
        receiver.role AS receiver_role,

        creator.name AS created_by_name,
        creator.email AS created_by_email
       FROM notifications n
       JOIN users receiver ON n.user_id = receiver.id
       LEFT JOIN users creator ON n.created_by = creator.id
       ORDER BY n.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("View notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications.",
    });
  }
});

// User views own notifications
router.get("/my-notifications", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        title,
        message,
        type,
        is_read,
        created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const unreadCount = result.rows.filter(
      (notification) => notification.is_read === false
    ).length;

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      unread_count: unreadCount,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("My notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your notifications.",
    });
  }
});

// User marks one notification as read
router.patch(
  "/:id/read",
  [param("id").isInt().withMessage("Notification ID must be a number")],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        notification: result.rows[0],
      });
    } catch (error) {
      console.error("Mark notification read error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating notification.",
      });
    }
  }
);

// User marks all own notifications as read
router.patch("/read-all", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1
       RETURNING id`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      updated_count: result.rows.length,
    });
  } catch (error) {
    console.error("Read all notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications.",
    });
  }
});

// HR/Manager deletes notification
router.delete(
  "/:id",
  allowRoles("hr", "manager"),
  [param("id").isInt().withMessage("Notification ID must be a number")],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM notifications WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully.",
      });
    } catch (error) {
      console.error("Delete notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while deleting notification.",
      });
    }
  }
);

module.exports = router;