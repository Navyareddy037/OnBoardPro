import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser, logout } from "../utils/auth";

function HRDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [employeeRecords, setEmployeeRecords] = useState([]);
  const [employeesProgress, setEmployeesProgress] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [trainingAssignments, setTrainingAssignments] = useState([]);
  const [offerLetters, setOfferLetters] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedReport, setSelectedReport] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    employee_code: "",
    department: "",
    designation: "",
    phone: "",
    joining_date: "",
  });

  const [profileForm, setProfileForm] = useState({
    employee_id: "",
    name: "",
    department: "",
    designation: "",
    phone: "",
    joining_date: "",
  });

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

  const [departmentForm, setDepartmentForm] = useState({
    employee_id: "",
    department: "",
    designation: "",
  });

  const [offerLetterForm, setOfferLetterForm] = useState({
    employee_id: "",
    title: "",
    remarks: "",
    file: null,
  });

  const [notificationForm, setNotificationForm] = useState({
    employee_id: "",
    title: "",
    message: "",
    type: "general",
    send_to_all: false,
  });

  const [documentRemarks, setDocumentRemarks] = useState({});

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Employee Registration" },
    { key: "profiles", label: "Profile Management" },
    { key: "documents", label: "Documents" },
    { key: "offers", label: "Offer Letters" },
    { key: "trainings", label: "Trainings" },
    { key: "tasks", label: "Tasks" },
    { key: "departments", label: "Departments" },
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

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
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

  const userToken = localStorage.getItem("onboardpro_token");

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

  const formatDateForInput = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return new Date(dateValue).toISOString().split("T")[0];
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

  const getEmployeeName = (employeeId) => {
    const employee = employeeRecords.find(
      (item) => Number(item.employee_id) === Number(employeeId)
    );

    if (!employee) {
      return "Unknown Employee";
    }

    return `${employee.name} - ${employee.employee_code}`;
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        employeesResponse,
        progressResponse,
        documentsResponse,
        tasksResponse,
        trainingsResponse,
        trainingAssignmentsResponse,
        offersResponse,
        notificationsResponse,
      ] = await Promise.all([
        API.get("/reports/dashboard"),
        API.get("/hr/employees"),
        API.get("/reports/onboarding-progress"),
        API.get("/documents/hr/documents"),
        API.get("/tasks"),
        API.get("/trainings"),
        API.get("/trainings/assignments/all"),
        API.get("/offers"),
        API.get("/notifications"),
      ]);

      setDashboard(dashboardResponse.data.dashboard);
      setEmployeeRecords(employeesResponse.data.employees || []);
      setEmployeesProgress(progressResponse.data.employees || []);
      setDocuments(documentsResponse.data.documents || []);
      setTasks(tasksResponse.data.tasks || []);
      setTrainings(trainingsResponse.data.trainings || []);
      setTrainingAssignments(trainingAssignmentsResponse.data.assignments || []);
      setOfferLetters(offersResponse.data.offer_letters || []);
      setNotifications(notificationsResponse.data.notifications || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load HR dashboard. Check backend routes and database tables."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (event) => {
    setEmployeeForm({
      ...employeeForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleProfileEmployeeSelect = (event) => {
    const employeeId = event.target.value;

    const employee = employeeRecords.find(
      (item) => Number(item.employee_id) === Number(employeeId)
    );

    if (!employee) {
      setProfileForm({
        employee_id: "",
        name: "",
        department: "",
        designation: "",
        phone: "",
        joining_date: "",
      });

      return;
    }

    setProfileForm({
      employee_id: employee.employee_id,
      name: employee.name || "",
      department: employee.department || "",
      designation: employee.designation || "",
      phone: employee.phone || "",
      joining_date: formatDateForInput(employee.joining_date),
    });
  };

  const handleProfileChange = (event) => {
    setProfileForm({
      ...profileForm,
      [event.target.name]: event.target.value,
    });
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

  const handleDepartmentChange = (event) => {
    const { name, value } = event.target;

    if (name === "employee_id") {
      const employee = employeeRecords.find(
        (item) => Number(item.employee_id) === Number(value)
      );

      setDepartmentForm({
        employee_id: value,
        department: employee?.department || "",
        designation: employee?.designation || "",
      });

      return;
    }

    setDepartmentForm({
      ...departmentForm,
      [name]: value,
    });
  };

  const handleOfferLetterChange = (event) => {
    const { name, value, files } = event.target;

    setOfferLetterForm({
      ...offerLetterForm,
      [name]: files ? files[0] : value,
    });
  };

  const handleNotificationChange = (event) => {
    const { name, value, type, checked } = event.target;

    setNotificationForm({
      ...notificationForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addEmployee = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await API.post("/hr/employees", employeeForm);

      setMessage("Employee/Manager added successfully.");

      setEmployeeForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        employee_code: "",
        department: "",
        designation: "",
        phone: "",
        joining_date: "",
      });

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to add employee."
      );
    }
  };

  const updateEmployeeProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!profileForm.employee_id) {
      setMessage("Please select an employee first.");
      return;
    }

    try {
      const payload = {};

      if (profileForm.name) payload.name = profileForm.name;
      if (profileForm.department) payload.department = profileForm.department;
      if (profileForm.designation) payload.designation = profileForm.designation;
      if (profileForm.phone) payload.phone = profileForm.phone;
      if (profileForm.joining_date) payload.joining_date = profileForm.joining_date;

      await API.put(`/hr/employees/${profileForm.employee_id}`, payload);

      setMessage("Employee profile updated successfully.");
      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update profile."
      );
    }
  };

  const updateEmployeeAccountStatus = async (employeeId, isActive) => {
    setMessage("");

    try {
      await API.patch(`/hr/employees/${employeeId}/account-status`, {
        is_active: isActive,
      });

      setMessage(
        isActive
          ? "Employee account activated successfully."
          : "Employee account deactivated successfully."
      );

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update account status."
      );
    }
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

      loadDashboard();
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
      loadDashboard();
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
      loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete task.");
    }
  };

  const verifyDocument = async (documentId, status) => {
    setMessage("");

    try {
      await API.patch(`/documents/hr/documents/${documentId}/verify`, {
        status,
        remarks: documentRemarks[documentId] || "",
      });

      setMessage(
        status === "approved"
          ? "Document approved successfully."
          : "Document rejected successfully."
      );

      setDocumentRemarks({
        ...documentRemarks,
        [documentId]: "",
      });

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to verify document."
      );
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

      loadDashboard();
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

      loadDashboard();
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
      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update training."
      );
    }
  };

  const updateDepartment = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!departmentForm.employee_id) {
      setMessage("Please select an employee.");
      return;
    }

    try {
      await API.put(`/hr/employees/${departmentForm.employee_id}`, {
        department: departmentForm.department,
        designation: departmentForm.designation,
      });

      setMessage("Department and designation updated successfully.");

      setDepartmentForm({
        employee_id: "",
        department: "",
        designation: "",
      });

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update department."
      );
    }
  };

  const updateEmployeeStatus = async (employeeId, onboardingStatus) => {
    setMessage("");

    try {
      await API.patch(`/hr/employees/${employeeId}/status`, {
        onboarding_status: onboardingStatus,
      });

      setMessage("Employee onboarding status updated successfully.");
      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to update employee status."
      );
    }
  };

  const uploadOfferLetter = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!offerLetterForm.file) {
      setMessage("Please choose an offer letter PDF.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("employee_id", offerLetterForm.employee_id);
      formData.append("title", offerLetterForm.title);
      formData.append("remarks", offerLetterForm.remarks);
      formData.append("offer_letter", offerLetterForm.file);

      await API.post("/offers/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Offer letter uploaded successfully.");

      setOfferLetterForm({
        employee_id: "",
        title: "",
        remarks: "",
        file: null,
      });

      event.target.reset();

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to upload offer letter."
      );
    }
  };

  const revokeOfferLetter = async (offerId) => {
    setMessage("");

    const confirmRevoke = window.confirm(
      "Are you sure you want to revoke this offer letter?"
    );

    if (!confirmRevoke) {
      return;
    }

    try {
      await API.patch(`/offers/${offerId}/revoke`);

      setMessage("Offer letter revoked successfully.");
      loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to revoke offer letter.");
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

      loadDashboard();
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
      loadDashboard();
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
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading HR Dashboard...</div>;
  }

  const renderDashboard = () => (
    <>
      <section className="hero-card">
        <h1>Welcome, HR Admin</h1>
        <p>
          Manage all onboarding activities from one secure HR dashboard.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <strong>{dashboard?.employees?.total_employees || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Completed Onboarding</h3>
          <strong>{dashboard?.employees?.completed_onboarding || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Pending Documents</h3>
          <strong>{dashboard?.documents?.pending_documents || 0}</strong>
        </div>

        <div className="stat-card">
          <h3>Overdue Tasks</h3>
          <strong>{dashboard?.tasks?.overdue_tasks || 0}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Quick Overview</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Total</th>
                <th>Pending / Active</th>
                <th>Completed / Approved</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Documents</td>
                <td>{dashboard?.documents?.total_documents || 0}</td>
                <td>{dashboard?.documents?.pending_documents || 0}</td>
                <td>{dashboard?.documents?.approved_documents || 0}</td>
              </tr>

              <tr>
                <td>Tasks</td>
                <td>{dashboard?.tasks?.total_tasks || 0}</td>
                <td>{dashboard?.tasks?.pending_tasks || 0}</td>
                <td>{dashboard?.tasks?.completed_tasks || 0}</td>
              </tr>

              <tr>
                <td>Trainings</td>
                <td>{dashboard?.trainings?.total_training_assignments || 0}</td>
                <td>{dashboard?.trainings?.assigned_trainings || 0}</td>
                <td>{dashboard?.trainings?.completed_trainings || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderRegistration = () => (
    <section className="panel">
      <h2>Employee Registration</h2>

      <form className="grid-form" onSubmit={addEmployee}>
        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={employeeForm.name}
          onChange={handleEmployeeChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={employeeForm.email}
          onChange={handleEmployeeChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={employeeForm.password}
          onChange={handleEmployeeChange}
          required
        />

        <select
          name="role"
          value={employeeForm.role}
          onChange={handleEmployeeChange}
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>

        <input
          type="text"
          name="employee_code"
          placeholder="Employee Code"
          value={employeeForm.employee_code}
          onChange={handleEmployeeChange}
          required
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={employeeForm.department}
          onChange={handleEmployeeChange}
          required
        />

        <input
          type="text"
          name="designation"
          placeholder="Designation"
          value={employeeForm.designation}
          onChange={handleEmployeeChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={employeeForm.phone}
          onChange={handleEmployeeChange}
        />

        <input
          type="date"
          name="joining_date"
          value={employeeForm.joining_date}
          onChange={handleEmployeeChange}
        />

        <button type="submit">Add Employee / Manager</button>
      </form>
    </section>
  );

  const renderProfiles = () => (
    <>
      <section className="panel">
        <h2>Profile Management</h2>

        <form className="grid-form" onSubmit={updateEmployeeProfile}>
          <select
            name="employee_id"
            value={profileForm.employee_id}
            onChange={handleProfileEmployeeSelect}
            required
          >
            <option value="">Select Employee</option>

            {employeeRecords.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={profileForm.name}
            onChange={handleProfileChange}
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={profileForm.department}
            onChange={handleProfileChange}
          />

          <input
            type="text"
            name="designation"
            placeholder="Designation"
            value={profileForm.designation}
            onChange={handleProfileChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={profileForm.phone}
            onChange={handleProfileChange}
          />

          <input
            type="date"
            name="joining_date"
            value={profileForm.joining_date}
            onChange={handleProfileChange}
          />

          <button type="submit">Update Profile</button>
        </form>
      </section>

      <section className="panel">
        <h2>All Employee Profiles</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Account</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employeeRecords.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_code}</td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.role}</td>
                  <td>{employee.department}</td>
                  <td>{employee.designation}</td>
                  <td>
                    <span
                      className={
                        employee.is_active
                          ? "status-badge status-success"
                          : "status-badge status-danger"
                      }
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {employee.is_active ? (
                      <button
                        className="small-btn"
                        onClick={() =>
                          updateEmployeeAccountStatus(employee.employee_id, false)
                        }
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="small-btn"
                        onClick={() =>
                          updateEmployeeAccountStatus(employee.employee_id, true)
                        }
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderDocuments = () => (
    <section className="panel">
      <h2>Document Upload & Verification</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Document</th>
              <th>File</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Download</th>
              <th>Verify</th>
            </tr>
          </thead>

          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="7">No documents uploaded yet.</td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id}>
                  <td>{document.employee_name}</td>
                  <td>{document.document_type}</td>
                  <td>{document.original_name}</td>
                  <td>
                    <span className={getStatusClass(document.status)}>
                      {document.status}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Verification remarks"
                      value={documentRemarks[document.id] || ""}
                      onChange={(event) =>
                        setDocumentRemarks({
                          ...documentRemarks,
                          [document.id]: event.target.value,
                        })
                      }
                    />
                  </td>
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
                  <td>
                    <button
                      className="small-btn"
                      onClick={() => verifyDocument(document.id, "approved")}
                    >
                      Approve
                    </button>{" "}
                    <button
                      className="small-btn"
                      onClick={() => verifyDocument(document.id, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderOffers = () => (
    <>
      <section className="panel">
        <h2>Offer Letter Management</h2>

        <form className="grid-form" onSubmit={uploadOfferLetter}>
          <select
            name="employee_id"
            value={offerLetterForm.employee_id}
            onChange={handleOfferLetterChange}
            required
          >
            <option value="">Select Employee</option>

            {employeeRecords.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="title"
            placeholder="Offer letter title"
            value={offerLetterForm.title}
            onChange={handleOfferLetterChange}
            required
          />

          <input
            type="text"
            name="remarks"
            placeholder="Remarks"
            value={offerLetterForm.remarks}
            onChange={handleOfferLetterChange}
          />

          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleOfferLetterChange}
            required
          />

          <button type="submit">Upload Offer Letter</button>
        </form>
      </section>

      <section className="panel">
        <h2>Issued Offer Letters</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Title</th>
                <th>File</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Download</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {offerLetters.length === 0 ? (
                <tr>
                  <td colSpan="7">No offer letters issued yet.</td>
                </tr>
              ) : (
                offerLetters.map((offer) => (
                  <tr key={offer.id}>
                    <td>{offer.employee_name}</td>
                    <td>{offer.title}</td>
                    <td>{offer.original_name}</td>
                    <td>
                      <span className={getStatusClass(offer.status)}>
                        {offer.status}
                      </span>
                    </td>
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
                      {offer.status !== "revoked" ? (
                        <button
                          className="small-btn"
                          onClick={() => revokeOfferLetter(offer.id)}
                        >
                          Revoke
                        </button>
                      ) : (
                        "Revoked"
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

  const renderTrainings = () => (
    <>
      <section className="panel">
        <h2>Training & Orientation Tracking</h2>

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

            {employeeRecords.map((employee) => (
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
                    <td>{assignment.progress_percent}%</td>
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

  const renderTasks = () => (
    <>
      <section className="panel">
        <h2>Task Assignment</h2>

        <form className="grid-form" onSubmit={assignTask}>
          <select
            name="employee_id"
            value={taskForm.employee_id}
            onChange={handleTaskChange}
            required
          >
            <option value="">Select Employee</option>

            {employeeRecords.map((employee) => (
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
        <h2>All Assigned Tasks</h2>

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

  const renderDepartments = () => (
    <>
      <section className="panel">
        <h2>Department Allocation</h2>

        <form className="grid-form" onSubmit={updateDepartment}>
          <select
            name="employee_id"
            value={departmentForm.employee_id}
            onChange={handleDepartmentChange}
            required
          >
            <option value="">Select Employee</option>

            {employeeRecords.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} - {employee.employee_code}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={departmentForm.department}
            onChange={handleDepartmentChange}
            required
          />

          <input
            type="text"
            name="designation"
            placeholder="Designation"
            value={departmentForm.designation}
            onChange={handleDepartmentChange}
            required
          />

          <button type="submit">Update Department</button>
        </form>
      </section>

      <section className="panel">
        <h2>Department List</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Department</th>
                <th>Designation</th>
              </tr>
            </thead>

            <tbody>
              {employeeRecords.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.name}</td>
                  <td>{employee.employee_code}</td>
                  <td>{employee.department}</td>
                  <td>{employee.designation}</td>
                </tr>
              ))}
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
              <th>Department</th>
              <th>Document Progress</th>
              <th>Task Progress</th>
              <th>Training Progress</th>
              <th>Overall</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {employeesProgress.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.name}</td>
                <td>{employee.department}</td>
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
                  <select
                    value={employee.onboarding_status}
                    onChange={(event) =>
                      updateEmployeeStatus(
                        employee.employee_id,
                        event.target.value
                      )
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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
        <h2>Notifications & Reminders</h2>

        <form className="grid-form" onSubmit={sendNotification}>
          <select
            name="employee_id"
            value={notificationForm.employee_id}
            onChange={handleNotificationChange}
            disabled={notificationForm.send_to_all}
            required={!notificationForm.send_to_all}
          >
            <option value="">Select Employee</option>

            {employeeRecords.map((employee) => (
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
            <h3>Active Accounts</h3>
            <strong>{dashboard?.employees?.active_accounts || 0}</strong>
          </div>

          <div className="stat-card">
            <h3>Total Documents</h3>
            <strong>{dashboard?.documents?.total_documents || 0}</strong>
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
            <h3>Training Avg Progress</h3>
            <strong>
              {dashboard?.trainings?.average_training_progress || 0}%
            </strong>
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

          {employeeRecords.map((employee) => (
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
    if (activeSection === "registration") return renderRegistration();
    if (activeSection === "profiles") return renderProfiles();
    if (activeSection === "documents") return renderDocuments();
    if (activeSection === "offers") return renderOffers();
    if (activeSection === "trainings") return renderTrainings();
    if (activeSection === "tasks") return renderTasks();
    if (activeSection === "departments") return renderDepartments();
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
          <span>Secure HR Dashboard</span>
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

export default HRDashboard;