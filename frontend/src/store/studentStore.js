import { create } from 'zustand';
import { complaintService } from '../services/complaintService';
import { studentService } from '../services/studentService';

export const useStudentStore = create((set, get) => ({
  complaints: [],
  stats: null,
  activeComplaint: null,
  attachments: [],
  isLoading: false,
  error: null,

  fetchMyComplaints: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await complaintService.getMyComplaints();
      const stats = await studentService.getStudentStats();
      set({ complaints: data, stats, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
    }
  },

  fetchComplaintDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await complaintService.getComplaintDetail(id);
      const attachments = await complaintService.listAttachments(id);
      set({ activeComplaint: data, attachments, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },

  submitComplaint: async (payload, files = []) => {
    set({ isLoading: true, error: null });
    try {
      const created = await complaintService.submitComplaint(payload);
      for (const f of files) {
        if (f.file) {
          await complaintService.uploadAttachment(created.id, f.file);
        }
      }
      set({ isLoading: false });
      return created;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },

  confirmResolved: async (id, remarks) => {
    try {
      await complaintService.performAction(id, 'confirm_resolved', remarks);
      return await get().fetchComplaintDetail(id);
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message });
      throw err;
    }
  },

  rejectResolution: async (id, remarks) => {
    try {
      await complaintService.performAction(id, 'reject_resolution', remarks);
      return await get().fetchComplaintDetail(id);
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message });
      throw err;
    }
  },
}));