import { create } from "zustand";

export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  theme: "dark",
  isSettingsOpen: false,

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),

  toggleSettings: () =>
    set((state) => ({
      isSettingsOpen: !state.isSettingsOpen,
    })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
