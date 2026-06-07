const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { body, param, validationResult } = require("express-validator");

const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "documents");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString("hex");
    const safeFileName = `${Date.now()}-${randomName}${fileExtension}`;

    cb(null, safeFileName);
  },
});

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const isExtensionAllowed = allowedExtensions.includes(fileExtension);

  if (!isMimeTypeAllowed || !isExtensionAllowed) {
    return cb(
      new Error("Only PDF, JPG, JPEG, and PNG files are allowed."),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadSingleDocument = (req, res, next) => {
  upload.single("document")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size must be less than 5MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

router.use(protect);

// Employee or manager uploads own document
router.post(
  "/upload",
  allowRoles("employee", "manager"),
  uploadSingleDocument,
  [
    body("document_type")
      .trim()
      .notEmpty()
      .withMessage("Document type is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Document type must be between 2 and 100 characters")
      .matches(/^[a-zA-Z0-9 _-]+$/)
      .withMessage("Document type contains invalid characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        if (req.file) {
          deleteFileIfExists(req.file.path);
        }

        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Document file is required.",
        });
      }

      const { document_type } = req.body;

      const employeeResult = await pool.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id]
      );

      if (employeeResult.rows.length === 0) {
        deleteFileIfExists(req.file.path);

        return res.status(404).json({
          success: false,
          message: "Employee record not found.",
        });
      }

      const employeeId = employeeResult.rows[0].id;

      const relativeFilePath = path
        .join("uploads", "documents", req.file.filename)
        .replace(/\\/g, "/");

      const result = await pool.query(
        `INSERT INTO documents
         (
          employee_id,
          uploaded_by,
          document_type,
          original_name,
          stored_name,
          file_path,
          mime_type,
          file_size,
          status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          employeeId,
          req.user.id,
          document_type,
          req.file.originalname,
          req.file.filename,
          relativeFilePath,
          req.file.mimetype,
          req.file.size,
          "pending",
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully. Waiting for HR verification.",
        document: result.rows[0],
      });
    } catch (error) {
      if (req.file) {
        deleteFileIfExists(req.file.path);
      }

      console.error("Upload document error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while uploading document.",
      });
    }
  }
);

// Employee or manager views own uploaded documents
router.get(
  "/my-documents",
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
          message: "Employee record not found.",
        });
      }

      const employeeId = employeeResult.rows[0].id;

      const result = await pool.query(
        `SELECT 
          id,
          document_type,
          original_name,
          mime_type,
          file_size,
          status,
          remarks,
          uploaded_at,
          verified_at
         FROM documents
         WHERE employee_id = $1
         ORDER BY uploaded_at DESC`,
        [employeeId]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        documents: result.rows,
      });
    } catch (error) {
      console.error("My documents error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching your documents.",
      });
    }
  }
);

// HR views all documents
router.get("/hr/documents", allowRoles("hr"), async (req, res) => {
  try {
    const result = await pool.query(
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

        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,

        u.name AS employee_name,
        u.email AS employee_email,

        verifier.name AS verified_by_name
       FROM documents d
       JOIN employees e ON d.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN users verifier ON d.verified_by = verifier.id
       ORDER BY d.uploaded_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      documents: result.rows,
    });
  } catch (error) {
    console.error("HR documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching documents.",
    });
  }
});

// HR views single document details
router.get(
  "/hr/documents/:id",
  allowRoles("hr"),
  [param("id").isInt().withMessage("Document ID must be a number")],
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
          d.id,
          d.document_type,
          d.original_name,
          d.mime_type,
          d.file_size,
          d.status,
          d.remarks,
          d.uploaded_at,
          d.verified_at,

          e.id AS employee_id,
          e.employee_code,
          e.department,
          e.designation,

          u.name AS employee_name,
          u.email AS employee_email,

          verifier.name AS verified_by_name
         FROM documents d
         JOIN employees e ON d.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         LEFT JOIN users verifier ON d.verified_by = verifier.id
         WHERE d.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      return res.status(200).json({
        success: true,
        document: result.rows[0],
      });
    } catch (error) {
      console.error("HR single document error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching document.",
      });
    }
  }
);

// HR approves or rejects document
router.patch(
  "/hr/documents/:id/verify",
  allowRoles("hr"),
  [
    param("id").isInt().withMessage("Document ID must be a number"),

    body("status")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be approved or rejected"),

    body("remarks")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Remarks cannot exceed 500 characters"),
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
      const { status, remarks } = req.body;

      const result = await pool.query(
        `UPDATE documents
         SET
          status = $1,
          remarks = $2,
          verified_by = $3,
          verified_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [status, remarks || null, req.user.id, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          status === "approved"
            ? "Document approved successfully."
            : "Document rejected successfully.",
        document: result.rows[0],
      });
    } catch (error) {
      console.error("Verify document error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while verifying document.",
      });
    }
  }
);

// Secure document download
router.get(
  "/download/:id",
  [param("id").isInt().withMessage("Document ID must be a number")],
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
          d.id,
          d.original_name,
          d.stored_name,
          e.user_id
         FROM documents d
         JOIN employees e ON d.employee_id = e.id
         WHERE d.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      const document = result.rows[0];

      if (req.user.role !== "hr" && document.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot download this document.",
        });
      }

      const filePath = path.join(UPLOAD_DIR, document.stored_name);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File not found on server.",
        });
      }

      return res.download(filePath, document.original_name);
    } catch (error) {
      console.error("Download document error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while downloading document.",
      });
    }
  }
);

module.exports = router;