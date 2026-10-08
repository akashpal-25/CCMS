import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getRoleDisplayName } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';

const selectStyle = { padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' };

const StatusPill = ({ active }) => (
  <span style={{
    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
    color: active ? 'var(--status-resolved-text)' : 'var(--status-not-solved-text)',
    backgroundColor: active ? 'var(--status-resolved-bg)' : 'var(--status-not-solved-bg)'
  }}>
    {active ? 'ACTIVE' : 'INACTIVE'}
  </span>
);

const Settings = () => {
  const [tab, setTab] = useState('departments');

  // Shared data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newDept, setNewDept] = useState({ code: '', name: '' });
  const [newCourse, setNewCourse] = useState({ department_id: '', code: '', name: '' });
  const [newSection, setNewSection] = useState({ course_id: '', year_or_semester: '', section_name: '' });
  const [newDomain, setNewDomain] = useState({ code: '', name: '', description: '' });
  const [newCategory, setNewCategory] = useState({ domain_id: '', code: '', name: '', description: '' });
  const [newRule, setNewRule] = useState({ domain_id: '', category_id: '', escalation_level: 1, target_role_id: '', scope_type: 'DEPARTMENT' });
  const [rulesFilterDomain, setRulesFilterDomain] = useState('');

  const loadAll = async () => {
    const [d, c, s, dom, cat, r, rr] = await Promise.all([
      adminService.getDepartments(),
      adminService.getCourses(),
      adminService.getClassSections(),
      adminService.getDomains(),
      adminService.getCategories(),
      adminService.getRoles(),
      adminService.getRoutingRules(),
    ]);
    setDepartments(d); setCourses(c); setSections(s); setDomains(dom); setCategories(cat); setRoles(r); setRoutingRules(rr);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const handleToggleActive = async (updateFn, item) => {
    try {
      await updateFn(item.id, { is_active: !item.is_active });
      await loadAll();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed.'));
    }
  };

  const handleRename = async (updateFn, item) => {
    const newName = window.prompt('Enter new name:', item.name);
    if (!newName || newName.trim() === item.name) return;
    try {
      await updateFn(item.id, { name: newName.trim() });
      await loadAll();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed.'));
    }
  };

  // ---------- Submit handlers ----------
  const submitDept = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createDepartment(newDept);
      setNewDept({ code: '', name: '' });
      showMsg('success', 'Department created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const submitCourse = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createCourse(newCourse);
      setNewCourse({ department_id: '', code: '', name: '' });
      showMsg('success', 'Course created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const submitSection = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createClassSection({ ...newSection, year_or_semester: Number(newSection.year_or_semester) });
      setNewSection({ course_id: '', year_or_semester: '', section_name: '' });
      showMsg('success', 'Class section created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const submitDomain = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createDomain(newDomain);
      setNewDomain({ code: '', name: '', description: '' });
      showMsg('success', 'Domain created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const submitCategory = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createCategory(newCategory);
      setNewCategory({ domain_id: '', code: '', name: '', description: '' });
      showMsg('success', 'Category created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const submitRule = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminService.createRoutingRule({
        ...newRule,
        category_id: newRule.category_id || null,
        escalation_level: Number(newRule.escalation_level),
      });
      setNewRule({ domain_id: '', category_id: '', escalation_level: 1, target_role_id: '', scope_type: 'DEPARTMENT' });
      showMsg('success', 'Routing rule created.');
      await loadAll();
    } catch (err) { showMsg('error', getErrorMessage(err, 'Failed.')); }
    finally { setSubmitting(false); }
  };

  const tabs = [
    { key: 'departments', label: 'Departments' },
    { key: 'courses', label: 'Courses' },
    { key: 'sections', label: 'Class Sections' },
    { key: 'domains', label: 'Complaint Domains' },
    { key: 'categories', label: 'Categories' },
    { key: 'routing', label: 'Routing Rules' },
  ];

  const categoriesForRuleDomain = categories.filter((c) => c.domain_id === newRule.domain_id);
  const rulesToShow = rulesFilterDomain ? routingRules.filter((r) => r.domain_id === rulesFilterDomain) : routingRules;

  if (loading) return <Loader message="Loading system configuration..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>System Configuration</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Manage departments, courses, complaint domains/categories, and the auto-routing engine — no code changes needed.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAll}>Refresh</Button>
      </div>

      {message && (
        <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: message.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)' }}>
          {message.text}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        {tabs.map((t) => (
          <div
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
              backgroundColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--color-text-muted)'
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ---------- DEPARTMENTS ---------- */}
      {tab === 'departments' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Department</h4>
            <form onSubmit={submitDept} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <Input label="Code" value={newDept.code} onChange={(e) => setNewDept({ ...newDept, code: e.target.value })} placeholder="e.g. AITM" required />
              <Input label="Full Name" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} placeholder="e.g. Axis Institute of Technology" required />
              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Department</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {departments.map((d) => (
              <Card key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>{d.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({d.code})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusPill active={d.is_active} />
                  <Button size="sm" variant="outline" onClick={() => handleRename(adminService.updateDepartment, d)}>Rename</Button>
                  <Button size="sm" variant={d.is_active ? 'danger' : 'success'} onClick={() => handleToggleActive(adminService.updateDepartment, d)}>
                    {d.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ---------- COURSES ---------- */}
      {tab === 'courses' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Course</h4>
            <form onSubmit={submitCourse} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department</label>
                <select style={selectStyle} value={newCourse.department_id} onChange={(e) => setNewCourse({ ...newCourse, department_id: e.target.value })} required>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <Input label="Code" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. BTECH_ECE" required />
              <Input label="Name" value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. B.Tech ECE" required />
              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Course</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {courses.map((c) => {
              const dept = departments.find((d) => d.id === c.department_id);
              return (
                <Card key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>{c.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({c.code}) — {dept?.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <StatusPill active={c.is_active} />
                    <Button size="sm" variant="outline" onClick={() => handleRename(adminService.updateCourse, c)}>Rename</Button>
                    <Button size="sm" variant={c.is_active ? 'danger' : 'success'} onClick={() => handleToggleActive(adminService.updateCourse, c)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- CLASS SECTIONS ---------- */}
      {tab === 'sections' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Class Section</h4>
            <form onSubmit={submitSection} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Course</label>
                <select style={selectStyle} value={newSection.course_id} onChange={(e) => setNewSection({ ...newSection, course_id: e.target.value })} required>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Year / Semester" type="number" value={newSection.year_or_semester} onChange={(e) => setNewSection({ ...newSection, year_or_semester: e.target.value })} required />
              <Input label="Section Name" value={newSection.section_name} onChange={(e) => setNewSection({ ...newSection, section_name: e.target.value })} placeholder="e.g. A" required />
              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Section</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sections.map((s) => {
              const course = courses.find((c) => c.id === s.course_id);
              return (
                <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>{course?.name} — Year/Sem {s.year_or_semester}, Section {s.section_name}</strong>
                  </div>
                  <StatusPill active={s.is_active} />
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- DOMAINS ---------- */}
      {tab === 'domains' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Complaint Domain</h4>
            <form onSubmit={submitDomain} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <Input label="Code" value={newDomain.code} onChange={(e) => setNewDomain({ ...newDomain, code: e.target.value })} placeholder="e.g. SPORTS" required />
              <Input label="Name" value={newDomain.name} onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })} placeholder="e.g. Sports" required />
              <Input label="Description" value={newDomain.description} onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })} placeholder="Optional" />
              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Domain</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {domains.map((d) => (
              <Card key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>{d.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({d.code})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusPill active={d.is_active} />
                  <Button size="sm" variant="outline" onClick={() => handleRename(adminService.updateDomain, d)}>Rename</Button>
                  <Button size="sm" variant={d.is_active ? 'danger' : 'success'} onClick={() => handleToggleActive(adminService.updateDomain, d)}>
                    {d.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ---------- CATEGORIES ---------- */}
      {tab === 'categories' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Category</h4>
            <form onSubmit={submitCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Domain</label>
                <select style={selectStyle} value={newCategory.domain_id} onChange={(e) => setNewCategory({ ...newCategory, domain_id: e.target.value })} required>
                  <option value="">Select domain</option>
                  {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <Input label="Code" value={newCategory.code} onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })} placeholder="e.g. SPORTS_EQUIPMENT" required />
              <Input label="Name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g. Sports Equipment" required />
              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Category</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categories.map((c) => {
              const domain = domains.find((d) => d.id === c.domain_id);
              return (
                <Card key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>{c.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({c.code}) — Domain: {domain?.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <StatusPill active={c.is_active} />
                    <Button size="sm" variant="outline" onClick={() => handleRename(adminService.updateCategory, c)}>Rename</Button>
                    <Button size="sm" variant={c.is_active ? 'danger' : 'success'} onClick={() => handleToggleActive(adminService.updateCategory, c)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- ROUTING RULES ---------- */}
      {tab === 'routing' && (
        <>
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>Add New Routing Rule</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Leave Category empty to set the default rule for the whole domain. A specific category overrides the domain default.
            </p>
            <form onSubmit={submitRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Domain</label>
                <select style={selectStyle} value={newRule.domain_id} onChange={(e) => setNewRule({ ...newRule, domain_id: e.target.value, category_id: '' })} required>
                  <option value="">Select domain</option>
                  {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Category (optional)</label>
                <select style={selectStyle} value={newRule.category_id} onChange={(e) => setNewRule({ ...newRule, category_id: e.target.value })}>
                  <option value="">Domain default (no category)</option>
                  {categoriesForRuleDomain.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <Input label="Escalation Level" type="number" min="1" value={newRule.escalation_level} onChange={(e) => setNewRule({ ...newRule, escalation_level: e.target.value })} required />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Target Role</label>
                <select style={selectStyle} value={newRule.target_role_id} onChange={(e) => setNewRule({ ...newRule, target_role_id: e.target.value })} required>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{getRoleDisplayName(r.name)}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Scope</label>
                <select style={selectStyle} value={newRule.scope_type} onChange={(e) => setNewRule({ ...newRule, scope_type: e.target.value })}>
                  <option value="DEPARTMENT">Department (student's own dept)</option>
                  <option value="GLOBAL">Global</option>
                </select>
              </div>

              <Button type="submit" variant="primary" icon={Plus} isLoading={submitting}>Add Rule</Button>
            </form>
          </Card>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Filter by Domain:</label>
            <select style={selectStyle} value={rulesFilterDomain} onChange={(e) => setRulesFilterDomain(e.target.value)}>
              <option value="">All Domains</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rulesToShow.sort((a, b) => a.escalation_level - b.escalation_level).map((r) => {
              const domain = domains.find((d) => d.id === r.domain_id);
              const category = categories.find((c) => c.id === r.category_id);
              const role = roles.find((ro) => ro.id === r.target_role_id);
              return (
                <Card key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
                  <div style={{ fontSize: '0.8125rem' }}>
                    <strong>{domain?.name}</strong>
                    {category ? ` → ${category.name}` : ' (default)'}
                    {' • Level '}{r.escalation_level}{' → '}
                    <strong>{getRoleDisplayName(role?.name)}</strong>
                    {' ('}{r.scope_type}{')'}
                  </div>
                  <StatusPill active={r.is_active} />
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;