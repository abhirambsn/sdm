import { create } from "zustand";

export interface AppState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  systemStats: any;
  setSystemStats: (stats: any) => void;
}

export const useAppState = create<AppState>((set) => ({
  systemStats: null,
  loading: false,
  setSystemStats: (stats) => set({ systemStats: stats }),
  setLoading: (loading) => set({ loading }),
}))