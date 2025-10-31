import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

type User = { username: string; groups: string[] };
type AuthState = {
  token?: string | null;
  user?: User | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("auth_token"),
  user: localStorage.getItem("auth_token")
    ? (jwtDecode(localStorage.getItem("auth_token") as string) as any)
    : null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem("auth_token", token);
      const decoded = jwtDecode(token) as any;
      set({
        token,
        user: { username: decoded.username, groups: decoded.groups || [] },
      });
    } else {
      localStorage.removeItem("auth_token");
      set({ token: null, user: null });
    }
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, user: null });
    // optional: redirect to /login handled by components
  },
}));

export function getToken() {
  return localStorage.getItem("sambahub_token");
}
export function clearAuth() {
  localStorage.removeItem("sambahub_token");
}

export default useAuthStore;
