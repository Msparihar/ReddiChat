import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  isSettingsOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  toggleSettings: () => void;
  closeMobileSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  isSettingsOpen: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  toggleSettings: () =>
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
}));
