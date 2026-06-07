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

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "offer_letters");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const allowedMimeTypes = ["application/pdf"];
const allowedExtensions = [".pdf"];

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
    return cb(new Error("Only PDF offer letters are allowed."), false);
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

const uploadSingleOfferLetter = (req, res, next) => {
  upload.single("offer_letter")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Offer letter file size must be less than 5MB.",
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

// HR uploads offer letter
router.post(
  "/upload",
  allowRoles("hr"),
  uploadSingleOfferLetter,
  [
    body("employee_id")
      .isInt()
      .withMessage("Employee ID must be a number"),

    body("title")
      .trim()
      .notEmpty()
      .withMessage("Offer letter title is required")
      .isLength({ min: 3, max: 150 })
      .withMessage("Title must be between 3 and 150 characters"),

    body("remarks")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Remarks cannot exceed 500 characters"),
  ],
  async (req, res) => {
    const client = await pool.connect();

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
          message: "Offer letter PDF file is required.",
        });
      }

      const { employee_id, title, remarks } = req.body;

      await client.query("BEGIN");

      const employeeResult = await client.query(
        `SELECT
          e.id,
          e.user_id,
          u.name,
          u.email,
          u.is_active
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [employee_id]
      );

      if (employeeResult.rows.length === 0) {
        deleteFileIfExists(req.file.path);
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      const employee = employeeResult.rows[0];

      if (!employee.is_active) {
        deleteFileIfExists(req.file.path);
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Cannot issue offer letter to inactive employee.",
        });
      }

      const relativeFilePath = path
        .join("uploads", "offer_letters", req.file.filename)
        .replace(/\\/g, "/");

      const offerResult = await client.query(
        `INSERT INTO offer_letters
         (
          employee_id,
          uploaded_by,
          title,
          original_name,
          stored_name,
          file_path,
          mime_type,
          file_size,
          status,
          remarks
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          employee_id,
          req.user.id,
          title,
          req.file.originalname,
          req.file.filename,
          relativeFilePath,
          req.file.mimetype,
          req.file.size,
          "issued",
          remarks || null,
        ]
      );

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
        [
          employee.user_id,
          req.user.id,
          "Offer Letter Issued",
          `Your offer letter "${title}" has been issued by HR.`,
          "offer",
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Offer letter uploaded and issued successfully.",
        offer_letter: offerResult.rows[0],
      });
    } catch (error) {
      if (req.file) {
        deleteFileIfExists(req.file.path);
      }

      await client.query("ROLLBACK");

      console.error("Upload offer letter error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while uploading offer letter.",
      });
    } finally {
      client.release();
    }
  }
);

// HR views all offer letters
router.get("/", allowRoles("hr"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        o.id,
        o.title,
        o.original_name,
        o.mime_type,
        o.file_size,
        o.status,
        o.remarks,
        o.issued_at,
        o.accepted_at,
        o.updated_at,

        e.id AS employee_id,
        e.employee_code,
        e.department,
        e.designation,

        u.name AS employee_name,
        u.email AS employee_email,

        uploaded_user.name AS uploaded_by_name
       FROM offer_letters o
       JOIN employees e ON o.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN users uploaded_user ON o.uploaded_by = uploaded_user.id
       ORDER BY o.issued_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      offer_letters: result.rows,
    });
  } catch (error) {
    console.error("View offer letters error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching offer letters.",
    });
  }
});

// Employee or manager views own offer letters
router.get(
  "/my-offers",
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
          title,
          original_name,
          mime_type,
          file_size,
          status,
          remarks,
          issued_at,
          accepted_at,
          updated_at
         FROM offer_letters
         WHERE employee_id = $1
         ORDER BY issued_at DESC`,
        [employeeId]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        offer_letters: result.rows,
      });
    } catch (error) {
      console.error("My offer letters error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching your offer letters.",
      });
    }
  }
);

// Employee accepts or rejects offer letter
router.patch(
  "/:id/respond",
  allowRoles("employee", "manager"),
  [
    param("id").isInt().withMessage("Offer letter ID must be a number"),

    body("status")
      .isIn(["accepted", "rejected"])
      .withMessage("Status must be accepted or rejected"),

    body("remarks")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Remarks cannot exceed 500 characters"),
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
      const { status, remarks } = req.body;

      await client.query("BEGIN");

      const offerCheck = await client.query(
        `SELECT
          o.id,
          o.employee_id,
          o.status,
          e.user_id
         FROM offer_letters o
         JOIN employees e ON o.employee_id = e.id
         WHERE o.id = $1`,
        [id]
      );

      if (offerCheck.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Offer letter not found.",
        });
      }

      const offer = offerCheck.rows[0];

      if (offer.user_id !== req.user.id) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot respond to this offer letter.",
        });
      }

      if (offer.status === "revoked") {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "This offer letter has been revoked by HR.",
        });
      }

      const acceptedAt = status === "accepted" ? "CURRENT_TIMESTAMP" : "NULL";

      const result = await client.query(
        `UPDATE offer_letters
         SET
          status = $1,
          remarks = COALESCE($2, remarks),
          accepted_at = ${acceptedAt},
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, remarks || null, id]
      );

      await client.query(
        `INSERT INTO notifications
         (
          user_id,
          created_by,
          title,
          message,
          type
         )
         SELECT
          uploaded_by,
          $1,
          $2,
          $3,
          $4
         FROM offer_letters
         WHERE id = $5 AND uploaded_by IS NOT NULL`,
        [
          req.user.id,
          "Offer Letter Response",
          `An employee has ${status} an offer letter.`,
          "offer",
          id,
        ]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          status === "accepted"
            ? "Offer letter accepted successfully."
            : "Offer letter rejected successfully.",
        offer_letter: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Respond offer letter error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while responding to offer letter.",
      });
    } finally {
      client.release();
    }
  }
);

// HR revokes offer letter
router.patch(
  "/:id/revoke",
  allowRoles("hr"),
  [param("id").isInt().withMessage("Offer letter ID must be a number")],
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

      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE offer_letters
         SET
          status = 'revoked',
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Offer letter not found.",
        });
      }

      const employeeResult = await client.query(
        `SELECT e.user_id
         FROM offer_letters o
         JOIN employees e ON o.employee_id = e.id
         WHERE o.id = $1`,
        [id]
      );

      if (employeeResult.rows.length > 0) {
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
          [
            employeeResult.rows[0].user_id,
            req.user.id,
            "Offer Letter Revoked",
            "Your offer letter has been revoked by HR.",
            "offer",
          ]
        );
      }

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Offer letter revoked successfully.",
        offer_letter: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Revoke offer letter error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while revoking offer letter.",
      });
    } finally {
      client.release();
    }
  }
);

// Secure offer letter download
router.get(
  "/download/:id",
  [param("id").isInt().withMessage("Offer letter ID must be a number")],
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
          o.id,
          o.original_name,
          o.stored_name,
          e.user_id
         FROM offer_letters o
         JOIN employees e ON o.employee_id = e.id
         WHERE o.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Offer letter not found.",
        });
      }

      const offerLetter = result.rows[0];

      if (req.user.role !== "hr" && offerLetter.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot download this offer letter.",
        });
      }

      const filePath = path.join(UPLOAD_DIR, offerLetter.stored_name);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File not found on server.",
        });
      }

      return res.download(filePath, offerLetter.original_name);
    } catch (error) {
      console.error("Download offer letter error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error while downloading offer letter.",
      });
    }
  }
);

module.exports = router;