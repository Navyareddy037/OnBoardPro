const bcrypt = require("bcryptjs");
const pool = require("../config/db");
require("dotenv").config();

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required in .env");
      process.exit(1);
    }

    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [name, email, passwordHash, "hr"]
    );

    console.log("HR admin created successfully");
    console.log(`Email: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Create admin error:", error);
    process.exit(1);
  }
};

createAdmin();