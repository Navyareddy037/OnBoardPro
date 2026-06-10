import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HRDashboard() {
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
        <section className="clean-welcome">
          <div>
            <span>HR PORTAL</span>
            <h1>Hello, {user?.name || "HR Admin"}</h1>
            <p>Manage employee onboarding with a simple professional workspace.</p>
          </div>
        </section>

        <section className="clean-stats">
          <div className="clean-stat primary">
            <p>Total Employees</p>
            <h2>0</h2>
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
            <h2>HR Actions</h2>
            <p>Important onboarding operations</p>
          </div>

          <div className="clean-modules">
            <button onClick={() => setActiveTab("Employees")}>
              <div className="clean-icon">👥</div>
              <div>
                <h3>Employees</h3>
                <p>Add and manage employees</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Documents")}>
              <div className="clean-icon">📄</div>
              <div>
                <h3>Documents</h3>
                <p>Verify submitted documents</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Training")}>
              <div className="clean-icon">🎓</div>
              <div>
                <h3>Training</h3>
                <p>Assign onboarding modules</p>
              </div>
              <span>›</span>
            </button>

            <button onClick={() => setActiveTab("Reports")}>
              <div className="clean-icon">📊</div>
              <div>
                <h3>Reports</h3>
                <p>View onboarding analytics</p>
              </div>
              <span>›</span>
            </button>
          </div>
        </section>

        <section className="clean-progress-card">
          <div>
            <h2>Overall Progress</h2>
            <p>Current onboarding completion rate</p>
          </div>

          <strong>0%</strong>

          <div className="clean-progress-bar">
            <div style={{ width: "0%" }}></div>
          </div>
        </section>
      </>
    );
  };

  const renderEmployees = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Employee Registration</h2>
          <p>Add new employee details</p>
        </div>

        <div className="clean-form">
          <label>Full Name</label>
          <input placeholder="Enter employee name" />

          <label>Email Address</label>
          <input placeholder="Enter employee email" />

          <label>Department</label>
          <input placeholder="Enter department" />

          <label>Designation</label>
          <input placeholder="Enter designation" />

          <button>Add Employee</button>
        </div>
      </section>
    );
  };

  const renderDocuments = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Documents</h2>
          <p>Review employee documents</p>
        </div>

        <div className="clean-list">
          <div>
            <span>📄 ID Proof</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>📄 Resume</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>🏦 Bank Details</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>🎓 Certificates</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderTraining = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Training</h2>
          <p>Manage employee training modules</p>
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
          <p>Track onboarding tasks</p>
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
            <span>Attend Orientation</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderReports = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Reports</h2>
          <p>Onboarding performance overview</p>
        </div>

        <div className="clean-report">
          <p>Completion Rate</p>
          <h1>0%</h1>
          <span>No onboarding activity completed yet.</span>
        </div>
      </section>
    );
  };

  const renderContent = () => {
    if (activeTab === "Home") return renderHome();
    if (activeTab === "Employees") return renderEmployees();
    if (activeTab === "Documents") return renderDocuments();
    if (activeTab === "Training") return renderTraining();
    if (activeTab === "Tasks") return renderTasks();
    if (activeTab === "Reports") return renderReports();
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
              <p>HR Mobile Workspace</p>
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
          className={activeTab === "Employees" ? "active" : ""}
          onClick={() => setActiveTab("Employees")}
        >
          <span>👥</span>
          Staff
        </button>

        <button
          className={activeTab === "Documents" ? "active" : ""}
          onClick={() => setActiveTab("Documents")}
        >
          <span>📄</span>
          Docs
        </button>

        <button
          className={activeTab === "Reports" ? "active" : ""}
          onClick={() => setActiveTab("Reports")}
        >
          <span>📊</span>
          Reports
        </button>
      </nav>
    </div>
  );
}

export default HRDashboard;