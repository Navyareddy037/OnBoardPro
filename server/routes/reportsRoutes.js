const express = require("express");
const { param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

const toNumber = (value) => {
  return Number(value || 0);
};

const calculatePercentage = (completed, total) => {
  const completedNumber = toNumber(completed);
  const totalNumber = toNumber(total);

  if (totalNumber === 0) {
    return 0;
  }

  return Math.round((completedNumber / totalNumber) * 100);
};

const calculateOverallProgress = (employee) => {
  const progressParts = [];

  const totalDocuments = toNumber(employee.total_documents);
  const approvedDocuments = toNumber(employee.approved_documents);

  const totalTasks = toNumber(employee.total_tasks);
  const completedTasks = toNumber(employee.completed_tasks);

  const totalTrainings = toNumber(employee.total_trainings);
  const avgTrainingProgress = toNumber(employee.avg_training_progress);

  if (totalDocuments > 0) {
    progressParts.push(calculatePercentage(approvedDocuments, totalDocuments));
  }

  if (totalTasks > 0) {
    progressParts.push(calculatePercentage(completedTasks, totalTasks));
  }

  if (totalTrainings > 0) {
    progressParts.push(avgTrainingProgress);
  }

  if (progressParts.length === 0) {
    if (employee.onboarding_status === "completed") {
      return 100;
    }

    if (employee.onboarding_status === "in_progress") {
      return 50;
    }

    return 0;
  }

  const totalProgress = progressParts.reduce((sum, value) => sum + value, 0);

  return Math.round(totalProgress / progressParts.length);
};

// HR/Manager dashboard summary
router.get("/dashboard", allowRoles("hr", "manager"), async (req, res) => {
  try {
    const employeeSummary = await pool.query(
      `SELECT
        COUNT(*)::int AS total_employees,
        COUNT(*) FILTER (WHERE u.is_active = TRUE)::int AS active_accounts,
        COUNT(*) FILTER (WHERE u.is_active = FALSE)::int AS inactive_accounts,
        COUNT(*) FILTER (WHERE e.onboarding_status = 'pending')::int AS pending_onboarding,
        COUNT(*) FILTER (WHERE e.onboarding_status = 'in_progress')::int AS in_progress_onboarding,
        COUNT(*) FILTER (WHERE e.onboarding_status = 'completed')::int AS completed_onboarding
       FROM employees e
       JOIN users u ON e.user_id = u.id`
    );

    const documentSummary = await pool.query(
      `SELECT
        COUNT(*)::int AS total_documents,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_documents,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_documents,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected_documents
       FROM documents`
    );

    const taskSummary = await pool.query(
      `SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
        COUNT(*) FILTER (
          WHERE due_date < CURRENT_DATE AND status != 'completed'
        )::int AS overdue_tasks
       FROM tasks`
    );

    const trainingSummary = await pool.query(
      `SELECT
        COUNT(*)::int AS total_training_assignments,
        COUNT(*) FILTER (WHERE status = 'assigned')::int AS assigned_trainings,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_trainings,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_trainings,
        COALESCE(ROUND(AVG(progress_percent)), 0)::int AS average_training_progress
       FROM training_assignments`
    );

    const recentEmployees = await pool.query(
      `SELECT
        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,
        e.joining_date,
        e.onboarding_status,
        e.created_at,

        u.name,
        u.email,
        u.role,
        u.is_active
       FROM employees e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC
       LIMIT 5`
    );

    const recentDocuments = await pool.query(
      `SELECT
        d.id,
        d.document_type,
        d.original_name,
        d.status,
        d.uploaded_at,

        e.employee_code,
        u.name AS employee_name,
        u.email AS employee_email
       FROM documents d
       JOIN employees e ON d.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ORDER BY d.uploaded_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      dashboard: {
        employees: employeeSummary.rows[0],
        documents: documentSummary.rows[0],
        tasks: taskSummary.rows[0],
        trainings: trainingSummary.rows[0],
        recent_employees: recentEmployees.rows,
        recent_documents: recentDocuments.rows,
      },
    });
  } catch (error) {
    console.error("Dashboard report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard report",
    });
  }
});

// HR/Manager onboarding progress report
router.get(
  "/onboarding-progress",
  allowRoles("hr", "manager"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,
          e.joining_date,
          e.onboarding_status,
          e.created_at,

          u.name,
          u.email,
          u.role,
          u.is_active,

          COALESCE(doc_stats.total_documents, 0)::int AS total_documents,
          COALESCE(doc_stats.approved_documents, 0)::int AS approved_documents,
          COALESCE(doc_stats.pending_documents, 0)::int AS pending_documents,
          COALESCE(doc_stats.rejected_documents, 0)::int AS rejected_documents,

          COALESCE(task_stats.total_tasks, 0)::int AS total_tasks,
          COALESCE(task_stats.completed_tasks, 0)::int AS completed_tasks,
          COALESCE(task_stats.pending_tasks, 0)::int AS pending_tasks,
          COALESCE(task_stats.in_progress_tasks, 0)::int AS in_progress_tasks,

          COALESCE(training_stats.total_trainings, 0)::int AS total_trainings,
          COALESCE(training_stats.completed_trainings, 0)::int AS completed_trainings,
          COALESCE(training_stats.avg_training_progress, 0)::int AS avg_training_progress

         FROM employees e
         JOIN users u ON e.user_id = u.id

         LEFT JOIN (
          SELECT
            employee_id,
            COUNT(*)::int AS total_documents,
            COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_documents,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_documents,
            COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected_documents
          FROM documents
          GROUP BY employee_id
         ) doc_stats ON doc_stats.employee_id = e.id

         LEFT JOIN (
          SELECT
            employee_id,
            COUNT(*)::int AS total_tasks,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_tasks,
            COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_tasks
          FROM tasks
          GROUP BY employee_id
         ) task_stats ON task_stats.employee_id = e.id

         LEFT JOIN (
          SELECT
            employee_id,
            COUNT(*)::int AS total_trainings,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_trainings,
            COALESCE(ROUND(AVG(progress_percent)), 0)::int AS avg_training_progress
          FROM training_assignments
          GROUP BY employee_id
         ) training_stats ON training_stats.employee_id = e.id

         ORDER BY e.created_at DESC`
      );

      const employees = result.rows.map((employee) => {
        return {
          ...employee,
          document_progress_percent: calculatePercentage(
            employee.approved_documents,
            employee.total_documents
          ),
          task_progress_percent: calculatePercentage(
            employee.completed_tasks,
            employee.total_tasks
          ),
          training_progress_percent: toNumber(employee.avg_training_progress),
          overall_progress_percent: calculateOverallProgress(employee),
        };
      });

      return res.status(200).json({
        success: true,
        count: employees.length,
        employees,
      });
    } catch (error) {
      console.error("Onboarding progress report error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching onboarding progress report",
      });
    }
  }
);

// HR/Manager single employee report
router.get(
  "/employee/:id",
  allowRoles("hr", "manager"),
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

      const profileResult = await pool.query(
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

      if (profileResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const documentsResult = await pool.query(
        `SELECT
          d.id,
          d.document_type,
          d.original_name,
          d.mime_type,
          d.file_size,
          d.status,
          d.remarks,
          d.uploaded_at,
          d.verified_at,

          verifier.name AS verified_by_name
         FROM documents d
         LEFT JOIN users verifier ON d.verified_by = verifier.id
         WHERE d.employee_id = $1
         ORDER BY d.uploaded_at DESC`,
        [id]
      );

      const tasksResult = await pool.query(
        `SELECT
          t.id,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.due_date,
          t.completed_at,
          t.created_at,

          assigned_user.name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users assigned_user ON t.assigned_by = assigned_user.id
         WHERE t.employee_id = $1
         ORDER BY t.created_at DESC`,
        [id]
      );

      const trainingsResult = await pool.query(
        `SELECT
          ta.id AS assignment_id,
          ta.status,
          ta.progress_percent,
          ta.due_date,
          ta.completed_at,
          ta.created_at,

          t.id AS training_id,
          t.title,
          t.category,
          t.duration_hours,

          assigned_user.name AS assigned_by_name
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id = t.id
         LEFT JOIN users assigned_user ON ta.assigned_by = assigned_user.id
         WHERE ta.employee_id = $1
         ORDER BY ta.created_at DESC`,
        [id]
      );

      const totalDocuments = documentsResult.rows.length;
      const approvedDocuments = documentsResult.rows.filter(
        (document) => document.status === "approved"
      ).length;

      const totalTasks = tasksResult.rows.length;
      const completedTasks = tasksResult.rows.filter(
        (task) => task.status === "completed"
      ).length;

      const totalTrainings = trainingsResult.rows.length;
      const completedTrainings = trainingsResult.rows.filter(
        (training) => training.status === "completed"
      ).length;

      const averageTrainingProgress =
        totalTrainings === 0
          ? 0
          : Math.round(
              trainingsResult.rows.reduce(
                (sum, training) => sum + toNumber(training.progress_percent),
                0
              ) / totalTrainings
            );

      const progressEmployee = {
        onboarding_status: profileResult.rows[0].onboarding_status,
        total_documents: totalDocuments,
        approved_documents: approvedDocuments,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        total_trainings: totalTrainings,
        avg_training_progress: averageTrainingProgress,
      };

      return res.status(200).json({
        success: true,
        report: {
          profile: profileResult.rows[0],
          summary: {
            total_documents: totalDocuments,
            approved_documents: approvedDocuments,
            document_progress_percent: calculatePercentage(
              approvedDocuments,
              totalDocuments
            ),

            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            task_progress_percent: calculatePercentage(
              completedTasks,
              totalTasks
            ),

            total_trainings: totalTrainings,
            completed_trainings: completedTrainings,
            training_progress_percent: averageTrainingProgress,

            overall_progress_percent:
              calculateOverallProgress(progressEmployee),
          },
          documents: documentsResult.rows,
          tasks: tasksResult.rows,
          trainings: trainingsResult.rows,
        },
      });
    } catch (error) {
      console.error("Single employee report error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching employee report",
      });
    }
  }
);

// Employee/Manager own dashboard report
router.get(
  "/my-dashboard",
  allowRoles("employee", "manager"),
  async (req, res) => {
    try {
      const employeeResult = await pool.query(
        `SELECT
          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,
          e.phone,
          e.joining_date,
          e.onboarding_status,

          u.id AS user_id,
          u.name,
          u.email,
          u.role,
          u.is_active
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.user_id = $1`,
        [req.user.id]
      );

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee record not found",
        });
      }

      const employeeId = employeeResult.rows[0].employee_id;

      const documentsResult = await pool.query(
        `SELECT
          id,
          document_type,
          original_name,
          status,
          remarks,
          uploaded_at,
          verified_at
         FROM documents
         WHERE employee_id = $1
         ORDER BY uploaded_at DESC`,
        [employeeId]
      );

      const tasksResult = await pool.query(
        `SELECT
          id,
          title,
          description,
          priority,
          status,
          due_date,
          completed_at,
          created_at
         FROM tasks
         WHERE employee_id = $1
         ORDER BY created_at DESC`,
        [employeeId]
      );

      const trainingsResult = await pool.query(
        `SELECT
          ta.id AS assignment_id,
          ta.status,
          ta.progress_percent,
          ta.due_date,
          ta.completed_at,

          t.title,
          t.category,
          t.duration_hours
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id = t.id
         WHERE ta.employee_id = $1
         ORDER BY ta.created_at DESC`,
        [employeeId]
      );

      const totalDocuments = documentsResult.rows.length;
      const approvedDocuments = documentsResult.rows.filter(
        (document) => document.status === "approved"
      ).length;

      const totalTasks = tasksResult.rows.length;
      const completedTasks = tasksResult.rows.filter(
        (task) => task.status === "completed"
      ).length;

      const totalTrainings = trainingsResult.rows.length;

      const averageTrainingProgress =
        totalTrainings === 0
          ? 0
          : Math.round(
              trainingsResult.rows.reduce(
                (sum, training) => sum + toNumber(training.progress_percent),
                0
              ) / totalTrainings
            );

      const progressEmployee = {
        onboarding_status: employeeResult.rows[0].onboarding_status,
        total_documents: totalDocuments,
        approved_documents: approvedDocuments,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        total_trainings: totalTrainings,
        avg_training_progress: averageTrainingProgress,
      };

      return res.status(200).json({
        success: true,
        dashboard: {
          profile: employeeResult.rows[0],
          summary: {
            total_documents: totalDocuments,
            approved_documents: approvedDocuments,
            document_progress_percent: calculatePercentage(
              approvedDocuments,
              totalDocuments
            ),

            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            task_progress_percent: calculatePercentage(
              completedTasks,
              totalTasks
            ),

            total_trainings: totalTrainings,
            training_progress_percent: averageTrainingProgress,

            overall_progress_percent:
              calculateOverallProgress(progressEmployee),
          },
          documents: documentsResult.rows,
          tasks: tasksResult.rows,
          trainings: trainingsResult.rows,
        },
      });
    } catch (error) {
      console.error("My dashboard report error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching your dashboard",
      });
    }
  }
);

module.exports = router;