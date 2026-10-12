import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const selectStyle = { padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' };
const labelStyle = { fontSize: '0.8125rem', fontWeight: 500 };
const wrapStyle = { display: 'flex', flexDirection: 'column', gap: '0.3rem' };

/**
 * Department -> Course -> (Semester + Section) select karne ka reusable picker.
 * value = { department_id, course_id, class_section_id }
 * onChange(nextValue) har badlaav par call hota hai.
 * Parent ke form mein ye teen dropdown ek hi grid mein aate hain.
 */
const ClassSectionPicker = ({ departments = [], value, onChange, required = true }) => {
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (value.department_id) {
      adminService.getCourses(value.department_id).then(setCourses);
    } else {
      setCourses([]);
    }
  }, [value.department_id]);

  useEffect(() => {
    if (value.course_id) {
      adminService.getClassSections(value.course_id).then(setSections);
    } else {
      setSections([]);
    }
  }, [value.course_id]);

  return (
    <>
      <div style={wrapStyle}>
        <label style={labelStyle}>Department</label>
        <select
          style={selectStyle}
          value={value.department_id}
          onChange={(e) => onChange({ department_id: e.target.value, course_id: '', class_section_id: '' })}
          required={required}
        >
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div style={wrapStyle}>
        <label style={labelStyle}>Course</label>
        <select
          style={selectStyle}
          value={value.course_id}
          onChange={(e) => onChange({ ...value, course_id: e.target.value, class_section_id: '' })}
          required={required}
        >
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={wrapStyle}>
        <label style={labelStyle}>Semester &amp; Section</label>
        <select
          style={selectStyle}
          value={value.class_section_id}
          onChange={(e) => onChange({ ...value, class_section_id: e.target.value })}
          required={required}
        >
          <option value="">Select semester / section</option>
          {sections.filter((s) => s.is_active).map((s) => (
            <option key={s.id} value={s.id}>Semester {s.year_or_semester} - Section {s.section_name}</option>
          ))}
        </select>
      </div>
    </>
  );
};

export default ClassSectionPicker;
