import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/useAuth";

const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);
  console.log('[DEBUG] ProtectedRoute token:', token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
