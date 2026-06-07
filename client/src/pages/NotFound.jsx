import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>404</h1>
        <p>Page not found</p>
        <Link to="/login" className="button-link">
          Go to Login
        </Link>
      </div>
    </div>
  );
}

export default NotFound;