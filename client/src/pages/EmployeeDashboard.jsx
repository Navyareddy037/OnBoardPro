import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    const savedUser = localStorage.getItem("onboardpro_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const logoutUser = () => {
    localStorage.removeItem("onboardpro_token");
    localStorage.removeItem("onboardpro_user");
    navigate("/login");
  };

  const renderHome = () => {
    return (
      <>
        <section className="clean-welcome employee">
          <div>
            <span>EMPLOYEE PORTAL</span>
            <h1>Hello, {user?.name || "Employee"}</h1>
            <p>Complete your onboarding steps and track your status easily.</p>
          </div>
        </section>

        <section className="clean-stats">
          <div className="clean-stat primary">
            <p>My Progress</p>
            <h2>0%</h2>
          </div>

          <div className="clean-stat">
            <p>Documents</p>
            <h2>0/0</h2>
          </div>

          <div className="clean-stat">
            <p>Tasks</p>
            <h2>0/0</h2>
          </div>

          <div className="clean-stat">
            <p>Training</p>
            <h2>0%</h2>
          </div>
        </section>

        <section className="clean-section">
          <div className="clean-section-title">
            <h2>My Actions</h2>
            <p>Complete these onboarding steps</p>
          </div>

          <div className="clean-modules">
            <button onClick={() => setActiveTab("Profile")}>
              <div className="clean-icon">👤</div>
              <div>
                <h3>Profile</h3>
                <p>View your employee details</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Documents")}>
              <div className="clean-icon">📄</div>
              <div>
                <h3>Documents</h3>
                <p>Upload required documents</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Training")}>
              <div className="clean-icon">🎓</div>
              <div>
                <h3>Training</h3>
                <p>Complete assigned modules</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Tasks")}>
              <div className="clean-icon">✅</div>
              <div>
                <h3>Tasks</h3>
                <p>Check your task list</p>
              </div>
              <span>›</span>
            </button>
          </div>
        </section>

        <section className="clean-progress-card">
          <div>
            <h2>My Onboarding</h2>
            <p>Complete all steps to finish onboarding</p>
          </div>

          <strong>0%</strong>

          <div className="clean-progress-bar">
            <div style={{ width: "0%" }}></div>
          </div>
        </section>
      </>
    );
  };

  const renderProfile = () => {
    return (
      <section className="clean-panel">
        <div className="clean-profile-box">
          <div className="clean-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "E"}
          </div>

          <h2>{user?.name || "Employee"}</h2>
          <p>{user?.email || "employee@example.com"}</p>
        </div>

        <div className="clean-list">
          <div>
            <span>Role</span>
            <strong>{user?.role || "Employee"}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>Profile</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderDocuments = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Documents</h2>
          <p>Upload your required documents</p>
        </div>

        <div className="clean-form">
          <label>Document Type</label>
          <select>
            <option>ID Proof</option>
            <option>Resume</option>
            <option>Certificates</option>
            <option>Bank Details</option>
          </select>

          <label>Upload File</label>
          <input type="file" />

          <button>Upload Document</button>
        </div>
      </section>
    );
  };

  const renderTraining = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Training</h2>
          <p>Complete assigned training modules</p>
        </div>

        <div className="clean-list">
          <div>
            <span>🎓 HR Orientation</span>
            <strong>Assigned</strong>
          </div>

          <div>
            <span>🔐 Security Awareness</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>🏢 Company Policies</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderTasks = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Tasks</h2>
          <p>Your onboarding task list</p>
        </div>

        <div className="clean-list">
          <div>
            <span>Complete Profile</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>Upload Documents</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>Complete Orientation</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderAlerts = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Notifications</h2>
          <p>Latest onboarding updates</p>
        </div>

        <div className="clean-list">
          <div>
            <span>Welcome to OnboardPro</span>
            <strong>New</strong>
          </div>

          <div>
            <span>Please upload your documents</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderContent = () => {
    if (activeTab === "Home") return renderHome();
    if (activeTab === "Profile") return renderProfile();
    if (activeTab === "Documents") return renderDocuments();
    if (activeTab === "Training") return renderTraining();
    if (activeTab === "Tasks") return renderTasks();
    if (activeTab === "Alerts") return renderAlerts();
    return renderHome();
  };

  return (
    <div className="clean-app">
      <header className="clean-header">
        <div>
          <div className="clean-logo-row">
            <div className="clean-logo">OP</div>
            <div>
              <h1>OnboardPro</h1>
              <p>Employee Mobile Workspace</p>
            </div>
          </div>
        </div>

        <button onClick={logoutUser}>Logout</button>
      </header>

      <main className="clean-content">{renderContent()}</main>

      <nav className="clean-bottom-nav">
        <button
          className={activeTab === "Home" ? "active" : ""}
          onClick={() => setActiveTab("Home")}
        >
          <span>🏠</span>
          Home
        </button>

        <button
          className={activeTab === "Profile" ? "active" : ""}
          onClick={() => setActiveTab("Profile")}
        >
          <span>👤</span>
          Profile
        </button>

        <button
          className={activeTab === "Documents" ? "active" : ""}
          onClick={() => setActiveTab("Documents")}
        >
          <span>📄</span>
          Docs
        </button>

        <button
          className={activeTab === "Alerts" ? "active" : ""}
          onClick={() => setActiveTab("Alerts")}
        >
          <span>🔔</span>
          Alerts
        </button>
      </nav>
    </div>
  );
}

export default EmployeeDashboard;