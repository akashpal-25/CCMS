import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { useStudentStore } from '../../store/studentStore';
import { complaintService } from '../../services/complaintService';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AttachmentUploader from '../../components/complaints/AttachmentUploader';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submitComplaint, isLoading } = useStudentStore();

  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [domainCode, setDomainCode] = useState(location.state?.defaultDomainCode || '');
  const [categoryCode, setCategoryCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    complaintService.getActiveDomains().then((data) => {
      setDomains(data);
      if (!domainCode && data.length > 0) setDomainCode(data[0].code);
    });
  }, []);

  useEffect(() => {
    if (!domainCode) return;
    complaintService.getActiveCategories(domainCode).then((data) => {
      setCategories(data);
      setCategoryCode(''); // "no specific category" default
    });
  }, [domainCode]);

  const validate = () => {
    const errs = {};
    if (!domainCode) errs.domain = 'Please select a domain.';
    if (!title || title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';
    if (!description || description.trim().length < 20) errs.description = 'Please provide a detailed description (minimum 20 characters).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const created = await submitComplaint(
        { domainCode, categoryCode: categoryCode || null, title, description },
        attachments
      );
      navigate(`/student/complaints/${created.id}`);
    } catch {
      // error store me handle ho chuka hai
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        Back
      </Button>

      <Card style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Submit Formal Grievance</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Fill out the details below. The CCMS auto-routing engine will dispatch this directly to the responsible authority.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Grievance Domain *</label>
            <select
              value={domainCode}
              onChange={(e) => setDomainCode(e.target.value)}
              style={{ padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', outline: 'none', fontSize: '0.875rem' }}
            >
              {domains.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
            {errors.domain && <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)' }}>{errors.domain}</span>}
          </div>

          {categories.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Specific Category (optional)</label>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                style={{ padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', outline: 'none', fontSize: '0.875rem' }}
              >
                <option value="">General (no specific category)</option>
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Brief Subject / Title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Discrepancy in Continuous Assessment (CA-1) attendance marks"
            error={errors.title}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Detailed Description *</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the dates, subject codes, faculty name or exact location of the issue..."
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.description ? 'var(--status-not-solved-text)' : 'var(--color-border)'}`, outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
            {errors.description && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)' }}>{errors.description}</span>
            )}
          </div>

          <AttachmentUploader files={attachments} onFilesChange={setAttachments} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading} icon={Send}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubmitComplaint;