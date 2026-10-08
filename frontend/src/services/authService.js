import api from './api';

export const authService = {
  checkEmail: async (email) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data; // { exists, has_password }
  },

  createPassword: async (email, password, confirmPassword) => {
    const response = await api.post('/auth/create-password', {
      email,
      password,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = response.data;

    localStorage.setItem('ccms_auth_token', access_token);
    localStorage.setItem('ccms_refresh_token', refresh_token);

    const profile = await authService.fetchProfile();
    return profile;
  },

  fetchProfile: async () => {
    const response = await api.get('/auth/me');
    const profile = response.data;
    localStorage.setItem('ccms_user', JSON.stringify(profile));
    return profile;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOtpAndReset: async (email, otp, newPassword, confirmPassword) => {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  getCurrentUser: () => {
    const data = localStorage.getItem('ccms_user');
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem('ccms_auth_token');
    localStorage.removeItem('ccms_refresh_token');
    localStorage.removeItem('ccms_user');
  },
};