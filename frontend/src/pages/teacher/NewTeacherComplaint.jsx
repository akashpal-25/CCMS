import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AttachmentUploader from '../../components/complaints/AttachmentUploader';
import { getErrorMessage } from '../../utils/errorHandler';

// Teacher ki apni complaint: category (General / HOD), title, description, attachment
const NewTeacherComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryCode, setCategoryCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const submittingRef = useRef(false); // double click se bachne ke liye

  useEffect(() => {
    complaintService.getTeacherCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setCategoryCode(data[0].code);
    });
  }, []);

  const validate = () => {
    const errs = {};
    if (!categoryCode) errs.category = 'Please select a category.';
    if (!title || title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';
    if (!description || description.trim().length < 10) errs.description = 'Please provide a detailed description (minimum 10 characters).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setServerError(null);
    try {
      const created = await complaintService.submitTeacherComplaint({ categoryCode, title, description });
      for (const f of attachments) {
        if (f.file) await complaintService.uploadAttachment(created.id, f.file);
      }
      navigate('/admin/teacher/complaints');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not submit complaint.'));
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const selectStyle = { padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', outline: 'none', fontSize: '0.875rem' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        Back
      </Button>

      <Card style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>New Complaint (Academic)</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            General complaints go to your HOD and the Director. Choose "Against HOD" to send it only to the Director.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category *</label>
            <select value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} style={selectStyle}>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {errors.category && <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)' }}>{errors.category}</span>}
          </div>

          <Input label="Brief Subject / Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Detailed Description *</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.description ? 'var(--status-not-solved-text)' : 'var(--color-border)'}`, outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
            {errors.description && <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)' }}>{errors.description}</span>}
          </div>

          <AttachmentUploader files={attachments} onFilesChange={setAttachments} />

          {serverError && <p style={{ fontSize: '0.8125rem', color: 'var(--status-not-solved-text)' }}>{serverError}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting} icon={Send}>Submit Complaint</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewTeacherComplaint;
