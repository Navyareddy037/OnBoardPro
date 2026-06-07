import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser, logout } from "../utils/auth";

function ManagerDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [employeesProgress, setEmployeesProgress] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [trainingAssignments, setTrainingAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [taskForm, setTaskForm] = useState({
    employee_id: "",
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });

  const [trainingForm, setTrainingForm] = useState({
    title: "",
    description: "",
    category: "",
    duration_hours: 1,
  });

  const [assignTrainingForm, setAssignTrainingForm] = useState({
    training_id: "",
    employee_id: "",
    due_date: "",
  });

  const [notificationForm, setNotificationForm] = useState({
    employee_id: "",
    title: "",
    message: "",
    type: "general",
    send_to_all: false,
  });

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "employees", label: "Employees" },
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

  const loadManagerData = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        progressResponse,
        tasksResponse,
        trainingsResponse,
        trainingAssignmentsResponse,
        notificationsResponse,
      ] = await Promise.all([
        API.get("/reports/dashboard"),
        API.get("/reports/onboarding-progress"),
        API.get("/tasks"),
        API.get("/trainings"),
        API.get("/trainings/assignments/all"),
        API.get("/notifications"),
      ]);

      setDashboard(dashboardResponse.data.dashboard);
      setEmployeesProgress(progressResponse.data.employees || []);
      setTasks(tasksResponse.data.tasks || []);
      setTrainings(trainingsResponse.data.trainings || []);
      setTrainingAssignments(trainingAssignmentsResponse.data.assignments || []);
      setNotifications(notificationsResponse.data.notifications || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load manager dashboard. Check backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (event) => {
    setTaskForm({
      ...taskForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleTrainingChange = (event) => {
    setTrainingForm({
      ...trainingForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleAssignTrainingChange = (event) => {
    setAssignTrainingForm({
      ...assignTrainingForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleNotificationChange = (event) => {
    const { name, value, type, checked } = event.target;

    setNotificationForm({
      ...notificationForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const assignTask = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        employee_id: taskForm.employee_id,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
      };

      if (taskForm.due_date) {
        payload.due_date = taskForm.due_date;
      }

      await API.post("/tasks", payload);

      setMessage("Task assigned successfully.");

      setTaskForm({
        employee_id: "",
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
      });

      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to assign task."
      );
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    setMessage("");

    try {
      await API.patch(`/tasks/${taskId}/status`, { status });

      setMessage("Task status updated successfully.");
      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update task status."
      );
    }
  };

  const deleteTask = async (taskId) => {
    setMessage("");

    const confirmDelete = window.confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) {
      return;
    }

    try {
      await API.delete(`/tasks/${taskId}`);

      setMessage("Task deleted successfully.");
      loadManagerData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete task.");
    }
  };

  const createTraining = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await API.post("/trainings", {
        ...trainingForm,
        duration_hours: Number(trainingForm.duration_hours),
      });

      setMessage("Training created successfully.");

      setTrainingForm({
        title: "",
        description: "",
        category: "",
        duration_hours: 1,
      });

      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to create training."
      );
    }
  };

  const assignTraining = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        training_id: assignTrainingForm.training_id,
        employee_id: assignTrainingForm.employee_id,
      };

      if (assignTrainingForm.due_date) {
        payload.due_date = assignTrainingForm.due_date;
      }

      await API.post("/trainings/assign", payload);

      setMessage("Training assigned successfully.");

      setAssignTrainingForm({
        training_id: "",
        employee_id: "",
        due_date: "",
      });

      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to assign training."
      );
    }
  };

  const completeTrainingAssignment = async (assignmentId) => {
    setMessage("");

    try {
      await API.patch(`/trainings/assignments/${assignmentId}/progress`, {
        status: "completed",
        progress_percent: 100,
      });

      setMessage("Training marked as completed.");
      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update training."
      );
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        send_to_all: notificationForm.send_to_all,
      };

      if (!notificationForm.send_to_all) {
        payload.employee_id = notificationForm.employee_id;
      }

      await API.post("/notifications", payload);

      setMessage("Notification sent successfully.");

      setNotificationForm({
        employee_id: "",
        title: "",
        message: "",
        type: "general",
        send_to_all: false,
      });

      loadManagerData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to send notification."
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    setMessage("");

    try {
      await API.delete(`/notifications/${notificationId}`);

      setMessage("Notification deleted successfully.");
      loadManagerData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete notification.");
    }
  };

  const loadEmployeeReport = async (employeeId) => {
    setMessage("");

    if (!employeeId) {
      setSelectedReport(null);
      return;
    }

    try {
      const response = await API.get(`/reports/employee/${employeeId}`);
      setSelectedReport(response.data.report);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load employee report.");
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading Manager Dashboard...</div>;
  }

  const renderDashboard = () => (
    <>
      <section className="hero-card">
        <h1>Welcome, Manager</h1>
        <p>
          Assign tasks, manage training, monitor employees, send reminders, and view reports.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <strong>{dashboard?.employees?.total_employees || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>In Progress</h3>
          <strong>{dashboard?.employees?.in_progress_onboarding || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Total Tasks</h3>
          <strong>{dashboard?.tasks?.total_tasks || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Completed Tasks</h3>
          <strong>{dashboard?.tasks?.completed_tasks || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Training Progress</h3>
          <strong>{dashboard?.trainings?.average_training_progress || 0}%</strong>
        </div>

        <div className="stat-card">
          <h3>Overdue Tasks</h3>
          <strong>{dashboard?.tasks?.overdue_tasks || 0}</strong>
        </div>
      </section>
    </>
  );

  const renderEmployees = () => (
    <section className="panel">
      <h2>Employee Monitoring</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Overall Progress</th>
            </tr>
          </thead>

          <tbody>
            {employeesProgress.length === 0 ? (
              <tr>
                <td colSpan="7">No employees found.</td>
              </tr>
            ) : (
              employeesProgress.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_code}</td>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.department}</td>
                  <td>{employee.designation}</td>
                  <td>
                    <span className={getStatusClass(employee.onboarding_status)}>
                      {employee.onboarding_status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${employee.overall_progress_percent}%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {employee.overall_progress_percent}%
                      </span>
                    </div>
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
    <>
      <section className="panel">
        <h2>Assign Task</h2>

        <form className="grid-form" onSubmit={assignTask}>
          <select
            name="employee_id"
            value={taskForm.employee_id}
            onChange={handleTaskChange}
            required
          >
            <option value="">Select Employee</option>

            {employeesProgress.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="title"
            placeholder="Task title"
            value={taskForm.title}
            onChange={handleTaskChange}
            required
          />

          <input
            type="text"
            name="description"
            placeholder="Task description"
            value={taskForm.description}
            onChange={handleTaskChange}
          />

          <select
            name="priority"
            value={taskForm.priority}
            onChange={handleTaskChange}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            name="due_date"
            value={taskForm.due_date}
            onChange={handleTaskChange}
          />

          <button type="submit">Assign Task</button>
        </form>
      </section>

      <section className="panel">
        <h2>All Tasks</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Employee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6">No tasks assigned yet.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.employee_name}</td>
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
                      {task.status !== "completed" && (
                        <>
                          <button
                            className="small-btn"
                            onClick={() => updateTaskStatus(task.id, "in_progress")}
                          >
                            In Progress
                          </button>{" "}
                          <button
                            className="small-btn"
                            onClick={() => updateTaskStatus(task.id, "completed")}
                          >
                            Complete
                          </button>{" "}
                        </>
                      )}

                      <button
                        className="small-btn"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
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

  const renderTrainings = () => (
    <>
      <section className="panel">
        <h2>Create Training</h2>

        <form className="grid-form" onSubmit={createTraining}>
          <input
            type="text"
            name="title"
            placeholder="Training title"
            value={trainingForm.title}
            onChange={handleTrainingChange}
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={trainingForm.category}
            onChange={handleTrainingChange}
          />

          <input
            type="number"
            name="duration_hours"
            min="1"
            placeholder="Duration hours"
            value={trainingForm.duration_hours}
            onChange={handleTrainingChange}
          />

          <textarea
            name="description"
            placeholder="Training description"
            value={trainingForm.description}
            onChange={handleTrainingChange}
            style={textareaStyle}
          ></textarea>

          <button type="submit">Create Training</button>
        </form>
      </section>

      <section className="panel">
        <h2>Assign Training</h2>

        <form className="grid-form" onSubmit={assignTraining}>
          <select
            name="training_id"
            value={assignTrainingForm.training_id}
            onChange={handleAssignTrainingChange}
            required
          >
            <option value="">Select Training</option>

            {trainings.map((training) => (
              <option key={training.id} value={training.id}>
                {training.title}
              </option>
            ))}
          </select>

          <select
            name="employee_id"
            value={assignTrainingForm.employee_id}
            onChange={handleAssignTrainingChange}
            required
          >
            <option value="">Select Employee</option>

            {employeesProgress.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="due_date"
            value={assignTrainingForm.due_date}
            onChange={handleAssignTrainingChange}
          />

          <button type="submit">Assign Training</button>
        </form>
      </section>

      <section className="panel">
        <h2>Training Assignments</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Training</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {trainingAssignments.length === 0 ? (
                <tr>
                  <td colSpan="6">No training assignments yet.</td>
                </tr>
              ) : (
                trainingAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.training_title}</td>
                    <td>{assignment.employee_name}</td>
                    <td>
                      <span className={getStatusClass(assignment.status)}>
                        {assignment.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-container">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${assignment.progress_percent}%`,
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {assignment.progress_percent}%
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(assignment.due_date)}</td>
                    <td>
                      {assignment.status !== "completed" ? (
                        <button
                          className="small-btn"
                          onClick={() =>
                            completeTrainingAssignment(assignment.id)
                          }
                        >
                          Mark Complete
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
    </>
  );

  const renderProgress = () => (
    <section className="panel">
      <h2>Progress Monitoring</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Document Progress</th>
              <th>Task Progress</th>
              <th>Training Progress</th>
              <th>Overall Progress</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {employeesProgress.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.name}</td>
                <td>{employee.document_progress_percent}%</td>
                <td>{employee.task_progress_percent}%</td>
                <td>{employee.training_progress_percent}%</td>
                <td>
                  <div className="progress-container">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${employee.overall_progress_percent}%`,
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {employee.overall_progress_percent}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={getStatusClass(employee.onboarding_status)}>
                    {employee.onboarding_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderNotifications = () => (
    <>
      <section className="panel">
        <h2>Send Notification / Reminder</h2>

        <form className="grid-form" onSubmit={sendNotification}>
          <select
            name="employee_id"
            value={notificationForm.employee_id}
            onChange={handleNotificationChange}
            disabled={notificationForm.send_to_all}
            required={!notificationForm.send_to_all}
          >
            <option value="">Select Employee</option>

            {employeesProgress.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <select
            name="type"
            value={notificationForm.type}
            onChange={handleNotificationChange}
          >
            <option value="general">General</option>
            <option value="task">Task</option>
            <option value="document">Document</option>
            <option value="training">Training</option>
            <option value="offer">Offer</option>
            <option value="reminder">Reminder</option>
            <option value="progress">Progress</option>
          </select>

          <input
            type="text"
            name="title"
            placeholder="Notification title"
            value={notificationForm.title}
            onChange={handleNotificationChange}
            required
          />

          <textarea
            name="message"
            placeholder="Notification message"
            value={notificationForm.message}
            onChange={handleNotificationChange}
            style={textareaStyle}
            required
          ></textarea>

          <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="checkbox"
              name="send_to_all"
              checked={notificationForm.send_to_all}
              onChange={handleNotificationChange}
            />
            Send to all active employees
          </label>

          <button type="submit">Send Notification</button>
        </form>
      </section>

      <section className="panel">
        <h2>All Notifications</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Receiver</th>
                <th>Title</th>
                <th>Message</th>
                <th>Type</th>
                <th>Read</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="7">No notifications yet.</td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.receiver_name}</td>
                    <td>{notification.title}</td>
                    <td>{notification.message}</td>
                    <td>{notification.type}</td>
                    <td>{notification.is_read ? "Yes" : "No"}</td>
                    <td>{formatDate(notification.created_at)}</td>
                    <td>
                      <button
                        className="small-btn"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        Delete
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

  const renderReports = () => (
    <>
      <section className="panel">
        <h2>Reports & Analytics</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <strong>{dashboard?.employees?.total_employees || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Total Tasks</h3>
            <strong>{dashboard?.tasks?.total_tasks || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Completed Tasks</h3>
            <strong>{dashboard?.tasks?.completed_tasks || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Overdue Tasks</h3>
            <strong>{dashboard?.tasks?.overdue_tasks || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Total Trainings</h3>
            <strong>{dashboard?.trainings?.total_training_assignments || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Training Avg Progress</h3>
            <strong>{dashboard?.trainings?.average_training_progress || 0}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Employee-wise Report</h2>

        <select
          onChange={(event) => loadEmployeeReport(event.target.value)}
          defaultValue=""
        >
          <option value="">Select Employee</option>

          {employeesProgress.map((employee) => (
            <option key={employee.employee_id} value={employee.employee_id}>
              {employee.name} - {employee.employee_code}
            </option>
          ))}
        </select>

        {selectedReport && (
          <div style={{ marginTop: "24px" }}>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Documents</h3>
                <strong>
                  {selectedReport.summary.approved_documents}/
                  {selectedReport.summary.total_documents}
                </strong>
              </div>

              <div className="stat-card">
                <h3>Tasks</h3>
                <strong>
                  {selectedReport.summary.completed_tasks}/
                  {selectedReport.summary.total_tasks}
                </strong>
              </div>

              <div className="stat-card">
                <h3>Trainings</h3>
                <strong>
                  {selectedReport.summary.completed_trainings}/
                  {selectedReport.summary.total_trainings}
                </strong>
              </div>

              <div className="stat-card">
                <h3>Overall Progress</h3>
                <strong>{selectedReport.summary.overall_progress_percent}%</strong>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );

  const renderActiveSection = () => {
    if (activeSection === "dashboard") return renderDashboard();
    if (activeSection === "employees") return renderEmployees();
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
          <span>Manager Dashboard</span>
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

export default ManagerDashboard;