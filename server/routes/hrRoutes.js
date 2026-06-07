const express = require("express");
const bcrypt = require("bcryptjs");
const { body, param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All HR routes are protected and HR-only
router.use(protect);
router.use(allowRoles("hr"));

// Add new employee or manager
router.post(
  "/employees",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain one special character"),

    body("role")
      .optional()
      .isIn(["manager", "employee"])
      .withMessage("Role must be manager or employee"),

    body("employee_code")
      .trim()
      .notEmpty()
      .withMessage("Employee code is required"),

    body("department")
      .trim()
      .notEmpty()
      .withMessage("Department is required"),

    body("designation")
      .trim()
      .notEmpty()
      .withMessage("Designation is required"),

    body("phone")
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be between 10 and 15 characters"),

    body("joining_date")
      .optional()
      .isISO8601()
      .withMessage("Joining date must be a valid date"),
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
        name,
        email,
        password,
        role = "employee",
        employee_code,
        department,
        designation,
        phone,
        joining_date,
      } = req.body;

      await client.query("BEGIN");

      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const existingEmployeeCode = await client.query(
        "SELECT id FROM employees WHERE employee_code = $1",
        [employee_code]
      );

      if (existingEmployeeCode.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "Employee code already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, is_active, created_at`,
        [name, email, passwordHash, role]
      );

      const user = userResult.rows[0];

      const employeeResult = await client.query(
        `INSERT INTO employees 
         (user_id, employee_code, department, designation, phone, joining_date, onboarding_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user.id,
          employee_code,
          department,
          designation,
          phone || null,
          joining_date || null,
          "pending",
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Employee added successfully",
        user,
        employee: employeeResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Add employee error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while adding employee",
      });
    } finally {
      client.release();
    }
  }
);

// View all employees
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,
        e.phone,
        e.joining_date,
        e.onboarding_status,
        e.created_at,
        u.id AS user_id,
        u.name,
        u.email,
        u.role,
        u.is_active
       FROM employees e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.id DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      employees: result.rows,
    });
  } catch (error) {
    console.error("View employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching employees",
    });
  }
});

// View single employee
router.get(
  "/employees/:id",
  [param("id").isInt().withMessage("Employee ID must be a number")],
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
        `SELECT 
          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,
          e.phone,
          e.joining_date,
          e.onboarding_status,
          e.created_at,
          u.id AS user_id,
          u.name,
          u.email,
          u.role,
          u.is_active
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      return res.status(200).json({
        success: true,
        employee: result.rows[0],
      });
    } catch (error) {
      console.error("View single employee error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching employee",
      });
    }
  }
);

// Update employee details
router.put(
  "/employees/:id",
  [
    param("id").isInt().withMessage("Employee ID must be a number"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),

    body("department")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Department cannot be empty"),

    body("designation")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Designation cannot be empty"),

    body("phone")
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be between 10 and 15 characters"),

    body("joining_date")
      .optional()
      .isISO8601()
      .withMessage("Joining date must be a valid date"),
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

      const { id } = req.params;
      const { name, department, designation, phone, joining_date } = req.body;

      await client.query("BEGIN");

      const employeeCheck = await client.query(
        `SELECT e.id, e.user_id
         FROM employees e
         WHERE e.id = $1`,
        [id]
      );

      if (employeeCheck.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const userId = employeeCheck.rows[0].user_id;

      if (name) {
        await client.query(
          "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [name, userId]
        );
      }

      const updatedEmployee = await client.query(
        `UPDATE employees
         SET 
          department = COALESCE($1, department),
          designation = COALESCE($2, designation),
          phone = COALESCE($3, phone),
          joining_date = COALESCE($4, joining_date)
         WHERE id = $5
         RETURNING *`,
        [
          department || null,
          designation || null,
          phone || null,
          joining_date || null,
          id,
        ]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        employee: updatedEmployee.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Update employee error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating employee",
      });
    } finally {
      client.release();
    }
  }
);

// Update onboarding status
router.patch(
  "/employees/:id/status",
  [
    param("id").isInt().withMessage("Employee ID must be a number"),

    body("onboarding_status")
      .isIn(["pending", "in_progress", "completed"])
      .withMessage("Status must be pending, in_progress, or completed"),
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

      const { id } = req.params;
      const { onboarding_status } = req.body;

      const result = await pool.query(
        `UPDATE employees
         SET onboarding_status = $1
         WHERE id = $2
         RETURNING *`,
        [onboarding_status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Onboarding status updated successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      console.error("Update status error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating onboarding status",
      });
    }
  }
);

// Activate or deactivate employee account
router.patch(
  "/employees/:id/account-status",
  [
    param("id").isInt().withMessage("Employee ID must be a number"),

    body("is_active")
      .isBoolean()
      .withMessage("is_active must be true or false"),
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

      const { id } = req.params;
      const { is_active } = req.body;

      const employeeCheck = await pool.query(
        "SELECT user_id FROM employees WHERE id = $1",
        [id]
      );

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const userId = employeeCheck.rows[0].user_id;

      const result = await pool.query(
        `UPDATE users
         SET is_active = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, email, role, is_active`,
        [is_active, userId]
      );

      return res.status(200).json({
        success: true,
        message: is_active
          ? "Employee account activated successfully"
          : "Employee account deactivated successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Account status error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating account status",
      });
    }
  }
);

module.exports = router;