import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const list = await notificationService.getUserNotifications();
      const unread = list.filter((n) => !n.is_read).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    await notificationService.markAsRead(id);
    set((state) => {
      const next = state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      return { notifications: next, unreadCount: next.filter((n) => !n.is_read).length };
    });
  },

  markAllRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0
    }));
  }
}));