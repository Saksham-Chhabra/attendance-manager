import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      login: async (email, password, expectedRole) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.data.status === 'success') {
            const loggedInUser = res.data.data.user;
            
            // Validate that the user actually possesses the role they tried to log in as
            if (expectedRole && loggedInUser.role !== expectedRole) {
               // Log them out quietly on backend since we generated a token, but reject frontend state
               await api.post('/auth/logout');
               throw new Error(`Unauthorized. This account is provisioned as a ${loggedInUser.role}.`);
            }

            set({
              user: loggedInUser,
              token: res.data.token,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          throw new Error(error.response?.data?.message || error.message || 'Login failed');
        }
      },

      register: async (userData) => {
        try {
          const res = await api.post('/auth/register', userData);
          if (res.data.status === 'success') {
            set({
              user: res.data.data.user,
              token: res.data.token,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Registration failed');
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error', error);
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
          // Optional: redirect to login
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Don't persist token in localStorage, only user data for fast UI re-hydration. Token lives in memory/cookies.
    }
  )
);

export default useAuthStore;
