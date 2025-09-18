import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // ajuste o path se for diferente

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-600">
        Carregando sessão...
      </div>
    );
  }

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  return children;
}
