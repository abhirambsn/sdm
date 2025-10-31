import { useNavigate } from "react-router";
import { AuthService } from "../services/auth.service";
import useAuthStore from "../store/useAuth";
import { useState } from "react";

const LoginPage = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.login({ username, password });
      setToken(res.accessToken);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border rounded p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">Sign in to Sentinel Directory Manager</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full text-gray-900 dark:text-gray-50 p-2 border rounded bg-gray-50 dark:bg-gray-700"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full text-gray-900 dark:text-gray-50 p-2 border rounded bg-gray-50 dark:bg-gray-700"
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
