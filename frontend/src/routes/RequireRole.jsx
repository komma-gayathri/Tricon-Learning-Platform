import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireRole = ({ allowed, children }) => {
  const { user } = useAuth();

  const hasRole = user && allowed.some(role => role.toUpperCase() === user.role?.toUpperCase());

  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireRole;
