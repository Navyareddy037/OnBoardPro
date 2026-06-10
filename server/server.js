const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Database connection
require("./config/db");

const app = express();

/*
  Route imports
*/
const authRoutes = require("./routes/authRoutes");
const hrRoutes = require("./routes/hrRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const documentRoutes = require("./routes/documentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const offerLetterRoutes = require("./routes/offerLetterRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

/*
  Allowed frontend URLs
*/
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.31.65:5173",
  "https://onboardpro-client-kb88.onrender.com",
];

/*
  Security middleware
*/
app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman, mobile apps, curl, and same-origin requests with no origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/*
  Static uploads folder
*/
app.use("/uploads", express.static("uploads"));

/*
  Rate limit
*/
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(apiLimiter);

/*
  Login/Register specific rate limit
*/
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  message: {
    success: false,
    message: "Too many login/register attempts. Please try again later.",
  },
});

/*
  Test route
*/
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OnboardPro API is running securely",
    allowed_origins: allowedOrigins,
  });
});

/*
  API routes
*/
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/offer-letters", offerLetterRoutes);
app.use("/api/offers", offerLetterRoutes);
app.use("/api/notifications", notificationRoutes);

/*
  404 route
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/*
  Global error handler
*/
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/*
  Start server
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OnboardPro server running on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins);
  console.log("API rate limit: 1500 requests per 15 minutes");
  console.log("Login rate limit: 45 attempts per 15 minutes");
});