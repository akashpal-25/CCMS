// ---------- ROLES (backend ke role_name se exact match) ----------
export const ROLES = {
  STUDENT: 'STUDENT',
  CLASS_TEACHER: 'CLASS_TEACHER',
  HOD: 'HOD',
  EXAM_ADMIN: 'EXAM_ADMIN',
  HR_FINANCE: 'HR_FINANCE',
  WARDEN: 'WARDEN',
  TRANSPORT_SUPERVISOR: 'TRANSPORT_SUPERVISOR',
  DIRECTOR: 'DIRECTOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
  TEACHER: 'TEACHER',
  CAMPUS_SUPERVISOR: 'CAMPUS_SUPERVISOR'
};

// ---------- COMPLAINT STATUS (backend ke enum se exact match) ----------
export const COMPLAINT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PENDING_STUDENT_CONFIRMATION: 'PENDING_STUDENT_CONFIRMATION',
  RESOLVED: 'RESOLVED',
  NOT_SOLVED: 'NOT_SOLVED',
  ESCALATED: 'ESCALATED'
};

export const COMPLAINT_STATUS_LABELS = {
  SUBMITTED: '📝 Submitted',
  UNDER_REVIEW: '🔍 Under Review',
  PENDING_STUDENT_CONFIRMATION: '⏳ Awaiting Your Confirmation',
  RESOLVED: '✅ Resolved',
  NOT_SOLVED: '❌ Not Solved',
  ESCALATED: '🚨 Escalated'
};

// ---------- DOMAIN CODES (backend ke domain_code se match, API calls ke liye) ----------
export const DOMAIN_CODES = {
  ACADEMIC: 'academic',
  EXAMINATION: 'examination',
  LIBRARY: 'library',
  FINANCE: 'finance',
  GENERAL: 'general',
  HOSTEL: 'hostel',
  TRANSPORT: 'transport'
};

// ==========================================================================
// NIICHE WALI CHEEZEIN ABHI KE LIYE "PLACEHOLDER" HAIN.
// Ye asal me database-driven honi chahiye (Domain/Category/Department APIs se),
// lekin purani UI files (permissions.js, complaintService.js, etc.) inko
// static import karti hain, isliye crash na ho isliye abhi yahan rakhi hain.
// Jab hum SubmitComplaint / Admin pages banayenge, in files ko API-driven
// bana denge aur ye placeholder exports hata denge.
// ==========================================================================

export const DOMAINS = {
  ACADEMIC: 'Academic',
  EXAMINATION: 'Examination',
  LIBRARY: 'Library',
  FINANCE: 'Finance / Fees',
  GENERAL: 'General',
  HOSTEL: 'Hostel',
  TRANSPORT: 'Transport'
};

export const DOMAIN_CATEGORIES = {
  [DOMAINS.ACADEMIC]: [
    'Course Curriculum / Syllabus',
    'Faculty / Lecture Delivery',
    'Lab Equipment & Facilities',
    'Attendance Discrepancy',
    'Internal Assessments'
  ],
  [DOMAINS.EXAMINATION]: [
    'Admit Card / Hall Ticket Issue',
    'Result Evaluation / Re-checking',
    'Exam Schedule Clash',
    'Backlog / Remedial Exam Issue',
    'Grade Sheet Correction'
  ],
  [DOMAINS.LIBRARY]: [
    'Book Unavailability / Reserve Request',
    'Digital Library & Portal Access',
    'Fine Calculation Dispute',
    'Study Room / Reading Hall Infrastructure',
    'Journal / E-Resource Subscription'
  ],
  [DOMAINS.FINANCE]: [
    'Fee Receipt Generation Delay',
    'Scholarship Disbursement',
    'Refund / Caution Money Delay',
    'Online Fee Payment Failure',
    'No Dues Clearance'
  ],
  [DOMAINS.GENERAL]: [
    'Hostel Room Maintenance',
    'Hostel Mess & Food Quality',
    'College Bus Route / Timing Issue',
    'Campus Wi-Fi / IT Infrastructure',
    'Canteen & Hygiene',
    'Medical & First Aid Facilities',
    'Sports & Gymnasium Equipment'
  ]
};

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Department of Business Administration (MBA)',
  'Department of Applied Sciences',
  'Department of Architecture',
  'Department of Pharmacy'
];