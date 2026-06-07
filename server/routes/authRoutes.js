const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// Register normal employee only
router.post(
  "/register",
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

      const { name, email, password } = req.body;

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, "employee"]
      );

      const user = result.rows[0];
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        token,
        user,
      });
    } catch (error) {
      console.error("Register error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password").notEmpty().withMessage("Password is required"),
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

      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: "Your account is disabled. Contact HR.",
        });
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = generateToken(safeUser);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: safeUser,
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  }
);

// Get logged-in user profile
router.get("/me", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});

module.exports = router;