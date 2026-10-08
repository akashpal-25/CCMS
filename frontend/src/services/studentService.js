import { complaintService } from './complaintService';
import { COMPLAINT_STATUS } from '../utils/constants';
import api from './api';

export const studentService = {
  getStudentStats: async () => {
    const complaints = await complaintService.getMyComplaints();
    return {
      total: complaints.length,
      underReview: complaints.filter((c) => c.status === COMPLAINT_STATUS.UNDER_REVIEW).length,
      pendingConfirmation: complaints.filter((c) => c.status === COMPLAINT_STATUS.PENDING_STUDENT_CONFIRMATION).length,
      resolved: complaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED).length,
      notSolved: complaints.filter((c) => c.status === COMPLAINT_STATUS.NOT_SOLVED).length,
      escalated: complaints.filter((c) => c.status === COMPLAINT_STATUS.ESCALATED).length,
    };
  },
  getMyProfile: async () => {
    const response = await api.get('/students/me');
    return response.data;
  },
};