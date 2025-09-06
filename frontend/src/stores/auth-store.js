import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Login action
      login: (userData, token) =>
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
        const { token } = get();
        if (!token) return false;

        // In a real implementation, you would check if the token is still valid
        // For now, we'll just return true if token exists
        return true;
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
