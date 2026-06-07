const express = require("express");
const { body, param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// HR or Manager creates training
router.post(
  "/",
  allowRoles("hr", "manager"),
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Training title is required")
      .isLength({ min: 3, max: 150 })
      .withMessage("Training title must be between 3 and 150 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1500 })
      .withMessage("Description cannot exceed 1500 characters"),

    body("category")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Category cannot exceed 100 characters"),

    body("duration_hours")
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage("Duration must be between 1 and 500 hours"),
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
        title,
        description,
        category,
        duration_hours = 1,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO trainings
         (
          title,
          description,
          category,
          duration_hours,
          created_by,
          is_active
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          title,
          description || null,
          category || null,
          duration_hours,
          req.user.id,
          true,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Training created successfully",
        training: result.rows[0],
      });
    } catch (error) {
      console.error("Create training error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while creating training",
      });
    }
  }
);

// HR or Manager views all trainings
router.get("/", allowRoles("hr", "manager"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.category,
        t.duration_hours,
        t.is_active,
        t.created_at,
        t.updated_at,

        u.name AS created_by_name,
        u.email AS created_by_email
       FROM trainings t
       LEFT JOIN users u ON t.created_by = u.id
       ORDER BY t.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      trainings: result.rows,
    });
  } catch (error) {
    console.error("View trainings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching trainings",
    });
  }
});

// HR or Manager assigns training to employee
router.post(
  "/assign",
  allowRoles("hr", "manager"),
  [
    body("training_id")
      .isInt()
      .withMessage("Training ID must be a number"),

    body("employee_id")
      .isInt()
      .withMessage("Employee ID must be a number"),

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

      const { training_id, employee_id, due_date } = req.body;

      const trainingCheck = await pool.query(
        "SELECT id, is_active FROM trainings WHERE id = $1",
        [training_id]
      );

      if (trainingCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Training not found",
        });
      }

      if (!trainingCheck.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign inactive training",
        });
      }

      const employeeCheck = await pool.query(
        `SELECT
          e.id,
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
          message: "Cannot assign training to inactive employee account",
        });
      }

      const result = await pool.query(
        `INSERT INTO training_assignments
         (
          training_id,
          employee_id,
          assigned_by,
          status,
          progress_percent,
          due_date
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          training_id,
          employee_id,
          req.user.id,
          "assigned",
          0,
          due_date || null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Training assigned successfully",
        assignment: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "This training is already assigned to this employee",
        });
      }

      console.error("Assign training error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while assigning training",
      });
    }
  }
);

// HR or Manager views all training assignments
router.get(
  "/assignments/all",
  allowRoles("hr", "manager"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          ta.id,
          ta.status,
          ta.progress_percent,
          ta.due_date,
          ta.completed_at,
          ta.created_at,
          ta.updated_at,

          t.id AS training_id,
          t.title AS training_title,
          t.category,
          t.duration_hours,

          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,

          employee_user.name AS employee_name,
          employee_user.email AS employee_email,

          assigned_user.name AS assigned_by_name,
          assigned_user.email AS assigned_by_email
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id = t.id
         JOIN employees e ON ta.employee_id = e.id
         JOIN users employee_user ON e.user_id = employee_user.id
         LEFT JOIN users assigned_user ON ta.assigned_by = assigned_user.id
         ORDER BY ta.created_at DESC`
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        assignments: result.rows,
      });
    } catch (error) {
      console.error("View training assignments error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching training assignments",
      });
    }
  }
);

// Employee or Manager views own assigned trainings
router.get(
  "/my-trainings",
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
          ta.id AS assignment_id,
          ta.status,
          ta.progress_percent,
          ta.due_date,
          ta.completed_at,
          ta.created_at,
          ta.updated_at,

          t.id AS training_id,
          t.title,
          t.description,
          t.category,
          t.duration_hours,

          assigned_user.name AS assigned_by_name,
          assigned_user.email AS assigned_by_email
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id = t.id
         LEFT JOIN users assigned_user ON ta.assigned_by = assigned_user.id
         WHERE ta.employee_id = $1
         ORDER BY ta.created_at DESC`,
        [employeeId]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        trainings: result.rows,
      });
    } catch (error) {
      console.error("My trainings error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching your trainings",
      });
    }
  }
);

// Employee, Manager, or HR updates assigned training progress
router.patch(
  "/assignments/:id/progress",
  [
    param("id").isInt().withMessage("Assignment ID must be a number"),

    body("status")
      .isIn(["assigned", "in_progress", "completed"])
      .withMessage("Status must be assigned, in_progress, or completed"),

    body("progress_percent")
      .isInt({ min: 0, max: 100 })
      .withMessage("Progress percent must be between 0 and 100"),
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
      const { status, progress_percent } = req.body;

      const assignmentCheck = await pool.query(
        `SELECT
          ta.id,
          e.user_id AS employee_user_id
         FROM training_assignments ta
         JOIN employees e ON ta.employee_id = e.id
         WHERE ta.id = $1`,
        [id]
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Training assignment not found",
        });
      }

      const assignment = assignmentCheck.rows[0];

      if (
        req.user.role === "employee" &&
        assignment.employee_user_id !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot update this training",
        });
      }

      if (status === "completed" && progress_percent !== 100) {
        return res.status(400).json({
          success: false,
          message: "Completed training must have progress_percent as 100",
        });
      }

      if (progress_percent === 100 && status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "If progress is 100, status must be completed",
        });
      }

      const completedAt = status === "completed" ? "CURRENT_TIMESTAMP" : "NULL";

      const result = await pool.query(
        `UPDATE training_assignments
         SET
          status = $1,
          progress_percent = $2,
          completed_at = ${completedAt},
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, progress_percent, id]
      );

      return res.status(200).json({
        success: true,
        message: "Training progress updated successfully",
        assignment: result.rows[0],
      });
    } catch (error) {
      console.error("Update training progress error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating training progress",
      });
    }
  }
);

// View single training
router.get(
  "/:id",
  allowRoles("hr", "manager"),
  [param("id").isInt().withMessage("Training ID must be a number")],
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
          t.category,
          t.duration_hours,
          t.is_active,
          t.created_at,
          t.updated_at,

          u.name AS created_by_name,
          u.email AS created_by_email
         FROM trainings t
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Training not found",
        });
      }

      return res.status(200).json({
        success: true,
        training: result.rows[0],
      });
    } catch (error) {
      console.error("View single training error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching training",
      });
    }
  }
);

// HR or Manager updates training
router.put(
  "/:id",
  allowRoles("hr", "manager"),
  [
    param("id").isInt().withMessage("Training ID must be a number"),

    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("Training title must be between 3 and 150 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1500 })
      .withMessage("Description cannot exceed 1500 characters"),

    body("category")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Category cannot exceed 100 characters"),

    body("duration_hours")
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage("Duration must be between 1 and 500 hours"),
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
      const { title, description, category, duration_hours } = req.body;

      const result = await pool.query(
        `UPDATE trainings
         SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          duration_hours = COALESCE($4, duration_hours),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          title || null,
          description || null,
          category || null,
          duration_hours || null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Training not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Training updated successfully",
        training: result.rows[0],
      });
    } catch (error) {
      console.error("Update training error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating training",
      });
    }
  }
);

// HR or Manager activates/deactivates training
router.patch(
  "/:id/active",
  allowRoles("hr", "manager"),
  [
    param("id").isInt().withMessage("Training ID must be a number"),

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

      const result = await pool.query(
        `UPDATE trainings
         SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Training not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: is_active
          ? "Training activated successfully"
          : "Training deactivated successfully",
        training: result.rows[0],
      });
    } catch (error) {
      console.error("Training active status error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while updating training status",
      });
    }
  }
);

module.exports = router;    