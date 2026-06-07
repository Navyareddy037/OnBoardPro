const express = require("express");
const { body, param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// HR or Manager assigns task to employee
router.post(
  "/",
  allowRoles("hr", "manager"),
  [
    body("employee_id")
      .isInt()
      .withMessage("Employee ID must be a number"),

    body("title")
      .trim()
      .notEmpty()
      .withMessage("Task title is required")
      .isLength({ min: 3, max: 150 })
      .withMessage("Task title must be between 3 and 150 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),

    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Priority must be low, medium, or high"),

    body("due_date")
      .optional()
      .isISO8601()
      .withMessage("Due date must be a valid date"),
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

      const {
        employee_id,
        title,
        description,
        priority = "medium",
        due_date,
      } = req.body;

      const employeeCheck = await pool.query(
        `SELECT 
          e.id,
          u.name,
          u.email,
          u.is_active
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [employee_id]
      );

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      if (!employeeCheck.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign task to inactive employee account",
        });
      }

      const result = await pool.query(
        `INSERT INTO tasks
         (
          employee_id,
          assigned_by,
          title,
          description,
          priority,
          status,
          due_date
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          employee_id,
          req.user.id,
          title,
          description || null,
          priority,
          "pending",
          due_date || null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Task assigned successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Assign task error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while assigning task",
      });
    }
  }
);

// HR or Manager views all tasks
router.get("/", allowRoles("hr", "manager"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.completed_at,
        t.created_at,
        t.updated_at,

        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,

        employee_user.name AS employee_name,
        employee_user.email AS employee_email,

        assigned_user.name AS assigned_by_name,
        assigned_user.email AS assigned_by_email
       FROM tasks t
       JOIN employees e ON t.employee_id = e.id
       JOIN users employee_user ON e.user_id = employee_user.id
       LEFT JOIN users assigned_user ON t.assigned_by = assigned_user.id
       ORDER BY t.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      tasks: result.rows,
    });
  } catch (error) {
    console.error("View all tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching tasks",
    });
  }
});

// Employee or Manager views own tasks
router.get(
  "/my-tasks",
  allowRoles("employee", "manager"),
  async (req, res) => {
    try {
      const employeeResult = await pool.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id]
      );

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee record not found",
        });
      }

      const employeeId = employeeResult.rows[0].id;

      const result = await pool.query(
        `SELECT
          t.id,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.due_date,
          t.completed_at,
          t.created_at,
          t.updated_at,

          assigned_user.name AS assigned_by_name,
          assigned_user.email AS assigned_by_email
         FROM tasks t
         LEFT JOIN users assigned_user ON t.assigned_by = assigned_user.id
         WHERE t.employee_id = $1
         ORDER BY t.created_at DESC`,
        [employeeId]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        tasks: result.rows,
      });
    } catch (error) {
      console.error("View my tasks error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching your tasks",
      });
    }
  }
);

// View single task
router.get(
  "/:id",
  [param("id").isInt().withMessage("Task ID must be a number")],
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
          t.id,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.due_date,
          t.completed_at,
          t.created_at,
          t.updated_at,

          e.id AS employee_id,
          e.employee_code,
          e.user_id AS employee_user_id,

          employee_user.name AS employee_name,
          employee_user.email AS employee_email,

          assigned_user.name AS assigned_by_name,
          assigned_user.email AS assigned_by_email
         FROM tasks t
         JOIN employees e ON t.employee_id = e.id
         JOIN users employee_user ON e.user_id = employee_user.id
         LEFT JOIN users assigned_user ON t.assigned_by = assigned_user.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const task = result.rows[0];

      if (
        req.user.role === "employee" &&
        task.employee_user_id !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot view this task",
        });
      }

      return res.status(200).json({
        success: true,
        task,
      });
    } catch (error) {
      console.error("View single task error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching task",
      });
    }
  }
);

// HR or Manager updates task details
router.put(
  "/:id",
  allowRoles("hr", "manager"),
  [
    param("id").isInt().withMessage("Task ID must be a number"),

    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("Task title must be between 3 and 150 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),

    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Priority must be low, medium, or high"),

    body("due_date")
      .optional()
      .isISO8601()
      .withMessage("Due date must be a valid date"),
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
      const { title, description, priority, due_date } = req.body;

      const result = await pool.query(
        `UPDATE tasks
         SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          priority = COALESCE($3, priority),
          due_date = COALESCE($4, due_date),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          title || null,
          description || null,
          priority || null,
          due_date || null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Update task error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating task",
      });
    }
  }
);

// Employee, Manager, or HR updates task status
router.patch(
  "/:id/status",
  [
    param("id").isInt().withMessage("Task ID must be a number"),

    body("status")
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
      const { status } = req.body;

      const taskCheck = await pool.query(
        `SELECT 
          t.id,
          e.user_id AS employee_user_id
         FROM tasks t
         JOIN employees e ON t.employee_id = e.id
         WHERE t.id = $1`,
        [id]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const task = taskCheck.rows[0];

      if (
        req.user.role === "employee" &&
        task.employee_user_id !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot update this task",
        });
      }

      const completedAt = status === "completed" ? "CURRENT_TIMESTAMP" : "NULL";

      const result = await pool.query(
        `UPDATE tasks
         SET
          status = $1,
          completed_at = ${completedAt},
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      return res.status(200).json({
        success: true,
        message: "Task status updated successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Update task status error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating task status",
      });
    }
  }
);

// HR or Manager deletes task
router.delete(
  "/:id",
  allowRoles("hr", "manager"),
  [param("id").isInt().withMessage("Task ID must be a number")],
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
        "DELETE FROM tasks WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Delete task error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while deleting task",
      });
    }
  }
);

module.exports = router;