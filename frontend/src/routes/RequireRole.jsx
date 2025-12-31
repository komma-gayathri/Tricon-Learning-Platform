import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireRole = ({ allowed, children }) => {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireRole;
