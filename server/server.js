const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const hrRoutes = require("./routes/hrRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const documentRoutes = require("./routes/documentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const offerLetterRoutes = require("./routes/offerLetterRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

/*
  Security Headers
*/
app.use(helmet());

/*
  CORS Protection
  IMPORTANT:
  Do not use "*" with credentials.
  This code sends only one Access-Control-Allow-Origin value.
*/
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

/*
  Body Parser
*/
app.use(express.json({ limit: "10kb" }));

/*
  Rate Limits
*/
const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT) || 1000;
const LOGIN_RATE_LIMIT = Number(process.env.LOGIN_RATE_LIMIT) || 20;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: API_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: LOGIN_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again after 15 minutes.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);

/*
  Test Route
*/
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OnboardPro API is running securely",
    allowed_origins: allowedOrigins,
  });
});

/*
  Main Routes
*/
app.use("/api/auth", authRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/offers", offerLetterRoutes);
app.use("/api/notifications", notificationRoutes);

/*
  404 Handler
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/*
  Global Error Handler
*/
app.use((err, req, res, next) => {
  console.error("Global server error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/*
  Start Server
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`OnboardPro server running on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins);
  console.log(`API rate limit: ${API_RATE_LIMIT} requests per 15 minutes`);
  console.log(`Login rate limit: ${LOGIN_RATE_LIMIT} attempts per 15 minutes`);
});