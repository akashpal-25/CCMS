import api from './api';

export const complaintService = {
  submitComplaint: async ({ domainCode, categoryCode, title, description }) => {
    const response = await api.post('/complaints/', {
      domain_code: domainCode,
      category_code: categoryCode || null,
      title,
      description,
    });
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await api.get('/complaints/my');
    return response.data;
  },

  getAssignedComplaints: async () => {
    const response = await api.get('/complaints/assigned-to-me');
    return response.data;
  },

  getDepartmentComplaints: async () => {
    const response = await api.get('/complaints/department-view');
    return response.data;
  },

  getComplaintDetail: async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}`);
    return response.data;
  },

  performAction: async (complaintId, action, remarks) => {
    const response = await api.post(`/complaints/${complaintId}/action`, {
      action,
      remarks: remarks || null,
    });
    return response.data;
  },

  uploadAttachment: async (complaintId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/complaints/${complaintId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listAttachments: async (complaintId) => {
    const response = await api.get(`/complaints/${complaintId}/attachments`);
    return response.data;
  },

  downloadAttachment: async (attachmentId, filename) => {
    const response = await api.get(`/complaints/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'attachment');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  getActiveDomains: async () => {
    const response = await api.get('/complaints/domains');
    return response.data;
  },

  getActiveCategories: async (domainCode) => {
    const response = await api.get('/complaints/categories', { params: { domain_code: domainCode } });
    return response.data;
  },

  // ---------- Teacher complaints ----------
  getTeacherCategories: async () => {
    const response = await api.get('/complaints/teacher/categories');
    return response.data;
  },

  submitTeacherComplaint: async ({ categoryCode, title, description }) => {
    const response = await api.post('/complaints/teacher/complaint', {
      category_code: categoryCode,
      title,
      description,
    });
    return response.data;
  },

  submitStudentReport: async ({ departmentId, courseId, classSectionId, rollNo, parentPhone, title, description }) => {
    const response = await api.post('/complaints/teacher/student-report', {
      department_id: departmentId,
      course_id: courseId,
      class_section_id: classSectionId,
      roll_no: rollNo,
      parent_phone: parentPhone,
      title,
      description,
    });
    return response.data;
  },

  getTeacherComplaints: async () => {
    const response = await api.get('/complaints/teacher/my');
    return response.data;
  },
};