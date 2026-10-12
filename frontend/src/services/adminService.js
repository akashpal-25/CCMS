import { complaintService } from './complaintService';
import { COMPLAINT_STATUS } from '../utils/constants';
import api from './api';

export const adminService = {
  getAdminComplaints: async (filters = {}) => {
    const [assigned, deptView] = await Promise.all([
      complaintService.getAssignedComplaints(),
      complaintService.getDepartmentComplaints(),
    ]);
    const map = new Map();
    [...assigned, ...deptView].forEach((c) => map.set(c.id, c));
    let data = Array.from(map.values());

    if (filters.status && filters.status !== 'ALL') {
      data = data.filter((c) => c.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.complaint_number.toLowerCase().includes(q)
      );
    }
    return data;
  },

  getAdminStats: async () => {
    const complaints = await adminService.getAdminComplaints();
    return {
      total: complaints.length,
      underReview: complaints.filter((c) => c.status === COMPLAINT_STATUS.UNDER_REVIEW).length,
      pendingConfirmation: complaints.filter((c) => c.status === COMPLAINT_STATUS.PENDING_STUDENT_CONFIRMATION).length,
      escalated: complaints.filter((c) => c.status === COMPLAINT_STATUS.ESCALATED).length,
      resolved: complaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED).length,
      notSolved: complaints.filter((c) => c.status === COMPLAINT_STATUS.NOT_SOLVED).length,
      breached: complaints.filter((c) => c.sla_status === 'BREACHED' && c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.NOT_SOLVED).length,
    };
  },

  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-active`);
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/admin/departments');
    return response.data;
  },

  assignRole: async (userId, roleId, departmentId, scopeType, classSectionId, domainId) => {
    const response = await api.post('/admin/roles/assign', {
      user_id: userId,
      role_id: roleId,
      department_id: departmentId || null,
      scope_type: scopeType,
      class_section_id: classSectionId || null,
      domain_id: domainId || null,
    });
    return response.data;
  },

    // ---------- Staff/Student Creation ----------
  createStaff: async (payload) => {
    const response = await api.post('/admin/staff', payload);
    return response.data;
  },

  createStudent: async (payload) => {
    const response = await api.post('/admin/students', payload);
    return response.data;
  },

  getCourses: async (departmentId) => {
    const response = await api.get('/admin/courses', { params: departmentId ? { department_id: departmentId } : {} });
    return response.data;
  },

  getClassSections: async (courseId) => {
    const response = await api.get('/admin/class-sections', { params: courseId ? { course_id: courseId } : {} });
    return response.data;
  },

  // ---------- Department/Course Management ----------
  createDepartment: async (payload) => {
    const response = await api.post('/admin/departments', payload);
    return response.data;
  },

  updateDepartment: async (id, payload) => {
    const response = await api.patch(`/admin/departments/${id}`, payload);
    return response.data;
  },

  createCourse: async (payload) => {
    const response = await api.post('/admin/courses', payload);
    return response.data;
  },

  updateCourse: async (id, payload) => {
    const response = await api.patch(`/admin/courses/${id}`, payload);
    return response.data;
  },

  createClassSection: async (payload) => {
    const response = await api.post('/admin/class-sections', payload);
    return response.data;
  },

  // ---------- Domain/Category Management ----------
  getDomains: async () => {
    const response = await api.get('/admin/domains');
    return response.data;
  },

  createDomain: async (payload) => {
    const response = await api.post('/admin/domains', payload);
    return response.data;
  },

  updateDomain: async (id, payload) => {
    const response = await api.patch(`/admin/domains/${id}`, payload);
    return response.data;
  },

  getCategories: async (domainId) => {
    const response = await api.get('/admin/categories', { params: domainId ? { domain_id: domainId } : {} });
    return response.data;
  },

  createCategory: async (payload) => {
    const response = await api.post('/admin/categories', payload);
    return response.data;
  },

  updateCategory: async (id, payload) => {
    const response = await api.patch(`/admin/categories/${id}`, payload);
    return response.data;
  },

  // ---------- Routing Rules ----------
  getRoutingRules: async (domainId) => {
    const response = await api.get('/admin/routing-rules', { params: domainId ? { domain_id: domainId } : {} });
    return response.data;
  },

  createRoutingRule: async (payload) => {
    const response = await api.post('/admin/routing-rules', payload);
    return response.data;
  },

  updateRoutingRule: async (id, payload) => {
    const response = await api.patch(`/admin/routing-rules/${id}`, payload);
    return response.data;
  },

  // ---------- Class teachers ----------
  getClassTeachers: async () => {
    const response = await api.get('/admin/class-teachers');
    return response.data;
  },

  setClassTeacher: async (sectionId, userId) => {
    const response = await api.put(`/admin/class-teachers/${sectionId}`, { user_id: userId });
    return response.data;
  },

  removeClassTeacher: async (sectionId) => {
    const response = await api.delete(`/admin/class-teachers/${sectionId}`);
    return response.data;
  },

  // ---------- Roles & permissions ----------
  createRole: async (payload) => {
    const response = await api.post('/admin/roles', payload);
    return response.data;
  },

  updateRole: async (id, payload) => {
    const response = await api.patch(`/admin/roles/${id}`, payload);
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  getRolePermissions: async (roleId) => {
    const response = await api.get(`/admin/roles/${roleId}/permissions`);
    return response.data;
  },

  setRolePermissions: async (roleId, permissionCodes) => {
    const response = await api.put(`/admin/roles/${roleId}/permissions`, { permission_codes: permissionCodes });
    return response.data;
  },

  bulkImportStudents: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};