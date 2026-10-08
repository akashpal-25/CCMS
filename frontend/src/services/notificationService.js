import api from './api';

export const notificationService = {
  getUserNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.get('/notifications/');
    const unread = response.data.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => api.post(`/notifications/${n.id}/read`)));
    return true;
  },
};