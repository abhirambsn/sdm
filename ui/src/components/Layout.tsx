import { NavLink, Outlet } from "react-router";
import useAuthStore from "../store/useAuth";
import useTheme from "../store/useTheme";
import Topbar from "./Topbar";
import { CloudIcon, GroupIcon, LogsIcon, UserIcon, UsersIcon } from "lucide-react";

const Layout = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const theme = useTheme((state) => state.theme);
  const toggle = useTheme((state) => state.toggle);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <aside className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-center">SDM</h2>
          <button
            onClick={toggle}
            title="Toggle theme"
            className="text-sm px-2 py-1 border rounded"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-700"
                : "flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            <UserIcon size="1.2rem" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-700"
                : "flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            <UsersIcon size="1.2rem" />
            <span>Users</span>
          </NavLink>
          <NavLink
            to="/groups"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-700"
                : "flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            <GroupIcon size="1.2rem" />
            <span>Groups</span>
          </NavLink>
          <NavLink
            to="/backups"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-700"
                : "flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            <CloudIcon size="1.2rem" />
            <span>Backups</span>
          </NavLink>
          <NavLink
            to="/audit"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-700"
                : "flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            <LogsIcon size="1.2rem" />
            <span>Audit Logs</span>
          </NavLink>
        </nav>

        <div className="mt-8">
          <div className="text-xs text-gray-500 mb-2">Signed in as</div>
          <div className="text-sm font-medium">{user?.username}</div>
          <button
            className="mt-4 text-sm text-red-500"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
