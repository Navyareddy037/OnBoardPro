import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser, logout } from "../utils/auth";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });

  const [documentForm, setDocumentForm] = useState({
    document_type: "",
    file: null,
  });

  const [offerRemarks, setOfferRemarks] = useState({});

  const userToken = localStorage.getItem("onboardpro_token");

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "profile", label: "Profile Management" },
    { key: "documents", label: "Documents" },
    { key: "offers", label: "Offer Letters" },
    { key: "tasks", label: "Tasks" },
    { key: "trainings", label: "Trainings" },
    { key: "progress", label: "Progress" },
    { key: "notifications", label: "Notifications" },
    { key: "reports", label: "Reports" },
  ];

  const sidebarStyle = {
    display: "grid",
    gridTemplateColumns: "270px 1fr",
    minHeight: "calc(100vh - 72px)",
  };

  const sideMenuStyle = {
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "22px",
    position: "sticky",
    top: "72px",
    height: "calc(100vh - 72px)",
    overflowY: "auto",
  };

  const sideButtonStyle = (isActive) => ({
    width: "100%",
    textAlign: "left",
    padding: "13px 14px",
    marginBottom: "10px",
    borderRadius: "14px",
    border: isActive ? "1px solid #6366f1" : "1px solid #e2e8f0",
    background: isActive ? "#eef2ff" : "#ffffff",
    color: isActive ? "#4f46e5" : "#475569",
    fontWeight: "800",
    cursor: "pointer",
  });

  const sectionStyle = {
    padding: "32px",
    overflowX: "hidden",
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "90px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px 16px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "15px",
    background: "#f8fafc",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not set";
    }

    return new Date(dateValue).toLocaleDateString("en-IN");
  };

  const getStatusClass = (status) => {
    if (status === "completed" || status === "approved" || status === "accepted") {
      return "status-badge status-success";
    }

    if (status === "in_progress" || status === "issued" || status === "assigned") {
      return "status-badge status-warning";
    }

    if (status === "rejected" || status === "revoked") {
      return "status-badge status-danger";
    }

    return "status-badge status-pending";
  };

  const loadEmployeeData = async () => {
    try {
      setLoading(true);

      const [dashboardResponse, documentsResponse, offersResponse, notificationsResponse] =
        await Promise.all([
          API.get("/reports/my-dashboard"),
          API.get("/documents/my-documents"),
          API.get("/offers/my-offers"),
          API.get("/notifications/my-notifications"),
        ]);

      setDashboard(dashboardResponse.data.dashboard);
      setDocuments(documentsResponse.data.documents || []);
      setOffers(offersResponse.data.offer_letters || []);
      setNotifications(notificationsResponse.data.notifications || []);
      setUnreadCount(notificationsResponse.data.unread_count || 0);

      setProfileForm({
        name: dashboardResponse.data.dashboard?.profile?.name || "",
        phone: dashboardResponse.data.dashboard?.profile?.phone || "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load employee dashboard. Check backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    setProfileForm({
      ...profileForm,
      [event.target.name]: event.target.value,
    });
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({
      ...passwordForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleDocumentChange = (event) => {
    const { name, value, files } = event.target;

    setDocumentForm({
      ...documentForm,
      [name]: files ? files[0] : value,
    });
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await API.put("/employee/profile", profileForm);

      setMessage("Profile updated successfully.");
      loadEmployeeData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update profile."
      );
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await API.patch("/employee/change-password", passwordForm);

      setMessage("Password changed successfully.");

      setPasswordForm({
        current_password: "",
        new_password: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to change password."
      );
    }
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!documentForm.file) {
      setMessage("Please choose a document file.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("document_type", documentForm.document_type);
      formData.append("document", documentForm.file);

      await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Document uploaded successfully. Waiting for HR verification.");

      setDocumentForm({
        document_type: "",
        file: null,
      });

      event.target.reset();

      loadEmployeeData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to upload document."
      );
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    setMessage("");

    try {
      await API.patch(`/tasks/${taskId}/status`, { status });

      setMessage("Task status updated successfully.");
      loadEmployeeData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update task."
      );
    }
  };

  const updateTrainingProgress = async (assignmentId, status, progressPercent) => {
    setMessage("");

    try {
      await API.patch(`/trainings/assignments/${assignmentId}/progress`, {
        status,
        progress_percent: progressPercent,
      });

      setMessage("Training progress updated successfully.");
      loadEmployeeData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update training progress."
      );
    }
  };

  const respondOffer = async (offerId, status) => {
    setMessage("");

    try {
      await API.patch(`/offers/${offerId}/respond`, {
        status,
        remarks: offerRemarks[offerId] || "",
      });

      setMessage(
        status === "accepted"
          ? "Offer letter accepted successfully."
          : "Offer letter rejected successfully."
      );

      setOfferRemarks({
        ...offerRemarks,
        [offerId]: "",
      });

      loadEmployeeData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to respond to offer letter."
      );
    }
  };

  const markNotificationRead = async (notificationId) => {
    setMessage("");

    try {
      await API.patch(`/notifications/${notificationId}/read`);

      setMessage("Notification marked as read.");
      loadEmployeeData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update notification.");
    }
  };

  const markAllNotificationsRead = async () => {
    setMessage("");

    try {
      await API.patch("/notifications/read-all");

      setMessage("All notifications marked as read.");
      loadEmployeeData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update notifications.");
    }
  };

  const downloadFile = async (endpoint, filename) => {
    setMessage("");

    try {
      const response = await API.get(endpoint, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = fileUrl;
      link.setAttribute("download", filename || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      setMessage("Failed to download file.");
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading Employee Dashboard...</div>;
  }

  const renderDashboard = () => (
    <>
      <section className="hero-card">
        <h1>Welcome, {dashboard?.profile?.name}</h1>
        <p>
          Track your onboarding progress, documents, tasks, trainings, offer
          letters, and notifications.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Overall Progress</h3>
          <strong>{dashboard?.summary?.overall_progress_percent || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Documents Approved</h3>
          <strong>
            {dashboard?.summary?.approved_documents || 0}/
            {dashboard?.summary?.total_documents || 0}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Tasks Completed</h3>
          <strong>
            {dashboard?.summary?.completed_tasks || 0}/
            {dashboard?.summary?.total_tasks || 0}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Training Progress</h3>
          <strong>{dashboard?.summary?.training_progress_percent || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Offer Letters</h3>
          <strong>{offers.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Unread Notifications</h3>
          <strong>{unreadCount}</strong>
        </div>
      </section>
    </>
  );

  const renderProfile = () => (
    <>
      <section className="panel">
        <h2>My Profile</h2>

        <div className="profile-grid">
          <p>
            <strong>Employee Code</strong>
            {dashboard?.profile?.employee_code || "Not assigned"}
          </p>

          <p>
            <strong>Email</strong>
            {dashboard?.profile?.email}
          </p>

          <p>
            <strong>Role</strong>
            {dashboard?.profile?.role}
          </p>

          <p>
            <strong>Department</strong>
            {dashboard?.profile?.department || "Not assigned"}
          </p>

          <p>
            <strong>Designation</strong>
            {dashboard?.profile?.designation || "Not assigned"}
          </p>

          <p>
            <strong>Joining Date</strong>
            {formatDate(dashboard?.profile?.joining_date)}
          </p>

          <p>
            <strong>Onboarding Status</strong>
            {dashboard?.profile?.onboarding_status}
          </p>

          <p>
            <strong>Account Status</strong>
            {dashboard?.profile?.is_active ? "Active" : "Inactive"}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>Update Profile</h2>

        <form className="grid-form" onSubmit={updateProfile}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={profileForm.name}
            onChange={handleProfileChange}
            required
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={profileForm.phone}
            onChange={handleProfileChange}
          />

          <button type="submit">Update Profile</button>
        </form>
      </section>

      <section className="panel">
        <h2>Change Password</h2>

        <form className="grid-form" onSubmit={changePassword}>
          <input
            type="password"
            name="current_password"
            placeholder="Current password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            required
          />

          <input
            type="password"
            name="new_password"
            placeholder="New password"
            value={passwordForm.new_password}
            onChange={handlePasswordChange}
            required
          />

          <button type="submit">Change Password</button>
        </form>
      </section>
    </>
  );

  const renderDocuments = () => (
    <>
      <section className="panel">
        <h2>Upload Document</h2>

        <form className="grid-form" onSubmit={uploadDocument}>
          <select
            name="document_type"
            value={documentForm.document_type}
            onChange={handleDocumentChange}
            required
          >
            <option value="">Select Document Type</option>
            <option value="Aadhaar Card">Aadhaar Card</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Education Certificate">Education Certificate</option>
            <option value="Experience Letter">Experience Letter</option>
            <option value="Address Proof">Address Proof</option>
            <option value="Bank Details">Bank Details</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="file"
            name="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleDocumentChange}
            required
          />

          <button type="submit">Upload Document</button>
        </form>
      </section>

      <section className="panel">
        <h2>My Documents</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>File</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Uploaded</th>
                <th>Download</th>
              </tr>
            </thead>

            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="6">No documents uploaded yet.</td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.document_type}</td>
                    <td>{document.original_name}</td>
                    <td>
                      <span className={getStatusClass(document.status)}>
                        {document.status}
                      </span>
                    </td>
                    <td>{document.remarks || "No remarks"}</td>
                    <td>{formatDate(document.uploaded_at)}</td>
                    <td>
                      <button
                        className="small-btn"
                        onClick={() =>
                          downloadFile(
                            `/documents/download/${document.id}`,
                            document.original_name
                          )
                        }
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderOffers = () => (
    <section className="panel">
      <h2>My Offer Letters</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>File</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Issued</th>
              <th>Download</th>
              <th>Response</th>
            </tr>
          </thead>

          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan="7">No offer letters issued yet.</td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id}>
                  <td>{offer.title}</td>
                  <td>{offer.original_name}</td>
                  <td>
                    <span className={getStatusClass(offer.status)}>
                      {offer.status}
                    </span>
                  </td>
                  <td>{offer.remarks || "No remarks"}</td>
                  <td>{formatDate(offer.issued_at)}</td>
                  <td>
                    <button
                      className="small-btn"
                      onClick={() =>
                        downloadFile(`/offers/download/${offer.id}`, offer.original_name)
                      }
                    >
                      Download
                    </button>
                  </td>
                  <td>
                    {offer.status === "issued" ? (
                      <>
                        <input
                          type="text"
                          placeholder="Remarks"
                          value={offerRemarks[offer.id] || ""}
                          onChange={(event) =>
                            setOfferRemarks({
                              ...offerRemarks,
                              [offer.id]: event.target.value,
                            })
                          }
                        />

                        <button
                          className="small-btn"
                          onClick={() => respondOffer(offer.id, "accepted")}
                        >
                          Accept
                        </button>{" "}

                        <button
                          className="small-btn"
                          onClick={() => respondOffer(offer.id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      "Responded"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTasks = () => (
    <section className="panel">
      <h2>My Tasks</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {dashboard?.tasks?.length === 0 ? (
              <tr>
                <td colSpan="6">No tasks assigned yet.</td>
              </tr>
            ) : (
              dashboard?.tasks?.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.description || "No description"}</td>
                  <td>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusClass(task.status)}>
                      {task.status}
                    </span>
                  </td>
                  <td>{formatDate(task.due_date)}</td>
                  <td>
                    {task.status === "pending" && (
                      <button
                        className="small-btn"
                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                      >
                        Start
                      </button>
                    )}

                    {task.status !== "completed" && (
                      <button
                        className="small-btn"
                        onClick={() => updateTaskStatus(task.id, "completed")}
                      >
                        Complete
                      </button>
                    )}

                    {task.status === "completed" && "Done"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTrainings = () => (
    <section className="panel">
      <h2>My Trainings</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Training</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {dashboard?.trainings?.length === 0 ? (
              <tr>
                <td colSpan="7">No trainings assigned yet.</td>
              </tr>
            ) : (
              dashboard?.trainings?.map((training) => (
                <tr key={training.assignment_id}>
                  <td>{training.title}</td>
                  <td>{training.category || "General"}</td>
                  <td>{training.duration_hours} hrs</td>
                  <td>
                    <span className={getStatusClass(training.status)}>
                      {training.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${training.progress_percent}%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {training.progress_percent}%
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(training.due_date)}</td>
                  <td>
                    {training.status === "assigned" && (
                      <button
                        className="small-btn"
                        onClick={() =>
                          updateTrainingProgress(
                            training.assignment_id,
                            "in_progress",
                            50
                          )
                        }
                      >
                        Start
                      </button>
                    )}

                    {training.status !== "completed" && (
                      <button
                        className="small-btn"
                        onClick={() =>
                          updateTrainingProgress(
                            training.assignment_id,
                            "completed",
                            100
                          )
                        }
                      >
                        Complete
                      </button>
                    )}

                    {training.status === "completed" && "Done"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderProgress = () => (
    <section className="panel">
      <h2>My Progress</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Document Progress</h3>
          <strong>{dashboard?.summary?.document_progress_percent || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Task Progress</h3>
          <strong>{dashboard?.summary?.task_progress_percent || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Training Progress</h3>
          <strong>{dashboard?.summary?.training_progress_percent || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Overall Progress</h3>
          <strong>{dashboard?.summary?.overall_progress_percent || 0}%</strong>
        </div>
      </div>

      <div style={{ marginTop: "24px" }} className="panel">
        <h2>Overall Progress Bar</h2>

        <div className="progress-container">
          <div className="progress-bar-track">
            <div
              className="progress-bar"
              style={{
                width: `${dashboard?.summary?.overall_progress_percent || 0}%`,
              }}
            ></div>
          </div>
          <span className="progress-text">
            {dashboard?.summary?.overall_progress_percent || 0}%
          </span>
        </div>
      </div>
    </section>
  );

  const renderNotifications = () => (
    <section className="panel">
      <h2>My Notifications</h2>

      {unreadCount > 0 && (
        <button className="small-btn" onClick={markAllNotificationsRead}>
          Mark All as Read
        </button>
      )}

      <div style={{ marginTop: "18px" }} className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="6">No notifications yet.</td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr key={notification.id}>
                  <td>{notification.title}</td>
                  <td>{notification.message}</td>
                  <td>{notification.type}</td>
                  <td>
                    <span
                      className={
                        notification.is_read
                          ? "status-badge status-success"
                          : "status-badge status-warning"
                      }
                    >
                      {notification.is_read ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td>{formatDate(notification.created_at)}</td>
                  <td>
                    {!notification.is_read ? (
                      <button
                        className="small-btn"
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        Mark Read
                      </button>
                    ) : (
                      "Done"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderReports = () => (
    <section className="panel">
      <h2>My Onboarding Report</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Documents</h3>
          <strong>{dashboard?.summary?.total_documents || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Approved Documents</h3>
          <strong>{dashboard?.summary?.approved_documents || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Total Tasks</h3>
          <strong>{dashboard?.summary?.total_tasks || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Completed Tasks</h3>
          <strong>{dashboard?.summary?.completed_tasks || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Total Trainings</h3>
          <strong>{dashboard?.summary?.total_trainings || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Overall Progress</h3>
          <strong>{dashboard?.summary?.overall_progress_percent || 0}%</strong>
        </div>
      </div>
    </section>
  );

  const renderActiveSection = () => {
    if (activeSection === "dashboard") return renderDashboard();
    if (activeSection === "profile") return renderProfile();
    if (activeSection === "documents") return renderDocuments();
    if (activeSection === "offers") return renderOffers();
    if (activeSection === "tasks") return renderTasks();
    if (activeSection === "trainings") return renderTrainings();
    if (activeSection === "progress") return renderProgress();
    if (activeSection === "notifications") return renderNotifications();
    if (activeSection === "reports") return renderReports();

    return renderDashboard();
  };

  return (
    <div className="dashboard-page">
      <nav className="top-nav">
        <div>
          <h2>OnboardPro</h2>
          <span>Employee Dashboard</span>
        </div>

        <div className="nav-user">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={sidebarStyle}>
        <aside style={sideMenuStyle}>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              style={sideButtonStyle(activeSection === item.key)}
              onClick={() => {
                setActiveSection(item.key);
                setMessage("");
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main style={sectionStyle}>
          {message && <div className="info-message">{message}</div>}
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default EmployeeDashboard;