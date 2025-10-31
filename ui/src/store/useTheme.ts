import { create } from "zustand";

type ThemeState = {
  theme: "light" | "dark";
  toggle: () => void;
  set: (t: "light" | "dark") => void;
};

const useTheme = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as "light" | "dark") || "light",
  toggle: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      if (next === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return { theme: next };
    }),
  set: (theme) => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    set({ theme });
  },
}));

const initTheme = (localStorage.getItem("theme") === "dark");
if (initTheme) document.documentElement.classList.add("dark");

export default useTheme;