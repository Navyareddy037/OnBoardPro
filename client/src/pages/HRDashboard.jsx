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

  const modules = [
    {
      name: "Employees",
      icon: "👥",
      title: "Employee Management",
      desc: "Add, view and manage employee onboarding",
    },
    {
      name: "Documents",
      icon: "📄",
      title: "Document Verification",
      desc: "Review and approve employee documents",
    },
    {
      name: "Offer Letters",
      icon: "📩",
      title: "Offer Letters",
      desc: "Manage employee offer and joining letters",
    },
    {
      name: "Tasks",
      icon: "✅",
      title: "Task Management",
      desc: "Assign and track onboarding tasks",
    },
    {
      name: "Trainings",
      icon: "🎓",
      title: "Training Management",
      desc: "Create and assign training modules",
    },
    {
      name: "Departments",
      icon: "🏢",
      title: "Departments",
      desc: "Manage employee departments",
    },
    {
      name: "Progress",
      icon: "📊",
      title: "Progress Tracking",
      desc: "Track employee onboarding completion",
    },
    {
      name: "Notifications",
      icon: "🔔",
      title: "Notifications",
      desc: "Send onboarding alerts and reminders",
    },
    {
      name: "Reports",
      icon: "📈",
      title: "Reports",
      desc: "View onboarding analytics and reports",
    },
  ];

  const renderHome = () => {
    return (
      <>
        <section className="clean-welcome">
          <div>
            <span>HR PORTAL</span>
            <h1>Hello, {user?.name || "HR Admin"}</h1>
            <p>
              Manage employees, documents, offer letters, tasks, trainings,
              departments, notifications, and reports from one dashboard.
            </p>
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
            <h2>HR Features</h2>
            <p>All onboarding controls in one place</p>
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
            <h2>Overall Onboarding Progress</h2>
            <p>Track complete onboarding status of all employees</p>
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
          <h2>Employee Management</h2>
          <p>Add and manage employee onboarding profiles</p>
        </div>

        <div className="clean-form">
          <label>Employee Name</label>
          <input placeholder="Enter employee name" />

          <label>Email Address</label>
          <input placeholder="Enter employee email" />

          <label>Department</label>
          <input placeholder="Enter department" />

          <label>Designation</label>
          <input placeholder="Enter designation" />

          <button>Add Employee</button>
        </div>

        <div className="clean-list mt-20">
          <div>
            <span>👤 No employees added yet</span>
            <strong>Empty</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderDocuments = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Document Verification</h2>
          <p>Review, approve, or reject employee documents</p>
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

  const renderOfferLetters = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Offer Letters</h2>
          <p>Create and manage employee offer letters</p>
        </div>

        <div className="clean-form">
          <label>Employee Name</label>
          <input placeholder="Enter employee name" />

          <label>Position</label>
          <input placeholder="Enter position" />

          <label>Joining Date</label>
          <input type="date" />

          <button>Create Offer Letter</button>
        </div>

        <div className="clean-list mt-20">
          <div>
            <span>📩 No offer letters created yet</span>
            <strong>Empty</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderTasks = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Task Management</h2>
          <p>Create and assign onboarding tasks</p>
        </div>

        <div className="clean-form">
          <label>Task Title</label>
          <input placeholder="Enter task title" />

          <label>Assigned To</label>
          <input placeholder="Enter employee email" />

          <label>Due Date</label>
          <input type="date" />

          <button>Assign Task</button>
        </div>

        <div className="clean-list mt-20">
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

  const renderTrainings = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Training Management</h2>
          <p>Create and assign employee training modules</p>
        </div>

        <div className="clean-form">
          <label>Training Title</label>
          <input placeholder="Enter training title" />

          <label>Description</label>
          <input placeholder="Enter short description" />

          <label>Assigned To</label>
          <input placeholder="Enter employee email" />

          <button>Assign Training</button>
        </div>

        <div className="clean-list mt-20">
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

  const renderDepartments = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Departments</h2>
          <p>Manage company departments and employee allocation</p>
        </div>

        <div className="clean-form">
          <label>Department Name</label>
          <input placeholder="Enter department name" />

          <label>Manager Name</label>
          <input placeholder="Enter manager name" />

          <button>Add Department</button>
        </div>

        <div className="clean-list mt-20">
          <div>
            <span>Human Resources</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>Engineering</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>Finance</span>
            <strong>Active</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderProgress = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Progress Tracking</h2>
          <p>Track complete onboarding progress</p>
        </div>

        <div className="clean-report">
          <p>Overall Completion</p>
          <h1>0%</h1>
          <span>No onboarding activity completed yet.</span>
        </div>

        <div className="clean-progress-bar mt-20">
          <div style={{ width: "0%" }}></div>
        </div>

        <div className="clean-list mt-20">
          <div>
            <span>Documents Approved</span>
            <strong>0/0</strong>
          </div>

          <div>
            <span>Tasks Completed</span>
            <strong>0/0</strong>
          </div>

          <div>
            <span>Training Completed</span>
            <strong>0%</strong>
          </div>
        </div>
      </section>
    );
  };

  const renderNotifications = () => {
    return (
      <section className="clean-panel">
        <div className="clean-section-title">
          <h2>Notifications</h2>
          <p>Send onboarding alerts and reminders</p>
        </div>

        <div className="clean-form">
          <label>Notification Title</label>
          <input placeholder="Enter notification title" />

          <label>Message</label>
          <input placeholder="Enter notification message" />

          <button>Send Notification</button>
        </div>

        <div className="clean-list mt-20">
          <div>
            <span>Welcome notification</span>
            <strong>Ready</strong>
          </div>

          <div>
            <span>Document reminder</span>
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
          <p>Onboarding analytics and HR reports</p>
        </div>

        <div className="clean-stats">
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
        </div>

        <div className="clean-report mt-20">
          <p>Completion Rate</p>
          <h1>0%</h1>
          <span>Overall onboarding performance report</span>
        </div>
      </section>
    );
  };

  const renderContent = () => {
    if (activeTab === "Home") return renderHome();
    if (activeTab === "Employees") return renderEmployees();
    if (activeTab === "Documents") return renderDocuments();
    if (activeTab === "Offer Letters") return renderOfferLetters();
    if (activeTab === "Tasks") return renderTasks();
    if (activeTab === "Trainings") return renderTrainings();
    if (activeTab === "Departments") return renderDepartments();
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
            <p>HR Mobile Workspace</p>
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