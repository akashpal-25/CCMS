import { create } from 'zustand';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: !!authService.getCurrentUser(),
  isLoading: false,
  error: null,

  checkEmail: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.checkEmail(email);
      set({ isLoading: false });
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Something went wrong. Please try again.');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  createPassword: async (email, password, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.createPassword(email, password, confirmPassword);
      set({ isLoading: false });
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Could not create password.');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await authService.login(email, password);
      set({ user: profile, isAuthenticated: true, isLoading: false });
      return profile;
    } catch (err) {
      const message = getErrorMessage(err, 'Invalid email or password.');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.forgotPassword(email);
      set({ isLoading: false });
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Could not send OTP.');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  verifyOtpAndReset: async (email, otp, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.verifyOtpAndReset(email, otp, newPassword, confirmPassword);
      set({ isLoading: false });
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Could not reset password.');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));