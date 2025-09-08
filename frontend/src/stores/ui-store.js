import { create } from "zustand";

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  theme: "dark",
  isSettingsOpen: false,
  isUpgradePopupOpen: false,

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

  toggleUpgradePopup: () =>
    set((state) => ({
      isUpgradePopupOpen: !state.isUpgradePopupOpen,
    })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
