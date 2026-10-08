import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ROLES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getRoleDisplayName } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [scopeType, setScopeType] = useState('DEPARTMENT');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);

  const loadAll = async () => {
    const [r, d, u] = await Promise.all([
      adminService.getRoles(),
      adminService.getDepartments(),
      adminService.getAllUsers(),
    ]);
    setRoles(r);
    setDepartments(d);
    setUsers(u);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage(null);
    const targetUser = users.find((u) => u.email.toLowerCase() === selectedEmail.toLowerCase());
    if (!targetUser) {
      setMessage({ type: 'error', text: 'No user found with that email.' });
      return;
    }
    if (!selectedRoleId) {
      setMessage({ type: 'error', text: 'Please select a role.' });
      return;
    }
    if (scopeType === 'DEPARTMENT' && !selectedDeptId) {
      setMessage({ type: 'error', text: 'Department is required for DEPARTMENT scope.' });
      return;
    }

    setAssigning(true);
    try {
      await adminService.assignRole(targetUser.id, selectedRoleId, scopeType === 'DEPARTMENT' ? selectedDeptId : null, scopeType);
      setMessage({ type: 'success', text: `Role assigned to ${targetUser.full_name} successfully.` });
      setSelectedEmail('');
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not assign role.') });
    } finally {
      setAssigning(false);
    }
  };

  const headers = ['Role Identifier', 'Description', 'Status'];

  if (loading) return <Loader message="Loading role configuration..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Role-Based Access Control (RBAC)</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          System-defined roles and assignment of authority scope to users.
        </p>
      </div>

      <Card style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Assign Role to User</h4>
        <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>User Email</label>
            <input
              list="user-emails"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              placeholder="user@college.edu"
              style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}
            />
            <datalist id="user-emails">
              {users.map((u) => (
                <option key={u.id} value={u.email} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Role</label>
            <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
              <option value="">Select role</option>
              {roles.filter((r) => r.name !== 'STUDENT').map((r) => (
                <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Scope</label>
            <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
              <option value="DEPARTMENT">Department</option>
              <option value="GLOBAL">Global</option>
            </select>
          </div>

          {scopeType === 'DEPARTMENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Department</label>
              <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button type="submit" variant="primary" icon={UserPlus} isLoading={assigning}>
            Assign Role
          </Button>
        </form>

        {message && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: message.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)' }}>
            {message.text}
          </p>
        )}
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table headers={headers}>
          {roles.filter((r) => r.name !== 'STUDENT').map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem', fontWeight: 600 }}>{getRoleDisplayName(r.name)}</td>
              <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{r.description || '—'}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.is_active ? 'var(--status-resolved-text)' : 'var(--status-not-solved-text)' }}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default RoleManagement;