import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { complaintService } from '../../services/complaintService';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AttachmentUploader from '../../components/complaints/AttachmentUploader';
import ClassSectionPicker from '../../components/admin/ClassSectionPicker';
import { getErrorMessage } from '../../utils/errorHandler';

// Teacher student ke against report karta hai: HOD ko jati hai aur parent ko WhatsApp message
const ReportStudent = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [klass, setKlass] = useState({ department_id: '', course_id: '', class_section_id: '' });
  const [rollNo, setRollNo] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    adminService.getDepartments().then(setDepartments);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setMessage(null);
    if (!/^[0-9+\s-]{10,15}$/.test(parentPhone.trim())) {
      setMessage({ type: 'error', text: 'Enter a valid parent phone number (10-digit mobile number).' });
      return;
    }
    if (title.trim().length < 5 || description.trim().length < 10) {
      setMessage({ type: 'error', text: 'Title (min 5) and description (min 10 characters) are required.' });
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const created = await complaintService.submitStudentReport({
        departmentId: klass.department_id,
        courseId: klass.course_id,
        classSectionId: klass.class_section_id,
        rollNo: rollNo.trim(),
        parentPhone: parentPhone.trim(),
        title,
        description,
      });
      for (const f of attachments) {
        if (f.file) await complaintService.uploadAttachment(created.id, f.file);
      }
      navigate('/admin/teacher/complaints');
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not submit the report.') });
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        Back
      </Button>

      <Card style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Report a Student</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            The report goes to the student's HOD, and the parent receives it on WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <ClassSectionPicker departments={departments} value={klass} onChange={setKlass} />
            <Input label="Roll No." id="roll" value={rollNo} onChange={(e) => setRollNo(e.target.value)} required />
            <Input
              label="Parent Phone Number"
              id="parent-phone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          <Input label="Brief Subject / Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Detailed Description *</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
          </div>

          <AttachmentUploader files={attachments} onFilesChange={setAttachments} />

          {message && (
            <p style={{ fontSize: '0.8125rem', color: message.type === 'error' ? 'var(--status-not-solved-text)' : 'var(--status-resolved-text)' }}>
              {message.text}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting} icon={Send}>Submit Report</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportStudent;
