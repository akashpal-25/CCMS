import React, { useEffect, useState } from 'react';
import { UserPlus, GraduationCap, Upload } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errorHandler';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getRoleDisplayName } from '../../utils/formatters';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [message, setMessage] = useState(null);

  const [staffForm, setStaffForm] = useState({ email: '', full_name: '', designation: '', department_id: '', role_id: '', scope_type: 'DEPARTMENT' });
  const [studentForm, setStudentForm] = useState({
    email: '', full_name: '', student_id: '', department_id: '', course_id: '',
    class_section_id: '', semester: '', academic_session: '', admission_year: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const loadAll = async () => {
    const [u, r, d] = await Promise.all([adminService.getAllUsers(), adminService.getRoles(), adminService.getDepartments()]);
    setUsers(u);
    setRoles(r);
    setDepartments(d);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (studentForm.department_id) {
      adminService.getCourses(studentForm.department_id).then(setCourses);
    } else {
      setCourses([]);
    }
  }, [studentForm.department_id]);

  useEffect(() => {
    if (studentForm.course_id) {
      adminService.getClassSections(studentForm.course_id).then(setSections);
    } else {
      setSections([]);
    }
  }, [studentForm.course_id]);

  const handleToggle = async (userId) => {
    setTogglingId(userId);
    try {
      await adminService.toggleUserStatus(userId);
      await loadAll();
    } catch (err) {
      alert(getErrorMessage(err, 'Could not change status.'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await adminService.createStaff(staffForm);
      setMessage({ type: 'success', text: `Staff account created for ${staffForm.full_name}.` });
      setStaffForm({ email: '', full_name: '', designation: '', department_id: '', role_id: '', scope_type: 'DEPARTMENT' });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not create staff.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const payload = {
        ...studentForm,
        class_section_id: studentForm.class_section_id || null,
        semester: studentForm.semester ? Number(studentForm.semester) : null,
        admission_year: studentForm.admission_year ? Number(studentForm.admission_year) : null,
        academic_session: studentForm.academic_session || null,
      };
      await adminService.createStudent(payload);
      setMessage({ type: 'success', text: `Student account created for ${studentForm.full_name}.` });
      setStudentForm({
        email: '', full_name: '', student_id: '', department_id: '', course_id: '',
        class_section_id: '', semester: '', academic_session: '', admission_year: ''
      });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not create student.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setMessage(null);
    setImportResult(null);
    setSubmitting(true);
    try {
      const result = await adminService.bulkImportStudents(csvFile);
      setImportResult(result);
      setCsvFile(null);
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Import failed.') });
    } finally {
      setSubmitting(false);
    }
  };

  const headers = ['Name', 'Email', 'Role(s)', 'Status', 'Action'];
  const tabStyle = (tab) => ({
    padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
    backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--color-text-muted)'
  });
  const selectStyle = { padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' };

  if (loading) return <Loader message="Loading system users..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>System User Management</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Super Admin control panel for students, faculty, and administrators.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={tabStyle('list')} onClick={() => setActiveTab('list')}>All Users</div>
        <div style={tabStyle('staff')} onClick={() => setActiveTab('staff')}>+ Add Staff / HOD / Teacher</div>
        <div style={tabStyle('student')} onClick={() => setActiveTab('student')}>+ Add Student</div>
        <div style={tabStyle('bulk')} onClick={() => setActiveTab('bulk')}>+ Bulk Import (CSV)</div>
      </div>

      {message && (
        <p style={{ fontSize: '0.8125rem', color: message.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)' }}>
          {message.text}
        </p>
      )}

      {activeTab === 'list' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={headers}>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{u.email}</td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                  {u.roles.length > 0 ? u.roles.map((r) => getRoleDisplayName(r)).join(', ') : <span style={{ color: 'var(--color-text-light)' }}>No role assigned</span>}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: u.is_active ? 'var(--status-resolved-text)' : 'var(--status-not-solved-text)',
                    backgroundColor: u.is_active ? 'var(--status-resolved-bg)' : 'var(--status-not-solved-bg)',
                    padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)'
                  }}>
                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {u.roles.includes('SUPER_ADMIN') ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Protected</span>
                  ) : (
                    <Button size="sm" variant={u.is_active ? 'danger' : 'success'} isLoading={togglingId === u.id} onClick={() => handleToggle(u.id)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {activeTab === 'staff' && (
        <Card style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Create Staff Account (HOD / Teacher / Warden / Director / etc.)</h4>
          <form onSubmit={handleCreateStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input label="Email" type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
            <Input label="Full Name" value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })} required />
            <Input label="Designation" value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })} placeholder="e.g. HOD, Class Teacher" required />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role</label>
              <select style={selectStyle} value={staffForm.role_id} onChange={(e) => setStaffForm({ ...staffForm, role_id: e.target.value })} required>
                <option value="">Select role</option>
                {roles.filter((r) => r.name !== 'STUDENT').map((r) => <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Scope</label>
              <select style={selectStyle} value={staffForm.scope_type} onChange={(e) => setStaffForm({ ...staffForm, scope_type: e.target.value })}>
                <option value="DEPARTMENT">Department</option>
                <option value="GLOBAL">Global</option>
              </select>
            </div>

            {staffForm.scope_type === 'DEPARTMENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department</label>
                <select style={selectStyle} value={staffForm.department_id} onChange={(e) => setStaffForm({ ...staffForm, department_id: e.target.value })} required>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ alignSelf: 'end' }}>
              <Button type="submit" variant="primary" icon={UserPlus} isLoading={submitting}>Create Staff</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'student' && (
        <Card style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Create Single Student Account</h4>
          <form onSubmit={handleCreateStudent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input label="Email" type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
            <Input label="Full Name" value={studentForm.full_name} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} required />
            <Input label="Student / Roll ID" value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} required />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department</label>
              <select style={selectStyle} value={studentForm.department_id} onChange={(e) => setStudentForm({ ...studentForm, department_id: e.target.value, course_id: '', class_section_id: '' })} required>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Course</label>
              <select style={selectStyle} value={studentForm.course_id} onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value, class_section_id: '' })} required>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Section (optional)</label>
              <select style={selectStyle} value={studentForm.class_section_id} onChange={(e) => setStudentForm({ ...studentForm, class_section_id: e.target.value })}>
                <option value="">No specific section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>Year/Sem {s.year_or_semester} - Section {s.section_name}</option>
                ))}
              </select>
            </div>

            <Input label="Semester (optional)" type="number" value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })} />
            <Input label="Academic Session (optional)" value={studentForm.academic_session} onChange={(e) => setStudentForm({ ...studentForm, academic_session: e.target.value })} placeholder="e.g. 2024-2028" />
            <Input label="Admission Year (optional)" type="number" value={studentForm.admission_year} onChange={(e) => setStudentForm({ ...studentForm, admission_year: e.target.value })} placeholder="e.g. 2024" />

            <div style={{ alignSelf: 'end' }}>
              <Button type="submit" variant="primary" icon={GraduationCap} isLoading={submitting}>Create Student</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'bulk' && (
        <Card style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bulk Import Students (CSV)</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Required columns: email, full_name, student_id, department_code, course_code.
            Optional columns: mobile_number, year_or_semester, section_name, semester, academic_session, admission_year.
          </p>
          <form onSubmit={handleBulkImport} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
            <Button type="submit" variant="primary" icon={Upload} isLoading={submitting} disabled={!csvFile}>Import CSV</Button>
          </form>

          {importResult && (
            <div style={{ marginTop: '1.25rem', fontSize: '0.8125rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Total rows: {importResult.total_rows} | Success: {importResult.success_count} | Failed: {importResult.failed_count}
              </p>
              {importResult.errors.map((err, i) => (
                <p key={i} style={{ color: 'var(--status-not-solved-text)', margin: '0.2rem 0' }}>
                  Row {err.row_number} ({err.email || 'unknown'}): {err.error}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default UserManagement;