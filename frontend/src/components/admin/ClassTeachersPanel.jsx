import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errorHandler';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../common/Button';

const selectStyle = { padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' };

/**
 * Har class (semester + section) ka class teacher dikhata hai.
 * Ek class ka sirf ek teacher. Yahan se teacher assign / badal / hata sakte hain.
 */
const ClassTeachersPanel = ({ users = [] }) => {
  const [rows, setRows] = useState([]);
  const [choice, setChoice] = useState({}); // section_id -> selected user_id
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    const data = await adminService.getClassTeachers();
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const classTeacherUsers = users.filter((u) => u.is_active && u.roles.includes('CLASS_TEACHER'));

  const handleSave = async (sectionId) => {
    const userId = choice[sectionId];
    if (!userId) return;
    setBusyId(sectionId);
    setMessage(null);
    try {
      await adminService.setClassTeacher(sectionId, userId);
      setChoice({ ...choice, [sectionId]: '' });
      setMessage({ type: 'success', text: 'Class teacher updated.' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not update class teacher.') });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (sectionId) => {
    setBusyId(sectionId);
    setMessage(null);
    try {
      await adminService.removeClassTeacher(sectionId);
      setMessage({ type: 'success', text: 'Class teacher removed.' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not remove class teacher.') });
    } finally {
      setBusyId(null);
    }
  };

  const headers = ['Department', 'Course', 'Semester / Section', 'Class Teacher', 'Change To', 'Action'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        One class has only one class teacher. Student complaints for a class go only to that class's teacher.
        If a class has no teacher, its complaints go directly to the HOD.
      </p>
      {message && (
        <p style={{ fontSize: '0.8125rem', color: message.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)' }}>
          {message.text}
        </p>
      )}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table headers={headers}>
          {rows.map((r) => (
            <tr key={r.class_section_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{r.department_name}</td>
              <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{r.course_name}</td>
              <td style={{ padding: '1rem', fontWeight: 600 }}>Semester {r.year_or_semester} - Section {r.section_name}</td>
              <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                {r.teacher_name
                  ? <>{r.teacher_name}<div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{r.teacher_email}</div></>
                  : <span style={{ color: 'var(--status-not-solved-text)' }}>Not assigned</span>}
              </td>
              <td style={{ padding: '1rem' }}>
                <select
                  style={selectStyle}
                  value={choice[r.class_section_id] || ''}
                  onChange={(e) => setChoice({ ...choice, [r.class_section_id]: e.target.value })}
                >
                  <option value="">Select teacher</option>
                  {classTeacherUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </td>
              <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" variant="primary" isLoading={busyId === r.class_section_id} disabled={!choice[r.class_section_id]} onClick={() => handleSave(r.class_section_id)}>
                  Save
                </Button>
                {r.teacher_user_id && (
                  <Button size="sm" variant="danger" isLoading={busyId === r.class_section_id} onClick={() => handleRemove(r.class_section_id)}>
                    Remove
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default ClassTeachersPanel;
