import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getDashboardPath, saveAuth } from "../utils/auth";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const loginUser = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", form);

      saveAuth(response.data.token, response.data.user);

      navigate(getDashboardPath(response.data.user.role));
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid-overlay" />
      <div className="auth-card">
        <h1>OnboardPro</h1>
        <p>Secure Employee Onboarding System</p>

        <form onSubmit={loginUser}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {message && <div className="error-message">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">
          New employee? <Link to="/register">Create account</Link>
        </p>

        <div className="demo-box">
          <strong>HR Demo Login</strong>
          <span>Email: admin@onboardpro.com</span>
          <span>Password: Admin@12345</span>
        </div>
      </div>
    </div>
  );
}

export default Login;