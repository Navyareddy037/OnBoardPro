const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Employee portal can be accessed by employee, manager, and hr
router.use(protect);
router.use(allowRoles("employee", "manager", "hr"));

// View own profile
router.get("/profile", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id AS user_id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at AS account_created_at,
        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,
        e.phone,
        e.joining_date,
        e.onboarding_status
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("View profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});

// Update own profile
router.put(
  "/profile",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),

    body("phone")
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be between 10 and 15 characters"),
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

      const { name, phone } = req.body;

      await client.query("BEGIN");

      if (name) {
        await client.query(
          `UPDATE users 
           SET name = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [name, req.user.id]
        );
      }

      if (phone) {
        const employeeCheck = await client.query(
          "SELECT id FROM employees WHERE user_id = $1",
          [req.user.id]
        );

        if (employeeCheck.rows.length > 0) {
          await client.query(
            `UPDATE employees 
             SET phone = $1 
             WHERE user_id = $2`,
            [phone, req.user.id]
          );
        }
      }

      const updatedProfile = await client.query(
        `SELECT 
          u.id AS user_id,
          u.name,
          u.email,
          u.role,
          u.is_active,
          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,
          e.phone,
          e.joining_date,
          e.onboarding_status
         FROM users u
         LEFT JOIN employees e ON u.id = e.user_id
         WHERE u.id = $1`,
        [req.user.id]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        profile: updatedProfile.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Update profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating profile",
      });
    } finally {
      client.release();
    }
  }
);

// Change own password
router.patch(
  "/change-password",
  [
    body("current_password")
      .notEmpty()
      .withMessage("Current password is required"),

    body("new_password")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("New password must contain one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("New password must contain one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("New password must contain one special character"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { current_password, new_password } = req.body;

      const userResult = await pool.query(
        "SELECT id, password_hash FROM users WHERE id = $1",
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userResult.rows[0];

      const isCurrentPasswordCorrect = await bcrypt.compare(
        current_password,
        user.password_hash
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const isSamePassword = await bcrypt.compare(
        new_password,
        user.password_hash
      );

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "New password cannot be same as old password",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(new_password, salt);

      await pool.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [newPasswordHash, req.user.id]
      );

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while changing password",
      });
    }
  }
);

// View own onboarding status
router.get("/onboarding-status", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.employee_code,
        e.department,
        e.designation,
        e.joining_date,
        e.onboarding_status
       FROM employees e
       WHERE e.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    return res.status(200).json({
      success: true,
      onboarding: result.rows[0],
    });
  } catch (error) {
    console.error("Onboarding status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching onboarding status",
    });
  }
});

module.exports = router;