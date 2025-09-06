import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Login action (supports both token and cookie-based auth)
      login: (userData, token = null) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        }),

      // Logout action
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      // Check if user is authenticated
      checkAuth: () => {
        const { isAuthenticated } = get();
        return isAuthenticated;
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
