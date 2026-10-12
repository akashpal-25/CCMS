import React, { useEffect, useState } from 'react';
import { UserPlus, Plus, Save } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ClassSectionPicker from '../../components/admin/ClassSectionPicker';
import { getRoleDisplayName } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';

const selectStyle = { padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' };
const fieldWrap = { display: 'flex', flexDirection: 'column', gap: '0.3rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: 600 };
const sectionTitle = { fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' };

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- assign role ----
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [scopeType, setScopeType] = useState('DEPARTMENT');
  const [assignDomainId, setAssignDomainId] = useState('');
  const [classPick, setClassPick] = useState({ department_id: '', course_id: '', class_section_id: '' });
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);

  // ---- create role ----
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState(null);

  // ---- permissions editor ----
  const [editRoleId, setEditRoleId] = useState('');
  const [editCodes, setEditCodes] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permMessage, setPermMessage] = useState(null);

  // ---- routing rules ----
  const [newRule, setNewRule] = useState({ domain_id: '', category_id: '', escalation_level: 1, target_role_id: '', scope_type: 'GLOBAL' });
  const [ruleMessage, setRuleMessage] = useState(null);
  const [savingRule, setSavingRule] = useState(false);

  const loadAll = async () => {
    const [r, d, u, p, dom, cat, rl] = await Promise.all([
      adminService.getRoles(),
      adminService.getDepartments(),
      adminService.getAllUsers(),
      adminService.getPermissions(),
      adminService.getDomains(),
      adminService.getCategories(),
      adminService.getRoutingRules(),
    ]);
    setRoles(r);
    setDepartments(d);
    setUsers(u);
    setPermissions(p);
    setDomains(dom);
    setCategories(cat);
    setRules(rl);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const roleById = (id) => roles.find((r) => r.id === id);
  const domainById = (id) => domains.find((d) => d.id === id);
  const categoryById = (id) => categories.find((c) => c.id === id);
  const selectedRole = roleById(selectedRoleId);
  const isClassTeacherRole = selectedRole?.name === 'CLASS_TEACHER';
  const showAssignDomain = !!selectedRole && !['CLASS_TEACHER', 'TEACHER', 'SUPER_ADMIN'].includes(selectedRole.name);

  // ---------- assign role ----------
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
    if (isClassTeacherRole && !classPick.class_section_id) {
      setMessage({ type: 'error', text: 'Select department, course, semester and section for a Class Teacher.' });
      return;
    }
    if (scopeType === 'DEPARTMENT' && !isClassTeacherRole && !classPick.department_id) {
      setMessage({ type: 'error', text: 'Department is required for DEPARTMENT scope.' });
      return;
    }

    setAssigning(true);
    try {
      await adminService.assignRole(
        targetUser.id,
        selectedRoleId,
        scopeType === 'DEPARTMENT' ? classPick.department_id : null,
        scopeType,
        isClassTeacherRole ? classPick.class_section_id : null,
        showAssignDomain ? assignDomainId : null
      );
      setMessage({ type: 'success', text: `Role assigned to ${targetUser.full_name} successfully.` });
      setSelectedEmail('');
      setAssignDomainId('');
      setClassPick({ department_id: '', course_id: '', class_section_id: '' });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not assign role.') });
    } finally {
      setAssigning(false);
    }
  };

  // ---------- create role ----------
  const handleCreateRole = async (e) => {
    e.preventDefault();
    setRoleMessage(null);
    setCreatingRole(true);
    try {
      await adminService.createRole({ name: newRole.name, description: newRole.description || null });
      setRoleMessage({ type: 'success', text: `Role ${newRole.name.toUpperCase()} created. Now set its permissions below.` });
      setNewRole({ name: '', description: '' });
      await loadAll();
    } catch (err) {
      setRoleMessage({ type: 'error', text: getErrorMessage(err, 'Could not create role.') });
    } finally {
      setCreatingRole(false);
    }
  };

  const handleToggleRole = async (role) => {
    try {
      await adminService.updateRole(role.id, { is_active: !role.is_active });
      await loadAll();
    } catch (err) {
      alert(getErrorMessage(err, 'Could not update role.'));
    }
  };

  // ---------- permissions ----------
  const handlePickRole = async (roleId) => {
    setEditRoleId(roleId);
    setPermMessage(null);
    if (!roleId) {
      setEditCodes([]);
      return;
    }
    const res = await adminService.getRolePermissions(roleId);
    setEditCodes(res.permission_codes);
  };

  const toggleCode = (code) => {
    setEditCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleSavePerms = async () => {
    setSavingPerms(true);
    setPermMessage(null);
    try {
      await adminService.setRolePermissions(editRoleId, editCodes);
      setPermMessage({ type: 'success', text: 'Permissions saved.' });
    } catch (err) {
      setPermMessage({ type: 'error', text: getErrorMessage(err, 'Could not save permissions.') });
    } finally {
      setSavingPerms(false);
    }
  };

  // ---------- routing rules ----------
  const handleRuleChange = async (rule, changes) => {
    setRuleMessage(null);
    try {
      await adminService.updateRoutingRule(rule.id, changes);
      await loadAll();
    } catch (err) {
      setRuleMessage({ type: 'error', text: getErrorMessage(err, 'Could not update routing rule.') });
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setRuleMessage(null);
    if (!newRule.domain_id || !newRule.target_role_id) {
      setRuleMessage({ type: 'error', text: 'Select a domain and a role.' });
      return;
    }
    setSavingRule(true);
    try {
      await adminService.createRoutingRule({
        domain_id: newRule.domain_id,
        category_id: newRule.category_id || null,
        escalation_level: Number(newRule.escalation_level),
        target_role_id: newRule.target_role_id,
        scope_type: newRule.scope_type,
      });
      setRuleMessage({ type: 'success', text: 'Routing rule added.' });
      setNewRule({ domain_id: '', category_id: '', escalation_level: 1, target_role_id: '', scope_type: 'GLOBAL' });
      await loadAll();
    } catch (err) {
      setRuleMessage({ type: 'error', text: getErrorMessage(err, 'Could not add routing rule.') });
    } finally {
      setSavingRule(false);
    }
  };

  const msgColor = (m) => (m.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)');
  const assignableRoles = roles.filter((r) => r.name !== 'STUDENT');
  const sortedRules = [...rules].sort((a, b) => {
    const da = domainById(a.domain_id)?.name || '';
    const db = domainById(b.domain_id)?.name || '';
    return da.localeCompare(db) || a.escalation_level - b.escalation_level;
  });
  const newRuleCategories = categories.filter((c) => c.domain_id === newRule.domain_id);

  if (loading) return <Loader message="Loading role configuration..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Role-Based Access Control (RBAC)</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Create roles, decide what each role can access, and decide which role receives which complaint domain.
        </p>
      </div>

      {/* ---------------- Assign role ---------------- */}
      <Card style={{ padding: '1.5rem' }}>
        <h4 style={sectionTitle}>Assign Role to User</h4>
        <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>User Email</label>
            <input
              list="user-emails"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              placeholder="user@college.edu"
              style={selectStyle}
            />
            <datalist id="user-emails">
              {users.map((u) => (
                <option key={u.id} value={u.email} />
              ))}
            </datalist>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Role</label>
            <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} style={selectStyle}>
              <option value="">Select role</option>
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>
              ))}
            </select>
          </div>

          {showAssignDomain && (
            <div style={fieldWrap}>
              <label style={labelStyle}>Domain</label>
              <select value={assignDomainId} onChange={(e) => setAssignDomainId(e.target.value)} style={selectStyle}>
                <option value="">All domains</option>
                {domains.filter((d) => d.is_active).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {!isClassTeacherRole && (
            <div style={fieldWrap}>
              <label style={labelStyle}>Scope</label>
              <select
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value);
                  if (e.target.value === 'GLOBAL') setClassPick({ department_id: '', course_id: '', class_section_id: '' });
                }}
                style={selectStyle}
              >
                <option value="DEPARTMENT">Department</option>
                <option value="GLOBAL">Global</option>
              </select>
            </div>
          )}

          {isClassTeacherRole ? (
            <ClassSectionPicker departments={departments} value={classPick} onChange={setClassPick} />
          ) : (
            scopeType === 'DEPARTMENT' && (
              <div style={fieldWrap}>
                <label style={labelStyle}>Department</label>
                <select
                  value={classPick.department_id}
                  onChange={(e) => setClassPick({ department_id: e.target.value, course_id: '', class_section_id: '' })}
                  style={selectStyle}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )
          )}

          <Button type="submit" variant="primary" icon={UserPlus} isLoading={assigning}>
            Assign Role
          </Button>
        </form>
        {message && <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: msgColor(message) }}>{message.text}</p>}
      </Card>

      {/* ---------------- Create role ---------------- */}
      <Card style={{ padding: '1.5rem' }}>
        <h4 style={sectionTitle}>Create New Role</h4>
        <form onSubmit={handleCreateRole} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <Input
            label="Role Name"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
            placeholder="e.g. LAB_INCHARGE"
            helperText="Letters, numbers and underscore only"
            required
          />
          <Input
            label="Description"
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            placeholder="What does this role do?"
          />
          <Button type="submit" variant="primary" icon={Plus} isLoading={creatingRole}>Create Role</Button>
        </form>
        {roleMessage && <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: msgColor(roleMessage) }}>{roleMessage.text}</p>}
      </Card>

      {/* ---------------- Roles list ---------------- */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table headers={['Role Identifier', 'Description', 'Status', 'Action']}>
          {assignableRoles.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem', fontWeight: 600 }}>{getRoleDisplayName(r.name)}</td>
              <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{r.description || '—'}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.is_active ? 'var(--status-resolved-text)' : 'var(--status-not-solved-text)' }}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                {r.name === 'SUPER_ADMIN' ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Protected</span>
                ) : (
                  <Button size="sm" variant={r.is_active ? 'danger' : 'success'} onClick={() => handleToggleRole(r)}>
                    {r.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* ---------------- Permissions editor ---------------- */}
      <Card style={{ padding: '1.5rem' }}>
        <h4 style={sectionTitle}>Role Permissions</h4>
        <div style={{ ...fieldWrap, maxWidth: '320px', marginBottom: '1rem' }}>
          <label style={labelStyle}>Select role</label>
          <select value={editRoleId} onChange={(e) => handlePickRole(e.target.value)} style={selectStyle}>
            <option value="">Select role</option>
            {assignableRoles.filter((r) => r.name !== 'SUPER_ADMIN').map((r) => (
              <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>
            ))}
          </select>
        </div>

        {editRoleId && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
              {permissions.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <input type="checkbox" checked={editCodes.includes(p.code)} onChange={() => toggleCode(p.code)} />
                  <span>{p.code}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" icon={Save} isLoading={savingPerms} onClick={handleSavePerms}>Save Permissions</Button>
            </div>
          </>
        )}
        {permMessage && <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: msgColor(permMessage) }}>{permMessage.text}</p>}
      </Card>

      {/* ---------------- Routing rules ---------------- */}
      <Card style={{ padding: '1.5rem' }}>
        <h4 style={{ ...sectionTitle, marginBottom: '0.25rem' }}>Complaint Routing Rules</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Level 1 receives the complaint first; the next levels receive it if it is escalated. GLOBAL means the role handles that domain for
          every department; DEPARTMENT means only the role holder of the student's own department.
        </p>
        <Table headers={['Domain', 'Category', 'Level', 'Role', 'Scope', 'Active']}>
          {sortedRules.map((rule) => (
            <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{domainById(rule.domain_id)?.name || '—'}</td>
              <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>{rule.category_id ? categoryById(rule.category_id)?.name : 'All (default)'}</td>
              <td style={{ padding: '0.75rem 1rem' }}>{rule.escalation_level}</td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <select
                  value={rule.target_role_id}
                  onChange={(e) => handleRuleChange(rule, { target_role_id: e.target.value })}
                  style={selectStyle}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <select
                  value={rule.scope_type}
                  onChange={(e) => handleRuleChange(rule, { scope_type: e.target.value })}
                  style={selectStyle}
                >
                  <option value="GLOBAL">Global</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <input type="checkbox" checked={rule.is_active} onChange={(e) => handleRuleChange(rule, { is_active: e.target.checked })} />
              </td>
            </tr>
          ))}
        </Table>

        <h4 style={{ ...sectionTitle, marginTop: '1.5rem' }}>Add Routing Rule</h4>
        <form onSubmit={handleAddRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Domain</label>
            <select value={newRule.domain_id} onChange={(e) => setNewRule({ ...newRule, domain_id: e.target.value, category_id: '' })} style={selectStyle}>
              <option value="">Select domain</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Category (optional)</label>
            <select value={newRule.category_id} onChange={(e) => setNewRule({ ...newRule, category_id: e.target.value })} style={selectStyle}>
              <option value="">All categories (default)</option>
              {newRuleCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Level</label>
            <select value={newRule.escalation_level} onChange={(e) => setNewRule({ ...newRule, escalation_level: e.target.value })} style={selectStyle}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>Level {n}</option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Role</label>
            <select value={newRule.target_role_id} onChange={(e) => setNewRule({ ...newRule, target_role_id: e.target.value })} style={selectStyle}>
              <option value="">Select role</option>
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Scope</label>
            <select value={newRule.scope_type} onChange={(e) => setNewRule({ ...newRule, scope_type: e.target.value })} style={selectStyle}>
              <option value="GLOBAL">Global</option>
              <option value="DEPARTMENT">Department</option>
            </select>
          </div>
          <Button type="submit" variant="primary" icon={Plus} isLoading={savingRule}>Add Rule</Button>
        </form>
        {ruleMessage && <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: msgColor(ruleMessage) }}>{ruleMessage.text}</p>}
      </Card>
    </div>
  );
};

export default RoleManagement;
