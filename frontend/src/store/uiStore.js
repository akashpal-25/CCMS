import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  deferredInstallPrompt: null,
  setInstallPrompt: (event) => set({ deferredInstallPrompt: event }),
  clearInstallPrompt: () => set({ deferredInstallPrompt: null }),
}));