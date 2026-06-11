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

  const modules = [
    {
      name: "Profile",
      icon: "👤",
      title: "Profile Management",
      desc: "View and manage your employee profile",
    },
    {
      name: "Documents",
      icon: "📄",
      title: "Documents",
      desc: "Upload and track required documents",
    },
    {
      name: "Offer Letters",
      icon: "📩",
      title: "Offer Letters",
      desc: "View your offer letters and HR letters",
    },
    {
      name: "Tasks",
      icon: "✅",
      title: "Tasks",
      desc: "View assigned onboarding tasks",
    },
    {
      name: "Trainings",
      icon: "🎓",
      title: "Trainings",
      desc: "Complete assigned training modules",
    },
    {
      name: "Progress",
      icon: "📊",
      title: "Progress",
      desc: "Track your onboarding completion",
    },
    {
      name: "Notifications",
      icon: "🔔",
      title: "Notifications",
      desc: "View latest onboarding updates",
    },
    {
      name: "Reports",
      icon: "📈",
      title: "Reports",
      desc: "View your onboarding reports",
    },
  ];

  const renderHome = () => {
    return (
      <>
        <section className="clean-welcome employee">
          <div>
            <span>EMPLOYEE PORTAL</span>
            <h1>Hello, {user?.name || "Employee"}</h1>
            <p>
              Complete your onboarding steps, upload documents, finish training,
              and track your progress.
            </p>
          </div>
        </section>

        <section className="clean-stats">
          <div className="clean-stat primary">
            <p>Overall Progress</p>
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
            <h2>Employee Features</h2>
            <p>All onboarding features in one place</p>
          </div>

          <div className="clean-modules">
            {modules.map((item) => (
              <button key={item.name} onClick={() => setActiveTab(item.name)}>
                <div className="clean-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <span>›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="clean-progress-card">
          <div>
            <h2>My Onboarding Progress</h2>
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
            <span>Employee Name</span>
            <strong>{user?.name || "Employee"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{user?.email || "employee@example.com"}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>{user?.role || "Employee"}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>Active</strong>
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
          <p>Upload your required onboarding documents</p>
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

        <div className="clean-list mt-20">
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
        </div>
      </section>
    );
  };

  const renderOfferLetters = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Offer Letters</h2>
          <p>View HR generated offer letters and joining letters</p>
        </div>

        <div className="clean-list">
          <div>
            <span>📩 Offer Letter</span>
            <strong>Not Available</strong>
          </div>

          <div>
            <span>📩 Joining Letter</span>
            <strong>Not Available</strong>
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
          <p>Your assigned onboarding tasks</p>
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
            <span>Complete HR Orientation</span>
            <strong>Pending</strong>
          </div>

          <div>
            <span>Read Company Policy</span>
            <strong>Pending</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderTrainings = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Trainings</h2>
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

  const renderProgress = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Progress</h2>
          <p>Your onboarding completion status</p>
        </div>

        <div className="clean-report">
          <p>Overall Progress</p>
          <h1>0%</h1>
          <span>No onboarding activity completed yet.</span>
        </div>

        <div className="clean-progress-bar mt-20">
          <div style={{ width: "0%" }}></div>
        </div>
      </section>
    );
  };

  const renderNotifications = () => {
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

          <div>
            <span>Complete your HR orientation</span>
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
          <p>Your onboarding report summary</p>
        </div>

        <div className="clean-stats">
          <div className="clean-stat primary">
            <p>Progress</p>
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
        </div>
      </section>
    );
  };

  const renderContent = () => {
    if (activeTab === "Home") return renderHome();
    if (activeTab === "Profile") return renderProfile();
    if (activeTab === "Documents") return renderDocuments();
    if (activeTab === "Offer Letters") return renderOfferLetters();
    if (activeTab === "Tasks") return renderTasks();
    if (activeTab === "Trainings") return renderTrainings();
    if (activeTab === "Progress") return renderProgress();
    if (activeTab === "Notifications") return renderNotifications();
    if (activeTab === "Reports") return renderReports();

    return renderHome();
  };

  return (
    <div className="clean-app">
      <header className="clean-header">
        <div className="clean-logo-row">
          <div className="clean-logo">OP</div>
          <div>
            <h1>OnboardPro</h1>
            <p>Employee Mobile Workspace</p>
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
          className={activeTab === "Notifications" ? "active" : ""}
          onClick={() => setActiveTab("Notifications")}
        >
          <span>🔔</span>
          Alerts
        </button>
      </nav>
    </div>
  );
}

export default EmployeeDashboard;