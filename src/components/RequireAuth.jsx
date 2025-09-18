import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    // guarda “de onde veio” para pós-login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
