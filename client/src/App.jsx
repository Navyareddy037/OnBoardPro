import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HRDashboard from "./pages/HRDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import NotFound from "./pages/NotFound";

import { getDashboardPath, getUser, isLoggedIn } from "./utils/auth";

function HomeRedirect() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  return <Navigate to={getDashboardPath(user.role)} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/hr-dashboard"
        element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager-dashboard"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee-dashboard"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;